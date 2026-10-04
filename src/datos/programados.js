// Movimientos programados (arriendo cada mes, sueldo cada quincena…). Modelo en db.js (versión 5).
// Decidido por el dueño (2026-10-03): al abrir la app, cada fecha que ya llegó se registra como un
// movimiento **pendiente** (que luego se marca como pagado); las futuras solo se ven en Planes.
// Una PWA en el iPhone no corre en segundo plano: por eso se hace al abrir, no a la hora exacta.
import { aFecha, hoyTexto } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';

export const FRECUENCIAS = [
  { valor: 'dia', texto: 'Cada día' },
  { valor: 'semana', texto: 'Cada semana' },
  { valor: 'quincena', texto: 'Cada quincena' },
  { valor: 'mes', texto: 'Cada mes' },
  { valor: 'anio', texto: 'Cada año' },
];

export const textoFrecuencia = (valor) => FRECUENCIAS.find((f) => f.valor === valor)?.texto ?? '';

const dos = (n) => String(n).padStart(2, '0');
const aTexto = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const diasDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();
// Ese día del mes, o el último si el mes es más corto (31 en febrero → 28 o 29).
const enElMes = (anio, mes, dia) => new Date(anio, mes, Math.min(dia, diasDelMes(anio, mes)));

// Fechas de un programado entre 'desde' y 'hasta' (incluidas), sin pasar de su fin.
// Quincena: el día en que empieza y 15 días después (o antes) de cada mes, como 15 y 30.
export function fechasEntre(p, desde, hasta) {
  const fin = p.termina && p.termina < hasta ? p.termina : hasta;
  const inicio = aFecha(p.empieza);
  const fechas = [];
  const agregar = (d) => {
    const texto = aTexto(d);
    if (texto >= p.empieza && texto >= desde && texto <= fin) fechas.push(texto);
  };
  if (p.frecuencia === 'dia' || p.frecuencia === 'semana') {
    const paso = p.frecuencia === 'dia' ? 1 : 7;
    const d = new Date(inicio);
    // Saltar directo cerca de 'desde' para no recorrer años de fechas.
    const saltos = Math.max(0, Math.floor((aFecha(desde) - inicio) / 86400000 / paso) - 1);
    d.setDate(d.getDate() + saltos * paso);
    for (; aTexto(d) <= fin; d.setDate(d.getDate() + paso)) agregar(d);
    return fechas;
  }
  const dia = inicio.getDate();
  const otroDia = dia <= 15 ? dia + 15 : dia - 15;
  const desdeFecha = aFecha(desde < p.empieza ? p.empieza : desde);
  const finFecha = aFecha(fin);
  for (let anio = desdeFecha.getFullYear(); anio <= finFecha.getFullYear(); anio += 1) {
    for (let mes = 0; mes < 12; mes += 1) {
      if (p.frecuencia === 'anio' && mes !== inicio.getMonth()) continue;
      const delMes = [enElMes(anio, mes, dia)];
      if (p.frecuencia === 'quincena') delMes.push(enElMes(anio, mes, otroDia));
      delMes.sort((a, b) => a - b).forEach(agregar);
    }
  }
  return fechas;
}

// El día siguiente a una fecha 'AAAA-MM-DD'.
function diaSiguiente(texto) {
  const d = aFecha(texto);
  d.setDate(d.getDate() + 1);
  return aTexto(d);
}

// Fechas futuras (después de lo ya registrado) de un programado en un rango, para mostrarlas.
export function fechasFuturas(p, desde, hasta) {
  const despuesDe = p.hasta ? diaSiguiente(p.hasta) : p.empieza;
  return fechasEntre(p, desde > despuesDe ? desde : despuesDe, hasta);
}

// Registra como movimientos pendientes las fechas que ya llegaron y aún no se registraron.
// Se puede llamar varias veces: lo registrado queda en 'hasta' y no se repite.
let registrando = null;
export function registrarVencidos() {
  if (registrando) return registrando;
  registrando = db
    .transaction('rw', db.programados, db.movimientos, async () => {
      const hoy = hoyTexto();
      for (const p of await db.programados.toArray()) {
        const fechas = fechasFuturas(p, '0000-01-01', hoy);
        if (fechas.length === 0) continue;
        await db.movimientos.bulkAdd(
          fechas.map((fecha, i) => ({
            id: nuevoId(),
            tipo: p.tipo,
            valor: p.valor,
            descripcion: p.descripcion,
            categoriaId: p.categoriaId,
            cuentaId: p.cuentaId,
            cuentaDestinoId: p.cuentaDestinoId,
            fecha,
            hora: null, // se registra solo al abrir la app: no es la hora en que se hizo
            pagado: false,
            etiquetaIds: p.etiquetaIds ?? [],
            observacion: p.observacion ?? '',
            tarjetaId: null,
            cuotas: null,
            factura: null,
            programadoId: p.id,
            creado: Date.now() + i,
          })),
        );
        await db.programados.update(p.id, { hasta: fechas.at(-1) });
      }
    })
    .finally(() => {
      registrando = null;
    });
  return registrando;
}

// datos: los del formulario (como un movimiento) más frecuencia, empieza y termina.
// Sin id = programado nuevo. Al editar, lo ya registrado no cambia; desde hoy rige lo nuevo.
export async function guardarProgramado(id, datos) {
  const transferencia = datos.tipo === 'transferencia';
  const campos = {
    tipo: datos.tipo,
    valor: Math.round(datos.valor),
    descripcion: datos.descripcion.trim(),
    categoriaId: transferencia ? null : datos.categoriaId,
    cuentaId: datos.cuentaId,
    cuentaDestinoId: transferencia ? datos.cuentaDestinoId : null,
    etiquetaIds: transferencia ? [] : [...new Set(datos.etiquetaIds)],
    observacion: datos.observacion.trim(),
    frecuencia: datos.frecuencia,
    empieza: datos.fecha,
    termina: datos.termina && datos.termina >= datos.fecha ? datos.termina : null,
  };
  if (id) {
    const anterior = await db.programados.get(id);
    // Si se mueve el inicio a una fecha posterior a lo registrado, se sigue desde ahí.
    const hasta = anterior?.hasta && anterior.hasta >= campos.empieza ? anterior.hasta : null;
    await db.programados.update(id, { ...campos, hasta });
  } else {
    await db.programados.add({ ...campos, id: nuevoId(), hasta: null, orden: ordenAlFinal() });
  }
  await registrarVencidos();
}

// Los movimientos ya registrados se quedan (son historia); solo dejan de crearse nuevos.
export const eliminarProgramado = (id) => db.programados.delete(id);
