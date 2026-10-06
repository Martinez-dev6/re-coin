import { describe, expect, it } from 'vitest';
import {
  cuotasComoGastos,
  cuotasDe,
  facturaDeFecha,
  fechaCierreFactura,
  fechaPagoFactura,
  resumenTarjetas,
} from './tarjetas.js';

// Cierra el 15 y se paga el 25 del mismo mes.
const mismoMes = { id: 't1', diaCierre: 15, diaPago: 25 };
// Cierra el 25 y se paga el 5 del mes siguiente.
const mesSiguiente = { id: 't2', diaCierre: 25, diaPago: 5 };

describe('facturaDeFecha', () => {
  it('una compra hasta el día de cierre va a la factura de ese mes', () => {
    expect(facturaDeFecha(mismoMes, '2026-10-15')).toBe('2026-10');
  });

  it('una compra después del cierre va a la factura siguiente', () => {
    expect(facturaDeFecha(mismoMes, '2026-10-16')).toBe('2026-11');
  });

  it('si el pago es el mes siguiente al cierre, la factura se nombra por el mes en que se paga', () => {
    expect(facturaDeFecha(mesSiguiente, '2026-10-20')).toBe('2026-11');
    expect(facturaDeFecha(mesSiguiente, '2026-10-26')).toBe('2026-12');
  });

  it('un cierre el 31 en febrero cierra el último día del mes', () => {
    const cierra31 = { id: 't3', diaCierre: 31, diaPago: 10 };
    expect(facturaDeFecha(cierra31, '2026-02-28')).toBe('2026-03');
  });

  it('pasa de año', () => {
    expect(facturaDeFecha(mismoMes, '2026-12-20')).toBe('2027-01');
  });
});

describe('fechas de pago y de cierre', () => {
  it('el día de pago que no existe en el mes pasa al último día', () => {
    expect(fechaPagoFactura({ diaPago: 31 }, '2026-02')).toBe('2026-02-28');
    expect(fechaPagoFactura({ diaPago: 31 }, '2028-02')).toBe('2028-02-29');
  });

  it('el cierre de una factura que se paga el mes siguiente es del mes anterior', () => {
    expect(fechaCierreFactura(mesSiguiente, '2026-11')).toBe('2026-10-25');
    expect(fechaCierreFactura(mismoMes, '2026-11')).toBe('2026-11-15');
  });
});

describe('cuotasDe', () => {
  it('reparte el valor en facturas seguidas y la primera lleva lo que no da exacto', () => {
    const cuotas = cuotasDe({ valor: 100000, cuotas: 3, factura: '2026-11' });
    expect(cuotas).toEqual([
      { mes: '2026-11', valor: 33334, numero: 1 },
      { mes: '2026-12', valor: 33333, numero: 2 },
      { mes: '2027-01', valor: 33333, numero: 3 },
    ]);
    expect(cuotas.reduce((t, c) => t + c.valor, 0)).toBe(100000);
  });

  it('sin cuotas es una sola', () => {
    expect(cuotasDe({ valor: 5000, cuotas: null, factura: '2026-10' })).toEqual([{ mes: '2026-10', valor: 5000, numero: 1 }]);
  });
});

describe('resumenTarjetas y cuotasComoGastos', () => {
  const compra = { id: 'm1', tipo: 'gastoTarjeta', tarjetaId: 't1', valor: 300000, cuotas: 3, factura: '2026-10', fecha: '2026-10-01' };
  const pago = { id: 'm2', tipo: 'pagoTarjeta', tarjetaId: 't1', valor: 100000, factura: '2026-10', fecha: '2026-10-20' };
  const resumen = resumenTarjetas([mismoMes], [compra, pago]);
  const tarjeta = { ...mismoMes, ...resumen.get('t1') };

  it('lo usado es lo que falta por pagar de todas las facturas', () => {
    expect(tarjeta.usado).toBe(200000);
    expect(tarjeta.facturas.get('2026-10')).toMatchObject({ total: 100000, pagado: 100000 });
  });

  it('cada cuota es un gasto el día en que vence su factura, pagada si esa factura se pagó', () => {
    const lineas = cuotasComoGastos([compra, pago], (id) => (id === 't1' ? tarjeta : undefined));
    expect(lineas.map((l) => [l.id, l.fecha, l.valor, l.pagado])).toEqual([
      ['m1-1', '2026-10-25', 100000, true],
      ['m1-2', '2026-11-25', 100000, false],
      ['m1-3', '2026-12-25', 100000, false],
    ]);
  });
});
