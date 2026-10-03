// Cuentas: tipos, saldo y guardado.
import { db, nuevoId, ordenAlFinal } from './db.js';

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

// Por ahora el saldo es el inicial; con los movimientos (paso 5) se les sumarán.
export const saldoDeCuenta = (cuenta) => cuenta.saldoInicial;

// Saldo de las cuentas marcadas "En el saldo".
export const saldoTotal = (cuentas) => cuentas.reduce((total, c) => total + (c.incluirEnSaldo ? c.saldo : 0), 0);

// datos: { nombre, tipo, saldoInicial, icono, incluirEnSaldo }. Sin id = cuenta nueva.
export async function guardarCuenta(id, datos) {
  const nombre = datos.nombre.trim() || tipoCuenta(datos.tipo).texto;
  const campos = {
    nombre,
    tipo: datos.tipo,
    saldoInicial: Math.max(0, Math.round(datos.saldoInicial) || 0),
    icono: datos.icono,
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

export const eliminarCuenta = (id) => db.cuentas.delete(id);
