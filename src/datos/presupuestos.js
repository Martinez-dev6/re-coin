// Presupuestos: un límite de gasto por categoría en un periodo. Modelo en db.js (versión 5).
// Decidido por el dueño (2026-10-03): cuentan todos los gastos del periodo de esa categoría
// (pagados, pendientes y cuotas de tarjeta que vencen en él), y el aviso de "Avisarme al" es
// dentro de la app (Inicio y Planes), sin notificaciones.
// Periodo (Sesión 9, pedido del dueño; antes siempre mensual): campo `periodo` opcional, 'semana' |
// 'quincena' | 'mes' | 'anio' (sin él, mensual). La semana empieza el día de Ajustes; la quincena va
// del 1 al 15 y del 16 al final; el año son 12 meses desde el mes en que empieza el presupuesto.
// Planes e Inicio se ven por mes: en el mes en curso cuenta el periodo de hoy; en un mes pasado, el
// de su último día, y en uno futuro, el de su primer día.
import { semanaEmpiezaActual } from '../estado/ajustes.js';
import { aFecha, hoyTexto, textoDeFecha } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';
import { esGasto } from './movimientos.js';

const dos = (n) => String(n).padStart(2, '0');
export const textoMes = (anio, mes) => `${anio}-${dos(mes + 1)}`;

export const PERIODOS = [
  { valor: 'semana', texto: 'Semanal', cada: 'cada semana', actual: 'esta semana' },
  { valor: 'quincena', texto: 'Quincenal', cada: 'cada quincena', actual: 'esta quincena' },
  { valor: 'mes', texto: 'Mensual', cada: 'cada mes', actual: 'este mes' },
  { valor: 'anio', texto: 'Anual', cada: 'cada año', actual: 'este año' },
];
// Los de antes no tienen periodo: son mensuales.
export const periodoDe = (p) => PERIODOS.find((x) => x.valor === p?.periodo) ?? PERIODOS[2];
// "esta semana", "esta quincena", "este año" para mostrar junto a las cifras; null si es mensual.
export const periodoActual = (p) => (periodoDe(p).valor === 'mes' ? null : periodoDe(p).actual);

// Desde y hasta ('AAAA-MM-DD', incluidos) del periodo de un presupuesto que contiene una fecha.
export function rangoPeriodo(p, fecha) {
  const d = aFecha(fecha);
  const anio = d.getFullYear();
  const mes = d.getMonth();
  const valor = periodoDe(p).valor;
  if (valor === 'semana') {
    const corrimiento = semanaEmpiezaActual() === 'domingo' ? d.getDay() : (d.getDay() + 6) % 7;
    const inicio = new Date(anio, mes, d.getDate() - corrimiento);
    return { desde: textoDeFecha(inicio), hasta: textoDeFecha(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6)) };
  }
  if (valor === 'quincena') {
    const primera = d.getDate() <= 15;
    return {
      desde: textoDeFecha(new Date(anio, mes, primera ? 1 : 16)),
      hasta: textoDeFecha(primera ? new Date(anio, mes, 15) : new Date(anio, mes + 1, 0)),
    };
  }
  if (valor === 'anio') {
    // Bloques de 12 meses desde el mes en que empieza el presupuesto.
    const [anioInicio, mesInicio] = p.desde.split('-').map(Number);
    const meses = (anio - anioInicio) * 12 + mes - (mesInicio - 1);
    const corrido = Math.floor(meses / 12) * 12;
    const inicio = new Date(anioInicio, mesInicio - 1 + corrido, 1);
    return { desde: textoDeFecha(inicio), hasta: textoDeFecha(new Date(inicio.getFullYear(), inicio.getMonth() + 12, 0)) };
  }
  return { desde: textoDeFecha(new Date(anio, mes, 1)), hasta: textoDeFecha(new Date(anio, mes + 1, 0)) };
}

// La fecha con la que se mira un mes: hoy si es el mes en curso, su último día si ya pasó y su
// primer día si es futuro.
export function fechaDelMes(anio, mes) {
  const hoy = hoyTexto();
  const primero = textoDeFecha(new Date(anio, mes, 1));
  const ultimo = textoDeFecha(new Date(anio, mes + 1, 0));
  if (hoy < primero) return primero;
  if (hoy > ultimo) return ultimo;
  return hoy;
}

// ¿Aplica en una fecha? Desde su primer periodo (el que contiene el primer día de su mes "Empieza")
// en adelante si se repite; si no, solo en ese primer periodo.
export function aplicaEn(p, fecha) {
  const primero = rangoPeriodo(p, `${p.desde}-01`);
  const actual = rangoPeriodo(p, fecha);
  if (p.repetir) return actual.desde >= primero.desde;
  return actual.desde === primero.desde;
}

// Estado de un presupuesto en el periodo que contiene una fecha: { gastado, usado (%), alerta
// ('limite' | 'excedido' | null), rango }. movimientosPorMes: los de DatosContext (con las cuotas
// de tarjeta en el día en que se pagan).
export function estadoEnFecha(p, movimientosPorMes, fecha) {
  const rango = rangoPeriodo(p, fecha);
  const gastado = movimientosPorMes
    .filter((m) => esGasto(m) && m.categoriaId === p.categoriaId && m.fecha >= rango.desde && m.fecha <= rango.hasta)
    .reduce((total, m) => total + m.valor, 0);
  const usado = p.limite > 0 ? Math.round((gastado / p.limite) * 100) : 0;
  let alerta = null;
  if (gastado > p.limite) alerta = 'excedido';
  else if (usado >= (p.avisarAl ?? 80)) alerta = 'limite';
  return { gastado, usado, alerta, rango };
}

// Los presupuestos que aplican al mirar un mes, con su estado, en el orden de la lista.
export function presupuestosDelMes(presupuestos, movimientosPorMes, anio, mes) {
  const fecha = fechaDelMes(anio, mes);
  return presupuestos
    .filter((p) => aplicaEn(p, fecha))
    .map((p) => ({ ...p, ...estadoEnFecha(p, movimientosPorMes, fecha) }));
}

// datos: { categoriaId, limite, periodo, desde, repetir, avisarAl }. Sin id = presupuesto nuevo.
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
    periodo: periodoDe(datos).valor,
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
