import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eliminarCuenta } from './cuentas.js';
import { db } from './db.js';
import { saldosPorCuenta } from './movimientos.js';
import { registrarVencidos } from './programados.js';

// Hoy: lunes 5 de octubre de 2026 (solo se finge la fecha, como en programados.test.js).
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0));
});
afterAll(() => vi.useRealTimers());

describe('eliminarCuenta', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.cuentas.bulkAdd([
      { id: 'a', nombre: 'A', saldoInicial: 1000, incluirEnSaldo: true, orden: 1 },
      { id: 'b', nombre: 'B', saldoInicial: 0, incluirEnSaldo: true, orden: 2 },
    ]);
    await db.tarjetas.add({ id: 't', nombre: 'T', cupo: 1000, diaCierre: 15, diaPago: 25, cuentaPagoId: 'a', orden: 1 });
    await db.metas.add({ id: 'm', nombre: 'Viaje', objetivo: 500, cuentaId: 'a', orden: 1 });
    await db.movimientos.bulkAdd([
      { id: 'gasto', tipo: 'gasto', cuentaId: 'a', valor: 100, pagado: true, fecha: '2026-10-01' },
      { id: 'transferencia', tipo: 'transferencia', cuentaId: 'a', cuentaDestinoId: 'b', valor: 300, pagado: true, fecha: '2026-10-02' },
      { id: 'pagoFactura', tipo: 'pagoTarjeta', cuentaId: 'a', tarjetaId: 't', valor: 50, factura: '2026-10', pagado: true, fecha: '2026-10-03' },
    ]);
    // Cada semana desde el 1: quedan registrados el 1 (ya pasó) y del 8 al 29 (adelantados).
    await db.programados.add({
      id: 'p',
      tipo: 'gasto',
      valor: 10,
      descripcion: 'Mercado',
      categoriaId: 'c',
      cuentaId: 'a',
      cuentaDestinoId: null,
      etiquetaIds: [],
      observacion: '',
      frecuencia: 'semana',
      empieza: '2026-10-01',
      termina: null,
      hasta: null,
      orden: 1,
    });
    await registrarVencidos();
    await eliminarCuenta('a');
  });

  it('deja sus movimientos, así el saldo de las otras cuentas y las facturas no cambian', async () => {
    const movimientos = await db.movimientos.toArray();
    expect(movimientos.map((m) => m.id)).toEqual(expect.arrayContaining(['gasto', 'transferencia', 'pagoFactura']));
    expect(saldosPorCuenta(await db.cuentas.toArray(), movimientos).get('b')).toBe(300);
    expect(await db.cuentas.get('a')).toBeUndefined();
  });

  it('borra sus programados como "Solo el programado": lo registrado se queda, menos lo adelantado', async () => {
    expect(await db.programados.count()).toBe(0);
    const delProgramado = await db.movimientos.where('programadoId').equals('p').toArray();
    expect(delProgramado.map((m) => m.fecha)).toEqual(['2026-10-01']);
  });

  it('la tarjeta queda sin "Paga desde" y la meta sin "Se guarda en"', async () => {
    expect((await db.tarjetas.get('t')).cuentaPagoId).toBeNull();
    expect((await db.metas.get('m')).cuentaId).toBeNull();
  });
});
