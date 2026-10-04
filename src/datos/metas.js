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

// Meses que quedan contando el actual: de octubre a diciembre son 3. Si la fecha ya pasó, 1.
export function mesesRestantes(fechaLimite) {
  const hoy = aFecha(hoyTexto());
  const limite = aFecha(fechaLimite);
  return Math.max(1, (limite.getFullYear() - hoy.getFullYear()) * 12 + limite.getMonth() - hoy.getMonth() + 1);
}

// Cuánto ahorrar al mes para llegar a tiempo (0 si ya se cumplió).
export const ahorroMensual = (objetivo, ahorrado, fechaLimite) =>
  Math.max(0, Math.ceil((objetivo - ahorrado) / mesesRestantes(fechaLimite)));

// datos: { nombre, objetivo, fechaLimite, ahorradoInicial, cuentaId, icono }. Sin id = meta nueva.
export async function guardarMeta(id, datos) {
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error('Escribe el nombre de la meta.');
  if (!(datos.objetivo > 0)) throw new Error('Escribe el monto objetivo.');
  const campos = {
    nombre,
    objetivo: Math.round(datos.objetivo),
    fechaLimite: datos.fechaLimite,
    ahorradoInicial: Math.max(0, Math.round(datos.ahorradoInicial) || 0),
    cuentaId: datos.cuentaId ?? null,
    icono: datos.icono,
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
