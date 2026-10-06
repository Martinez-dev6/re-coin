// Movimientos: ingresos, gastos, transferencias, gastos con tarjeta y pagos de tarjeta.
// Modelo en db.js (versiones 2 a 4).
// Decidido por el dueño (2026-10-03):
// - El saldo de una cuenta es su saldo inicial más los movimientos pagados; los pendientes no
//   cuentan hasta marcarlos como pagados.
// - Las transferencias solo mueven saldo entre cuentas: no son ingresos ni gastos del mes.
// - Los gastos con tarjeta no tocan las cuentas (van a las facturas; ver tarjetas.js) y cada
//   cuota cuenta como gasto en el mes en que se paga. El pago de una factura resta de la cuenta
//   y, como una transferencia, no es gasto otra vez.
import { horaActual, hoyTexto, textoDeFecha } from '../utilidades/fechas.js';
import { db, nuevoId } from './db.js';

// Las tres opciones de arriba del formulario (el gasto con tarjeta tiene su formulario).
export const TIPOS_MOVIMIENTO = [
  { valor: 'ingreso', texto: 'Ingreso' },
  { valor: 'gasto', texto: 'Gasto' },
  { valor: 'transferencia', texto: 'Transferencia' },
];

// Gastos del mes: también los de tarjeta (en el mes de la compra).
export const esGasto = (m) => m.tipo === 'gasto' || m.tipo === 'gastoTarjeta';

// Saldo de cada cuenta por id: saldo inicial + ajustes de saldo (Reajustar saldo, "Solo corregir")
// + movimientos pagados.
export function saldosPorCuenta(cuentas, movimientos) {
  const saldos = new Map(cuentas.map((c) => [c.id, c.saldoInicial + (c.ajuste ?? 0)]));
  const sumar = (id, valor) => saldos.has(id) && saldos.set(id, saldos.get(id) + valor);
  for (const m of movimientos) {
    if (!m.pagado) continue;
    if (m.tipo === 'ingreso') sumar(m.cuentaId, m.valor);
    else if (m.tipo === 'gasto' || m.tipo === 'pagoTarjeta') sumar(m.cuentaId, -m.valor);
    else if (m.tipo === 'transferencia') {
      sumar(m.cuentaId, -m.valor);
      sumar(m.cuentaDestinoId, m.valor);
    }
    // gastoTarjeta: no toca las cuentas.
  }
  return saldos;
}

// Saldo de las cuentas que suman al saldo al cerrar un mes pasado (Sesión 10, pedido del dueño):
// como el de hoy, pero solo con los movimientos pagados hasta el último día de ese mes. Lo
// corregido con Reajustar saldo ("Solo corregir") no tiene fecha: cuenta siempre.
export function saldoAlCierre(cuentas, movimientos, anio, mes) {
  const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`;
  const saldos = saldosPorCuenta(cuentas, movimientos.filter((m) => m.fecha <= fin));
  return cuentas.reduce((total, c) => total + (c.incluirEnSaldo ? saldos.get(c.id) : 0), 0);
}

// Más recientes primero; los del mismo día, el último registrado primero.
export const ordenarMovimientos = (lista) =>
  [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.creado ?? 0) - (a.creado ?? 0));

// Título de un movimiento en las listas: la descripción o, sin ella, la categoría.
export function tituloMovimiento(m, categoria) {
  if (m.descripcion) return m.descripcion;
  if (m.tipo === 'transferencia') return 'Transferencia';
  if (m.tipo === 'pagoTarjeta') return 'Pago de tarjeta';
  return categoria(m.categoriaId)?.nombre ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto');
}

// Texto pequeño bajo el título en las listas: "Transporte · Nequi", "Nequi → Ahorros",
// "Transporte · Cuota 1 de 2 · Tarjeta principal" (la cuota antes de la tarjeta, para que no la
// corten los puntos suspensivos). datos: lo de useDatos().
export function detalleMovimiento(m, { cuenta, categoria, tarjeta }) {
  const nombreCuenta = (id) => cuenta(id)?.nombre ?? 'Cuenta eliminada';
  const nombreTarjeta = tarjeta(m.tarjetaId)?.nombre ?? 'Tarjeta eliminada';
  const nombreCategoria = categoria(m.categoriaId)?.nombre ?? 'Sin categoría';
  if (m.tipo === 'transferencia') return `${nombreCuenta(m.cuentaId)} → ${nombreCuenta(m.cuentaDestinoId)}`;
  if (m.tipo === 'pagoTarjeta') return `${nombreCuenta(m.cuentaId)} → ${nombreTarjeta}`;
  if (m.tipo === 'gastoTarjeta') {
    const cuota = m.cuotas > 1 && m.cuota ? ` · Cuota ${m.cuota} de ${m.cuotas}` : '';
    return `${nombreCategoria}${cuota} · ${nombreTarjeta}`;
  }
  return `${nombreCategoria} · ${nombreCuenta(m.cuentaId)}`;
}

// Estado en las listas: solo "Pendiente" (gastos, ingresos, cuotas de tarjeta sin pagar su
// factura y transferencias programadas sin hacer). Lo pagado o recibido va sin estado (pedido del
// dueño, Sesión 10). Los pagos de tarjeta nunca llevan.
export function estadoMovimiento(m) {
  if (m.tipo === 'pagoTarjeta' || m.pagado) return undefined;
  return 'pendiente';
}

// Adónde lleva tocar una fila: una cuota de tarjeta abre su factura (donde se paga); lo demás,
// el detalle del movimiento.
export function rutaMovimiento(m) {
  if (m.movimientoId) return `/facturas/${m.tarjetaId}/${m.factura}`;
  return `/movimientos/${m.id}`;
}

// Lo que le falta a un movimiento para poder guardarse (o null). campo: dónde llevar al usuario.
export function faltante(datos) {
  if (!(datos.valor > 0)) return { campo: 'valor', texto: 'Escribe el valor.' };
  if (datos.tipo === 'transferencia') {
    if (!datos.cuentaId) return { campo: 'cuentaId', texto: 'Elige la cuenta de origen.' };
    if (!datos.cuentaDestinoId) return { campo: 'cuentaDestinoId', texto: 'Elige la cuenta de destino.' };
    if (datos.cuentaId === datos.cuentaDestinoId) {
      return { campo: 'cuentaDestinoId', texto: 'Elige dos cuentas distintas.' };
    }
    return null;
  }
  // Un faltante o sobrante de Reajustar saldo puede quedar sin categoría.
  if (!datos.categoriaId && !datos.ajuste) return { campo: 'categoriaId', texto: 'Elige una categoría.' };
  if (datos.tipo === 'gastoTarjeta') {
    if (!datos.tarjetaId) return { campo: 'tarjetaId', texto: 'Elige una tarjeta.' };
    return null;
  }
  if (!datos.cuentaId) return { campo: 'cuentaId', texto: 'Elige una cuenta.' };
  return null;
}

// datos: los campos del formulario. Sin id = movimiento nuevo. Devuelve el id.
export async function guardarMovimiento(id, datos) {
  const { tipo } = datos;
  const transferencia = tipo === 'transferencia';
  const conTarjeta = tipo === 'gastoTarjeta';
  const campos = {
    tipo,
    valor: Math.round(datos.valor),
    descripcion: datos.descripcion.trim(),
    categoriaId: transferencia ? null : datos.categoriaId,
    cuentaId: conTarjeta ? null : datos.cuentaId,
    cuentaDestinoId: transferencia ? datos.cuentaDestinoId : null,
    fecha: datos.fecha || hoyTexto(),
    // 'ahora' (formulario con fecha de hoy, sin tocar la hora): la hora en que se guarda.
    hora: datos.hora === 'ahora' ? horaActual() : datos.hora || null,
    // Una transferencia nueva va hecha; al editar una programada aún pendiente, sigue pendiente.
    pagado: conTarjeta ? true : transferencia ? datos.pagado !== false : Boolean(datos.pagado),
    etiquetaIds: transferencia ? [] : [...new Set(datos.etiquetaIds)],
    observacion: datos.observacion.trim(),
    tarjetaId: conTarjeta ? datos.tarjetaId : null,
    cuotas: conTarjeta ? Math.max(1, datos.cuotas || 1) : null,
    factura: conTarjeta ? datos.factura : null,
  };
  if (id) {
    await db.movimientos.update(id, campos);
    return id;
  }
  // programadoId: el programado que se crea con él (guardarRecurrente en programados.js).
  const nuevo = { ...campos, id: nuevoId(), creado: Date.now(), programadoId: datos.programadoId ?? null };
  await db.movimientos.add(nuevo);
  return nuevo.id;
}

export const cambiarPagado = (id, pagado) => db.movimientos.update(id, { pagado });

// Hora de un movimiento ('HH:MM') o null (decidido por el dueño, 2026-10-04): lo que se registra
// al momento (con fecha de hoy) la lleva sola; para otra fecha es opcional y se elige a mano. Los
// de antes no tienen el campo: si se registraron el mismo día de su fecha, se toma la hora en que
// se crearon; si no (se anotaron después), no tienen hora.
export function horaDe(m) {
  if (m.hora !== undefined) return m.hora;
  if (!m.creado) return null;
  const creado = new Date(m.creado);
  if (textoDeFecha(creado) !== m.fecha) return null;
  return `${String(creado.getHours()).padStart(2, '0')}:${String(creado.getMinutes()).padStart(2, '0')}`;
}

// Marca como pagado (o recibido) un pendiente, desde la cuenta de la que de verdad salió (o a la
// que entró), que puede no ser la que se había puesto.
export const marcarPagado = (id, cuentaId) => db.movimientos.update(id, { pagado: true, cuentaId });

export const eliminarMovimiento = (id) => db.movimientos.delete(id);

// Movimientos que tocan una cuenta (como origen o como destino).
export async function movimientosDeCuenta(cuentaId) {
  const [origen, destino] = await Promise.all([
    db.movimientos.where('cuentaId').equals(cuentaId).primaryKeys(),
    db.movimientos.where('cuentaDestinoId').equals(cuentaId).primaryKeys(),
  ]);
  return [...new Set([...origen, ...destino])];
}
