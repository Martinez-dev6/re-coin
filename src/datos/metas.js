// Metas de ahorro y sus aportes. Modelo en db.js (versión 5).
// Decidido por el dueño (2026-10-03): aportar solo suma a la meta, no mueve dinero entre cuentas
// (la plata ya está en la cuenta "Se guarda en", que es solo informativa).
import { aFecha, hoyTexto } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';

// Lo ahorrado en cada meta: "Ya tengo" más sus aportes.
export function ahorradoPorMeta(metas, aportes) {
  const ahorrado = new Map(metas.map((m) => [m.id, m.ahorradoInicial ?? 0]));
  for (const a of aportes) if (ahorrado.has(a.metaId)) ahorrado.set(a.metaId, ahorrado.get(a.metaId) + a.valor);
  return ahorrado;
}

// Cada cuánto se quiere ahorrar para una meta (pedido del dueño, 2026-10-04; antes solo al mes).
// cada: cómo se lee en las frases ("ahorra $ 10.000 a la semana").
export const FRECUENCIAS_META = [
  { valor: 'dia', texto: 'Diario', cada: 'al día' },
  { valor: 'semana', texto: 'Semanal', cada: 'a la semana' },
  { valor: 'quincena', texto: 'Quincenal', cada: 'a la quincena' },
  { valor: 'mes', texto: 'Mensual', cada: 'al mes' },
];
// Las metas de antes no tienen frecuencia: son mensuales.
export const frecuenciaMeta = (valor) => FRECUENCIAS_META.find((f) => f.valor === valor) ?? FRECUENCIAS_META[3];

const DIA_MS = 24 * 60 * 60 * 1000;
const diasEntre = (desde, hasta) => Math.round((hasta - desde) / DIA_MS);

// Primer día de la semana de una fecha (lunes o domingo, como en Ajustes).
function inicioSemana(fecha, semanaEmpieza) {
  const corrimiento = semanaEmpieza === 'domingo' ? fecha.getDay() : (fecha.getDay() + 6) % 7;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - corrimiento);
}

// Quincena como número corrido: del 1 al 15 es la primera del mes y del 16 al final, la segunda.
const numeroQuincena = (fecha) => fecha.getFullYear() * 24 + fecha.getMonth() * 2 + (fecha.getDate() > 15 ? 1 : 0);

// Periodos que quedan hasta la fecha límite contando el actual (hoy, esta semana, esta quincena o
// este mes), como ya se hacía con los meses: de octubre a diciembre son 3 meses. Si la fecha ya
// pasó, 1.
export function periodosRestantes(fechaLimite, frecuencia = 'mes', semanaEmpieza = 'lunes') {
  const hoy = aFecha(hoyTexto());
  const limite = aFecha(fechaLimite);
  let periodos;
  if (frecuencia === 'dia') periodos = diasEntre(hoy, limite) + 1;
  else if (frecuencia === 'semana') periodos = diasEntre(inicioSemana(hoy, semanaEmpieza), inicioSemana(limite, semanaEmpieza)) / 7 + 1;
  else if (frecuencia === 'quincena') periodos = numeroQuincena(limite) - numeroQuincena(hoy) + 1;
  else periodos = (limite.getFullYear() - hoy.getFullYear()) * 12 + limite.getMonth() - hoy.getMonth() + 1;
  return Math.max(1, periodos);
}

// Cuánto ahorrar en cada periodo para llegar a tiempo (0 si ya se cumplió).
export const ahorroPorPeriodo = (objetivo, ahorrado, fechaLimite, frecuencia, semanaEmpieza) =>
  Math.max(0, Math.ceil((objetivo - ahorrado) / periodosRestantes(fechaLimite, frecuencia, semanaEmpieza)));

// datos: { nombre, objetivo, fechaLimite, frecuencia, ahorradoInicial, cuentaId, icono }. Sin id = meta nueva.
export async function guardarMeta(id, datos) {
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error('Escribe el nombre de la meta.');
  if (!(datos.objetivo > 0)) throw new Error('Escribe el monto objetivo.');
  const campos = {
    nombre,
    objetivo: Math.round(datos.objetivo),
    fechaLimite: datos.fechaLimite,
    frecuencia: frecuenciaMeta(datos.frecuencia).valor,
    ahorradoInicial: Math.max(0, Math.round(datos.ahorradoInicial) || 0),
    cuentaId: datos.cuentaId ?? null,
    icono: datos.icono,
    // Color del ícono (Sesión 13, pedido del dueño): una letra de la paleta de las categorías, o null
    // (las metas de antes: verde con el color de los íconos Variado, el del tema con Del tema).
    color: typeof datos.color === 'string' ? datos.color : null,
  };
  if (id) {
    await db.metas.update(id, campos);
    return id;
  }
  const nueva = { ...campos, id: nuevoId(), orden: ordenAlFinal() };
  await db.metas.add(nueva);
  return nueva.id;
}

// Se borran también sus aportes.
export function eliminarMeta(id) {
  return db.transaction('rw', db.metas, db.aportes, async () => {
    await db.aportes.where('metaId').equals(id).delete();
    await db.metas.delete(id);
  });
}

export function aportar(metaId, valor) {
  if (!(valor > 0)) return Promise.resolve();
  return db.aportes.add({ id: nuevoId(), metaId, valor: Math.round(valor), fecha: hoyTexto() });
}

export const eliminarAporte = (id) => db.aportes.delete(id);
