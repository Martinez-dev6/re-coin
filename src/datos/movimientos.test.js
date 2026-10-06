import { describe, expect, it } from 'vitest';
import { faltante, horaDe, saldoAlCierre, saldosPorCuenta } from './movimientos.js';

const cuentas = [
  { id: 'a', saldoInicial: 1000, ajuste: 50, incluirEnSaldo: true },
  { id: 'b', saldoInicial: 0, incluirEnSaldo: true },
  { id: 'c', saldoInicial: 400, incluirEnSaldo: false },
];
const mov = (campos) => ({ pagado: true, fecha: '2026-10-01', ...campos });

describe('saldosPorCuenta', () => {
  const movimientos = [
    mov({ tipo: 'ingreso', cuentaId: 'a', valor: 500 }),
    mov({ tipo: 'gasto', cuentaId: 'a', valor: 200 }),
    mov({ tipo: 'gasto', cuentaId: 'a', valor: 999, pagado: false }),
    mov({ tipo: 'transferencia', cuentaId: 'a', cuentaDestinoId: 'b', valor: 100 }),
    mov({ tipo: 'pagoTarjeta', cuentaId: 'a', valor: 30 }),
    mov({ tipo: 'gastoTarjeta', cuentaId: null, valor: 70 }),
  ];
  const saldos = saldosPorCuenta(cuentas, movimientos);

  it('suma el saldo inicial, los ajustes y solo los movimientos pagados', () => {
    expect(saldos.get('a')).toBe(1000 + 50 + 500 - 200 - 100 - 30);
  });

  it('una transferencia mueve el saldo de una cuenta a otra', () => {
    expect(saldos.get('b')).toBe(100);
  });

  it('una compra con tarjeta no toca las cuentas', () => {
    expect(saldos.get('c')).toBe(400);
  });
});

describe('saldoAlCierre', () => {
  it('solo cuenta lo pagado hasta el último día del mes y las cuentas que suman al saldo', () => {
    const movimientos = [
      mov({ tipo: 'ingreso', cuentaId: 'a', valor: 500, fecha: '2026-09-30' }),
      mov({ tipo: 'ingreso', cuentaId: 'a', valor: 700, fecha: '2026-10-01' }),
      mov({ tipo: 'ingreso', cuentaId: 'c', valor: 900, fecha: '2026-09-10' }),
    ];
    // Septiembre de 2026: mes 8 (enero = 0).
    expect(saldoAlCierre(cuentas, movimientos, 2026, 8)).toBe(1000 + 50 + 500 + 0);
  });
});

describe('faltante', () => {
  it('pide el valor primero', () => {
    expect(faltante({ tipo: 'gasto', valor: 0 })).toMatchObject({ campo: 'valor' });
  });

  it('una transferencia necesita dos cuentas distintas', () => {
    expect(faltante({ tipo: 'transferencia', valor: 10, cuentaId: 'a', cuentaDestinoId: 'a' })).toMatchObject({
      campo: 'cuentaDestinoId',
    });
    expect(faltante({ tipo: 'transferencia', valor: 10, cuentaId: 'a', cuentaDestinoId: 'b' })).toBeNull();
  });

  it('un gasto necesita categoría y cuenta; un reajuste puede ir sin categoría', () => {
    expect(faltante({ tipo: 'gasto', valor: 10, cuentaId: 'a' })).toMatchObject({ campo: 'categoriaId' });
    expect(faltante({ tipo: 'gasto', valor: 10, cuentaId: 'a', ajuste: true })).toBeNull();
    expect(faltante({ tipo: 'gastoTarjeta', valor: 10, categoriaId: 'x' })).toMatchObject({ campo: 'tarjetaId' });
  });
});

describe('horaDe', () => {
  it('usa la hora guardada', () => {
    expect(horaDe({ hora: '09:05' })).toBe('09:05');
    expect(horaDe({ hora: null, creado: Date.now() })).toBeNull();
  });

  it('en los movimientos de antes, toma la hora de creación solo si se crearon el mismo día', () => {
    const creado = new Date(2026, 9, 5, 14, 7).getTime();
    expect(horaDe({ fecha: '2026-10-05', creado })).toBe('14:07');
    expect(horaDe({ fecha: '2026-10-04', creado })).toBeNull();
  });
});
