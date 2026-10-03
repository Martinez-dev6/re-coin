// Movimientos: ingresos, gastos y transferencias. Modelo en db.js (versión 2).
// Decidido por el dueño (2026-10-03):
// - El saldo de una cuenta es su saldo inicial más los movimientos pagados; los pendientes no
//   cuentan hasta marcarlos como pagados.
// - Las transferencias solo mueven saldo entre cuentas: no son ingresos ni gastos del mes.
import { hoyTexto } from '../utilidades/fechas.js';
import { db, nuevoId } from './db.js';

export const TIPOS_MOVIMIENTO = [
  { valor: 'ingreso', texto: 'Ingreso' },
  { valor: 'gasto', texto: 'Gasto' },
  { valor: 'transferencia', texto: 'Transferencia' },
];

// Saldo de cada cuenta por id: saldo inicial + movimientos pagados.
export function saldosPorCuenta(cuentas, movimientos) {
  const saldos = new Map(cuentas.map((c) => [c.id, c.saldoInicial]));
  const sumar = (id, valor) => saldos.has(id) && saldos.set(id, saldos.get(id) + valor);
  for (const m of movimientos) {
    if (!m.pagado) continue;
    if (m.tipo === 'transferencia') {
      sumar(m.cuentaId, -m.valor);
      sumar(m.cuentaDestinoId, m.valor);
    } else {
      sumar(m.cuentaId, m.tipo === 'ingreso' ? m.valor : -m.valor);
    }
  }
  return saldos;
}

// Más recientes primero; los del mismo día, el último registrado primero.
export const ordenarMovimientos = (lista) =>
  [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.creado ?? 0) - (a.creado ?? 0));

// Título de un movimiento en las listas: la descripción o, sin ella, la categoría.
export function tituloMovimiento(m, categoria) {
  if (m.descripcion) return m.descripcion;
  if (m.tipo === 'transferencia') return 'Transferencia';
  return categoria(m.categoriaId)?.nombre ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto');
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
  if (!datos.categoriaId) return { campo: 'categoriaId', texto: 'Elige una categoría.' };
  if (!datos.cuentaId) return { campo: 'cuentaId', texto: 'Elige una cuenta.' };
  return null;
}

// datos: los campos del formulario. Sin id = movimiento nuevo. Devuelve el id.
export async function guardarMovimiento(id, datos) {
  const transferencia = datos.tipo === 'transferencia';
  const campos = {
    tipo: datos.tipo,
    valor: Math.round(datos.valor),
    descripcion: datos.descripcion.trim(),
    categoriaId: transferencia ? null : datos.categoriaId,
    cuentaId: datos.cuentaId,
    cuentaDestinoId: transferencia ? datos.cuentaDestinoId : null,
    fecha: datos.fecha || hoyTexto(),
    pagado: transferencia ? true : Boolean(datos.pagado),
    etiquetaIds: transferencia ? [] : [...new Set(datos.etiquetaIds)],
    observacion: datos.observacion.trim(),
  };
  if (id) {
    await db.movimientos.update(id, campos);
    return id;
  }
  const nuevo = { ...campos, id: nuevoId(), creado: Date.now() };
  await db.movimientos.add(nuevo);
  return nuevo.id;
}

export const cambiarPagado = (id, pagado) => db.movimientos.update(id, { pagado });

export const eliminarMovimiento = (id) => db.movimientos.delete(id);

// Movimientos que tocan una cuenta (como origen o como destino).
export async function movimientosDeCuenta(cuentaId) {
  const [origen, destino] = await Promise.all([
    db.movimientos.where('cuentaId').equals(cuentaId).primaryKeys(),
    db.movimientos.where('cuentaDestinoId').equals(cuentaId).primaryKeys(),
  ]);
  return [...new Set([...origen, ...destino])];
}
