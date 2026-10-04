// Cuentas: tipos, saldo y guardado.
import { esAcento } from '../tema/colores.js';
import { db, nuevoId, ordenAlFinal } from './db.js';
import { movimientosDeCuenta } from './movimientos.js';

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

// El saldo de cada cuenta (inicial + movimientos pagados) lo calcula DatosContext con
// saldosPorCuenta (movimientos.js).

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

// Se borran también sus movimientos (los que salen de ella o llegan a ella), en una sola
// operación. El panel de confirmación avisa cuántos son.
// Las tarjetas que se pagaban desde ella quedan sin "Paga desde" y las metas que se guardaban
// en ella, sin "Se guarda en".
export function eliminarCuenta(id) {
  return db.transaction('rw', db.cuentas, db.movimientos, db.tarjetas, db.metas, async () => {
    await db.movimientos.bulkDelete(await movimientosDeCuenta(id));
    await db.tarjetas.filter((t) => t.cuentaPagoId === id).modify({ cuentaPagoId: null });
    await db.metas.filter((m) => m.cuentaId === id).modify({ cuentaId: null });
    await db.cuentas.delete(id);
  });
}
