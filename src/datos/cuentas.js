// Cuentas: tipos, saldo, reajuste de saldo y guardado.
import { esAcento } from '../tema/colores.js';
import { horaActual, hoyTexto } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';
import { eliminarProgramado } from './programados.js';

// corto: lo que se ve bajo el nombre en las listas (design/capturas/Cuentas.png).
export const TIPOS_CUENTA = [
  { valor: 'banco', texto: 'Cuenta bancaria', corto: 'Banco', icono: 'banco' },
  { valor: 'ahorros', texto: 'Ahorros', corto: 'Ahorros', icono: 'alcancia' },
  { valor: 'billetera', texto: 'Billetera digital', corto: 'Billetera', icono: 'billetera' },
  { valor: 'efectivo', texto: 'Efectivo', corto: 'En mano', icono: 'efectivo' },
  { valor: 'inversion', texto: 'Inversión', corto: 'Inversión', icono: 'tendencia' },
  { valor: 'otra', texto: 'Otra', corto: 'Otra', icono: 'moneda' },
];

export const tipoCuenta = (valor) => TIPOS_CUENTA.find((t) => t.valor === valor) ?? TIPOS_CUENTA.at(-1);

// El saldo de cada cuenta (inicial + ajustes + movimientos pagados) lo calcula DatosContext con
// saldosPorCuenta (movimientos.js).

// Reajustar saldo (pedido del dueño, 2026-10-04): cuando el saldo real no coincide con el de la
// app, se escribe el real y la app pone la diferencia. cuenta: la de useDatos (con su saldo).
// modo 'corregir': solo corrige el saldo. La diferencia se suma a cuenta.ajuste (sin
//   movimientos): no cambia ingresos, gastos ni transferencias, y el saldo inicial queda como se
//   escribió.
// modo 'registrar': la diferencia queda como un gasto "Faltante" o un ingreso "Sobrante", pagado y
//   de hoy, sin categoría (ajuste: true lo deja guardar así). Se edita como cualquier movimiento.
// modo 'transferir' (pedido del dueño, 2026-10-04): la diferencia fue a otra de las cuentas (si
//   falta) o vino de otra (si sobra): queda como una transferencia de hoy con otraCuentaId.
export async function reajustarSaldo(cuenta, saldoReal, modo, otraCuentaId = null) {
  const diferencia = Math.round(saldoReal) - cuenta.saldo;
  if (!diferencia) return;
  if (modo === 'corregir') {
    await db.cuentas.update(cuenta.id, { ajuste: (cuenta.ajuste ?? 0) + diferencia });
    return;
  }
  const sobra = diferencia > 0;
  const transferir = modo === 'transferir';
  if (transferir && !otraCuentaId) throw new Error('Elige la otra cuenta.');
  let tipo = sobra ? 'ingreso' : 'gasto';
  if (transferir) tipo = 'transferencia';
  await db.movimientos.add({
    id: nuevoId(),
    tipo,
    valor: Math.abs(diferencia),
    descripcion: transferir ? 'Reajuste de saldo' : sobra ? 'Sobrante' : 'Faltante',
    categoriaId: null,
    // En una transferencia, si sobra el dinero vino de la otra cuenta; si falta, se fue a ella.
    cuentaId: transferir && sobra ? otraCuentaId : cuenta.id,
    cuentaDestinoId: transferir ? (sobra ? cuenta.id : otraCuentaId) : null,
    fecha: hoyTexto(),
    hora: horaActual(),
    pagado: true,
    etiquetaIds: [],
    // Sin observación automática (pedido del dueño, 2026-10-04): antes decía cuánto tenía la app.
    observacion: '',
    tarjetaId: null,
    cuotas: null,
    factura: null,
    ajuste: true,
    creado: Date.now(),
  });
}

// Saldo de las cuentas marcadas "En el saldo".
export const saldoTotal = (cuentas) => cuentas.reduce((total, c) => total + (c.incluirEnSaldo ? c.saldo : 0), 0);

// datos: { nombre, tipo, saldoInicial, icono, color, incluirEnSaldo }. Sin id = cuenta nueva.
// color: uno de los 10 colores del tema (colores.js) o null = Predeterminado (el del tema).
export async function guardarCuenta(id, datos) {
  const nombre = datos.nombre.trim() || tipoCuenta(datos.tipo).texto;
  const campos = {
    nombre,
    tipo: datos.tipo,
    saldoInicial: Math.max(0, Math.round(datos.saldoInicial) || 0),
    icono: datos.icono,
    color: esAcento(datos.color) ? datos.color : null,
    incluirEnSaldo: Boolean(datos.incluirEnSaldo),
  };
  if (id) {
    await db.cuentas.update(id, campos);
    return id;
  }
  const nueva = { ...campos, id: nuevoId(), orden: ordenAlFinal() };
  await db.cuentas.add(nueva);
  return nueva.id;
}

// Sus movimientos se quedan (decisión del dueño, Sesión 11): borrarlos cambiaría el saldo de las
// otras cuentas (transferencias), dejaría sin pagar las facturas que se pagaron desde ella y borraría
// gastos e ingresos de meses pasados. En las listas salen con "Cuenta eliminada" y no suman a
// ningún saldo.
// Las tarjetas que se pagaban desde ella quedan sin "Paga desde" y las metas que se guardaban en
// ella, sin "Se guarda en". Los programados que la usan se borran como con "Solo el programado"
// (ya no tendrían de dónde salir): lo registrado se queda, menos lo adelantado.
export function eliminarCuenta(id) {
  return db.transaction('rw', [db.cuentas, db.movimientos, db.tarjetas, db.metas, db.programados], async () => {
    await db.tarjetas.filter((t) => t.cuentaPagoId === id).modify({ cuentaPagoId: null });
    await db.metas.filter((m) => m.cuentaId === id).modify({ cuentaId: null });
    const programados = await db.programados.filter((p) => p.cuentaId === id || p.cuentaDestinoId === id).primaryKeys();
    for (const programadoId of programados) await eliminarProgramado(programadoId, 'solo');
    await db.cuentas.delete(id);
  });
}
