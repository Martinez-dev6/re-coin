// Presupuestos: un límite de gasto al mes por categoría. Modelo en db.js (versión 5).
// Decidido por el dueño (2026-10-03): cuentan todos los gastos del mes de esa categoría
// (pagados, pendientes y cuotas de tarjeta que vencen en el mes), y el aviso de "Avisarme al" es
// dentro de la app (Inicio y Planes), sin notificaciones.
import { enMes } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';
import { esGasto } from './movimientos.js';

const dos = (n) => String(n).padStart(2, '0');
export const textoMes = (anio, mes) => `${anio}-${dos(mes + 1)}`;

// ¿Aplica en ese mes? Desde su primer mes en adelante si se repite; si no, solo ese mes.
export const aplicaEn = (p, mesTexto) => (p.repetir ? p.desde <= mesTexto : p.desde === mesTexto);

// Estado de un presupuesto en un mes: { gastado, usado (%), alerta ('limite' | 'excedido' | null) }.
// movimientosPorMes: los de DatosContext (con las cuotas de tarjeta en su mes).
export function estadoEnMes(p, movimientosPorMes, anio, mes) {
  const gastado = movimientosPorMes
    .filter((m) => esGasto(m) && m.categoriaId === p.categoriaId && enMes(m.fecha, anio, mes))
    .reduce((total, m) => total + m.valor, 0);
  const usado = p.limite > 0 ? Math.round((gastado / p.limite) * 100) : 0;
  let alerta = null;
  if (gastado > p.limite) alerta = 'excedido';
  else if (usado >= (p.avisarAl ?? 80)) alerta = 'limite';
  return { gastado, usado, alerta };
}

// Los presupuestos que aplican en un mes, con su estado, en el orden de la lista.
export function presupuestosDelMes(presupuestos, movimientosPorMes, anio, mes) {
  const mesTexto = textoMes(anio, mes);
  return presupuestos
    .filter((p) => aplicaEn(p, mesTexto))
    .map((p) => ({ ...p, ...estadoEnMes(p, movimientosPorMes, anio, mes) }));
}

// datos: { categoriaId, limite, desde, repetir, avisarAl }. Sin id = presupuesto nuevo.
// No puede haber dos presupuestos de la misma categoría que se crucen en algún mes.
export async function guardarPresupuesto(id, datos, nombreCategoria) {
  if (!datos.categoriaId) throw new Error('Elige una categoría.');
  if (!(datos.limite > 0)) throw new Error('Escribe el límite.');
  const deLaCategoria = await db.presupuestos.where('categoriaId').equals(datos.categoriaId).toArray();
  const otros = deLaCategoria.filter((p) => p.id !== id);
  const cruza = (p) =>
    (p.repetir && datos.repetir) ||
    (p.repetir ? p.desde <= datos.desde : datos.repetir ? datos.desde <= p.desde : p.desde === datos.desde);
  if (otros.some(cruza)) throw new Error(`Ya hay un presupuesto de ${nombreCategoria}. Edítalo en vez de crear otro.`);
  const campos = {
    categoriaId: datos.categoriaId,
    limite: Math.round(datos.limite),
    desde: datos.desde,
    repetir: Boolean(datos.repetir),
    avisarAl: Math.min(100, Math.max(50, Math.round(datos.avisarAl) || 80)),
  };
  if (id) {
    await db.presupuestos.update(id, campos);
    return id;
  }
  const nuevo = { ...campos, id: nuevoId(), orden: ordenAlFinal() };
  await db.presupuestos.add(nuevo);
  return nuevo.id;
}

export const eliminarPresupuesto = (id) => db.presupuestos.delete(id);
