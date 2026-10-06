// Movimientos programados (arriendo cada mes, sueldo cada quincena…). Modelo en db.js (versión 5).
// Decidido por el dueño (2026-10-03): al abrir la app, cada fecha registrada queda como un
// movimiento **pendiente** (que luego se marca como pagado). Desde la Sesión 9 (2026-10-05, pedido
// del dueño) se registran todas las fechas **hasta el fin del mes en curso**, no solo las que ya
// llegaron: así lo programado de este mes sale en Pendientes aunque aún no sea el día. Las de los
// meses siguientes se muestran sin registrarlas (programadosDelMes). Una PWA en el iPhone no corre
// en segundo plano: por eso se hace al abrir, no a la hora exacta.
// Desde la Sesión 9 los programados se crean desde el formulario de un gasto, ingreso o
// transferencia (interruptor "… recurrente", guardarRecurrente); en Planes solo se ven, se editan
// y se eliminan.
import { aFecha, hoyTexto, sumarMeses } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';
import { guardarMovimiento } from './movimientos.js';
import { facturaDeFecha, fechaPagoFactura } from './tarjetas.js';

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
    // omitidas: fechas que se quitaron una por una ("Eliminar solo este"); no se registran ni se ven.
    if (texto >= p.empieza && texto >= desde && texto <= fin && !(p.omitidas ?? []).includes(texto)) fechas.push(texto);
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

// Las fechas de un mes que aún no son movimientos (meses siguientes), como filas pendientes para
// Planes y Transacciones (Sesión 10, pedido del dueño: en Transacciones no salían). Un gasto con
// tarjeta programado va, como sus cuotas, el día en que se paga su factura. tarjeta: buscar por id.
export function programadosDelMes(programados, tarjeta, anio, mes) {
  const dos = (n) => String(n).padStart(2, '0');
  const desde = `${anio}-${dos(mes + 1)}-01`;
  const hasta = `${anio}-${dos(mes + 1)}-${new Date(anio, mes + 1, 0).getDate()}`;
  return programados.flatMap((p) => {
    const t = p.tipo === 'gastoTarjeta' ? tarjeta(p.tarjetaId) : null;
    if (p.tipo === 'gastoTarjeta' && !t) return [];
    // Para una tarjeta, se buscan las compras desde un mes antes: su factura puede pagarse este mes.
    const desdeCompra = t ? `${sumarMeses(desde.slice(0, 7), -1)}-01` : desde;
    return fechasFuturas(p, desdeCompra, hasta)
      .map((compra) => ({
        ...p,
        id: `${p.id}-${compra}`,
        programadoId: p.id,
        fecha: t ? fechaPagoFactura(t, facturaDeFecha(t, compra)) : compra,
        compra, // la fecha propia del programado (en una tarjeta, la de la compra)
        pagado: false,
        futuro: true,
      }))
      .filter((item) => item.fecha >= desde && item.fecha <= hasta);
  });
}

// Último día del mes en curso ('AAAA-MM-DD'): hasta ahí se registra.
function finDeMes() {
  const hoy = new Date();
  return aTexto(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
}

// Registra como movimientos pendientes las fechas de este mes (hasta su último día) que aún no se
// registraron. Se puede llamar varias veces: lo registrado queda en 'hasta' y no se repite.
let registrando = null;
export function registrarVencidos() {
  if (registrando) return registrando;
  registrando = db
    .transaction('rw', db.programados, db.movimientos, db.tarjetas, async () => {
      const limite = finDeMes();
      const tarjetas = new Map((await db.tarjetas.toArray()).map((t) => [t.id, t]));
      for (const p of await db.programados.toArray()) {
        // Un gasto con tarjeta programado (Sesión 9: suscripciones) va a la factura que le toca por
        // su fecha; sin la tarjeta (se borró), ya no se registra.
        const tarjeta = p.tipo === 'gastoTarjeta' ? tarjetas.get(p.tarjetaId) : null;
        if (p.tipo === 'gastoTarjeta' && !tarjeta) continue;
        const fechas = fechasFuturas(p, '0000-01-01', limite);
        if (fechas.length === 0) continue;
        await db.movimientos.bulkAdd(
          fechas.map((fecha, i) => ({
            id: nuevoId(),
            tipo: p.tipo,
            valor: p.valor,
            descripcion: p.descripcion,
            categoriaId: p.categoriaId,
            cuentaId: tarjeta ? null : p.cuentaId,
            cuentaDestinoId: p.cuentaDestinoId,
            fecha,
            hora: null, // se registra solo al abrir la app: no es la hora en que se hizo
            // Un gasto con tarjeta queda pagado (lo pendiente es su factura); lo demás, pendiente.
            pagado: Boolean(tarjeta),
            etiquetaIds: p.etiquetaIds ?? [],
            observacion: p.observacion ?? '',
            tarjetaId: tarjeta ? p.tarjetaId : null,
            cuotas: tarjeta ? Math.max(1, p.cuotas || 1) : null,
            factura: tarjeta ? facturaDeFecha(tarjeta, fecha) : null,
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

// Plantilla del programado a partir de los datos del formulario (como un movimiento, más
// frecuencia y termina; su fecha es cuándo empieza).
function camposProgramado(datos) {
  const transferencia = datos.tipo === 'transferencia';
  const conTarjeta = datos.tipo === 'gastoTarjeta';
  return {
    tipo: datos.tipo,
    valor: Math.round(datos.valor),
    descripcion: datos.descripcion.trim(),
    categoriaId: transferencia ? null : datos.categoriaId,
    cuentaId: conTarjeta ? null : datos.cuentaId,
    cuentaDestinoId: transferencia ? datos.cuentaDestinoId : null,
    // Gasto con tarjeta: la tarjeta y en cuántas cuotas (la factura sale de cada fecha).
    tarjetaId: conTarjeta ? datos.tarjetaId : null,
    cuotas: conTarjeta ? Math.max(1, datos.cuotas || 1) : null,
    etiquetaIds: transferencia ? [] : [...new Set(datos.etiquetaIds)],
    observacion: datos.observacion.trim(),
    frecuencia: datos.frecuencia,
    empieza: datos.fecha,
    termina: datos.termina && datos.termina >= datos.fecha ? datos.termina : null,
  };
}

// Los pendientes de un programado registrados por adelantado (fecha después de hoy): al editarlo
// o eliminarlo se quitan, porque aún no han llegado.
const adelantados = (id) =>
  db.movimientos
    .where('programadoId')
    .equals(id)
    // Un gasto con tarjeta siempre está "pagado" (lo pendiente es su factura): cuenta por la fecha.
    .filter((m) => m.fecha > hoyTexto() && (m.tipo === 'gastoTarjeta' || !m.pagado));

// Ya realizado: pagado, o un gasto con tarjeta cuya fecha ya llegó.
const realizado = (m) => (m.tipo === 'gastoTarjeta' ? m.fecha <= hoyTexto() : m.pagado);

// datos: los del formulario. Sin id = programado nuevo. Al editar, lo registrado hasta hoy no
// cambia; lo registrado por adelantado se vuelve a crear con los datos nuevos.
export async function guardarProgramado(id, datos) {
  const campos = camposProgramado(datos);
  if (id) {
    await db.transaction('rw', db.programados, db.movimientos, async () => {
      const anterior = await db.programados.get(id);
      await adelantados(id).delete();
      // Queda registrado hasta hoy, o hasta un adelantado que ya se marcó como pagado.
      const quedan = await db.movimientos.where('programadoId').equals(id).toArray();
      const ultimo = quedan.reduce((max, m) => (m.fecha > max ? m.fecha : max), '');
      let hasta = anterior?.hasta ?? null;
      if (hasta && hasta > hoyTexto()) hasta = hoyTexto();
      if (hasta && ultimo > hasta) hasta = ultimo;
      // Si se mueve el inicio a una fecha posterior a lo registrado, se sigue desde ahí.
      if (hasta && hasta < campos.empieza) hasta = null;
      await db.programados.update(id, { ...campos, hasta });
    });
  } else {
    await db.programados.add({ ...campos, id: nuevoId(), hasta: null, orden: ordenAlFinal() });
  }
  await registrarVencidos();
}

// Un gasto, ingreso o transferencia nuevo con "… recurrente" prendido (Sesión 9): el movimiento de
// esa fecha (pagado o pendiente, como se dejó en el formulario) y el programado que lo repite. La
// primera fecha ya es ese movimiento, así que el programado registra desde la siguiente.
export async function guardarRecurrente(datos) {
  const campos = camposProgramado(datos);
  const programadoId = nuevoId();
  await db.transaction('rw', db.programados, db.movimientos, async () => {
    await db.programados.add({ ...campos, id: programadoId, hasta: campos.empieza, orden: ordenAlFinal() });
    await guardarMovimiento(null, { ...datos, programadoId });
  });
  await registrarVencidos();
}

// Formas de eliminar un programado (pedido del dueño, Sesión 9):
// - 'solo': deja de repetirse; lo ya registrado se queda en Transacciones (menos lo registrado por
//   adelantado, que aún no llega).
// - 'realizados': además borra sus movimientos ya pagados.
// - 'todo': el programado y todos sus movimientos, pagados y pendientes.
export function eliminarProgramado(id, modo = 'solo') {
  return db.transaction('rw', db.programados, db.movimientos, async () => {
    if (modo === 'todo') await db.movimientos.where('programadoId').equals(id).delete();
    else {
      await adelantados(id).delete();
      if (modo === 'realizados') await db.movimientos.where('programadoId').equals(id).filter(realizado).delete();
    }
    await db.programados.delete(id);
  });
}

// Quitar una sola fecha de un programado (Sesión 9, pedido del dueño: "de un programado de 10 días
// quiero eliminar solo uno"). Se borra su movimiento, si ya se había registrado, y la fecha queda en
// "omitidas" para que no se vuelva a crear (p. ej. al editar el programado). Para un gasto con tarjeta
// la fecha es la de la compra.
export function eliminarFecha(id, fecha) {
  return db.transaction('rw', db.programados, db.movimientos, async () => {
    const p = await db.programados.get(id);
    if (p) await db.programados.update(id, { omitidas: [...new Set([...(p.omitidas ?? []), fecha])] });
    await db.movimientos.where('programadoId').equals(id).filter((m) => m.fecha === fecha).delete();
  });
}

// Quitar una fecha y todas las que siguen: el programado termina el día anterior (si esa era la
// primera, se borra entero) y se borran sus movimientos de esa fecha en adelante.
export function eliminarDesde(id, fecha) {
  return db.transaction('rw', db.programados, db.movimientos, async () => {
    const p = await db.programados.get(id);
    await db.movimientos.where('programadoId').equals(id).filter((m) => m.fecha >= fecha).delete();
    if (!p) return;
    if (fecha <= p.empieza) {
      await db.programados.delete(id);
      return;
    }
    const d = aFecha(fecha);
    d.setDate(d.getDate() - 1);
    let termina = aTexto(d);
    if (p.termina && p.termina < termina) termina = p.termina;
    // Si ya no le queda nada por delante (todo lo que falta ya se registró y no queda ninguno después
    // de hoy), deja de ser un programado: se quita de "Tus programados" (pedido del dueño,
    // Sesión 9: tras borrar "este y los siguientes" seguía saliendo con su fecha final). Lo pasado se
    // queda en Transacciones.
    const quedan = await db.movimientos
      .where('programadoId')
      .equals(id)
      .filter((m) => m.fecha > hoyTexto())
      .count();
    if (quedan === 0 && (!p.hasta || termina <= p.hasta)) {
      await db.programados.delete(id);
      return;
    }
    await db.programados.update(id, { termina });
  });
}

// Un programado que ya terminó (su fecha final pasó): ya no se repite, no se muestra en la lista.
export const terminado = (p) => Boolean(p.termina && p.termina < hoyTexto());

// Lo que se copia de un movimiento a su serie al editarlo (no la fecha, la hora ni si se pagó).
const CAMPOS_SERIE = ['valor', 'descripcion', 'categoriaId', 'cuentaId', 'cuentaDestinoId', 'etiquetaIds', 'observacion', 'tarjetaId', 'cuotas'];

// ¿Cambió algo de lo que comparte con su serie? Si no (solo fecha, hora o pagado), no se pregunta.
export function cambiaLaSerie(original, datos) {
  const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  return CAMPOS_SERIE.some((campo) => {
    const nuevo = campo === 'valor' ? Math.round(datos.valor) : campo === 'descripcion' || campo === 'observacion' ? (datos[campo] ?? '').trim() : datos[campo];
    return !igual(original[campo], nuevo);
  });
}

// Aún por llegar: lo que no se ha pagado (un gasto con tarjeta, mientras su fecha no llega).
const porLlegar = (m) => (m.tipo === 'gastoTarjeta' ? m.fecha > hoyTexto() : !m.pagado);

// Editar un movimiento de un programado (Sesión 9, pedido del dueño: "que me pregunte si es solo
// este"). modo:
// - 'solo': solo este movimiento.
// - 'siguientes': este, los de la serie de su fecha en adelante que aún no se pagan, y la plantilla
//   del programado (lo que se registre después sale con los datos nuevos).
// - 'todos': este, todos los de la serie que aún no se pagan (también los de antes) y la plantilla.
// Lo ya pagado se queda como se registró: cambiarlo movería saldos del pasado.
export async function editarEnSerie(movimiento, datos, modo) {
  await guardarMovimiento(movimiento.id, datos);
  if (modo === 'solo' || !movimiento.programadoId) return;
  await db.transaction('rw', db.programados, db.movimientos, db.tarjetas, async () => {
    const p = await db.programados.get(movimiento.programadoId);
    if (!p) return;
    const plantilla = camposProgramado({ ...datos, frecuencia: p.frecuencia, fecha: p.empieza, termina: p.termina });
    delete plantilla.frecuencia;
    delete plantilla.empieza;
    delete plantilla.termina;
    await db.programados.update(p.id, plantilla);
    const tarjeta = plantilla.tarjetaId ? await db.tarjetas.get(plantilla.tarjetaId) : null;
    await db.movimientos
      .where('programadoId')
      .equals(p.id)
      .filter((m) => m.id !== movimiento.id && porLlegar(m) && (modo === 'todos' || m.fecha >= movimiento.fecha))
      .modify((m) => {
        Object.assign(m, plantilla);
        if (tarjeta) m.factura = facturaDeFecha(tarjeta, m.fecha);
      });
  });
}
