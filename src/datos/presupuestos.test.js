// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cambiarAjustes } from '../estado/ajustes.js';
import { aplicaEn, estadoEnFecha, fechaDelMes, rangoPeriodo } from './presupuestos.js';

afterEach(() => cambiarAjustes({ semanaEmpieza: 'lunes' }));

describe('rangoPeriodo', () => {
  it('semana de lunes a domingo, o de domingo a sábado según Ajustes', () => {
    // 8 de octubre de 2026: jueves.
    expect(rangoPeriodo({ periodo: 'semana' }, '2026-10-08')).toEqual({ desde: '2026-10-05', hasta: '2026-10-11' });
    cambiarAjustes({ semanaEmpieza: 'domingo' });
    expect(rangoPeriodo({ periodo: 'semana' }, '2026-10-08')).toEqual({ desde: '2026-10-04', hasta: '2026-10-10' });
  });

  it('una semana que cruza de mes', () => {
    expect(rangoPeriodo({ periodo: 'semana' }, '2026-11-01')).toEqual({ desde: '2026-10-26', hasta: '2026-11-01' });
  });

  it('quincena del 1 al 15 y del 16 al final', () => {
    expect(rangoPeriodo({ periodo: 'quincena' }, '2026-02-03')).toEqual({ desde: '2026-02-01', hasta: '2026-02-15' });
    expect(rangoPeriodo({ periodo: 'quincena' }, '2026-02-20')).toEqual({ desde: '2026-02-16', hasta: '2026-02-28' });
  });

  it('un año son 12 meses desde el mes en que empieza el presupuesto', () => {
    const p = { periodo: 'anio', desde: '2026-03' };
    expect(rangoPeriodo(p, '2027-02-10')).toEqual({ desde: '2026-03-01', hasta: '2027-02-28' });
    expect(rangoPeriodo(p, '2027-03-01')).toEqual({ desde: '2027-03-01', hasta: '2028-02-29' });
  });

  it('sin periodo es mensual', () => {
    expect(rangoPeriodo({}, '2026-10-08')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
  });
});

describe('aplicaEn', () => {
  it('sin repetir, solo en su primer periodo', () => {
    const p = { periodo: 'mes', desde: '2026-10', repetir: false };
    expect(aplicaEn(p, '2026-10-15')).toBe(true);
    expect(aplicaEn(p, '2026-11-01')).toBe(false);
    expect(aplicaEn(p, '2026-09-30')).toBe(false);
  });

  it('repitiendo, desde su primer periodo en adelante', () => {
    const p = { periodo: 'mes', desde: '2026-10', repetir: true };
    expect(aplicaEn(p, '2027-01-01')).toBe(true);
    expect(aplicaEn(p, '2026-09-30')).toBe(false);
  });
});

describe('estadoEnFecha', () => {
  const p = { categoriaId: 'c1', limite: 100000, avisarAl: 80 };
  const gasto = (valor, fecha = '2026-10-10', categoriaId = 'c1') => ({ tipo: 'gasto', valor, fecha, categoriaId });

  it('cuenta los gastos de la categoría en el periodo, también las cuotas de tarjeta', () => {
    const movimientos = [
      gasto(50000),
      { tipo: 'gastoTarjeta', valor: 20000, fecha: '2026-10-25', categoriaId: 'c1' },
      gasto(99999, '2026-09-30'),
      gasto(99999, '2026-10-10', 'otra'),
      { tipo: 'ingreso', valor: 99999, fecha: '2026-10-10', categoriaId: 'c1' },
    ];
    expect(estadoEnFecha(p, movimientos, '2026-10-15')).toMatchObject({ gastado: 70000, usado: 70, alerta: null });
  });

  it('avisa al llegar al porcentaje elegido y al pasarse', () => {
    expect(estadoEnFecha(p, [gasto(85000)], '2026-10-15').alerta).toBe('limite');
    expect(estadoEnFecha(p, [gasto(120000)], '2026-10-15').alerta).toBe('excedido');
  });
});

describe('fechaDelMes', () => {
  it('un mes pasado se mira en su último día y uno futuro en el primero', () => {
    expect(fechaDelMes(2000, 1)).toBe('2000-02-29');
    expect(fechaDelMes(2999, 0)).toBe('2999-01-01');
  });
});
