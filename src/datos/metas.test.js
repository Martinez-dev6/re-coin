import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ahorradoPorMeta, ahorroPorPeriodo, periodosRestantes } from './metas.js';

// Hoy: lunes 5 de octubre de 2026.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0));
});
afterAll(() => vi.useRealTimers());

describe('periodosRestantes (contando el actual)', () => {
  it('meses: de octubre a diciembre son 3', () => {
    expect(periodosRestantes('2026-12-31', 'mes')).toBe(3);
  });

  it('días, incluido hoy', () => {
    expect(periodosRestantes('2026-12-31', 'dia')).toBe(88);
  });

  it('semanas que empiezan el lunes o el domingo', () => {
    expect(periodosRestantes('2026-12-31', 'semana', 'lunes')).toBe(13);
    // Con domingo, hoy (lunes) está en la semana que empezó ayer.
    expect(periodosRestantes('2026-10-10', 'semana', 'domingo')).toBe(1);
    expect(periodosRestantes('2026-10-11', 'semana', 'domingo')).toBe(2);
  });

  it('quincenas', () => {
    expect(periodosRestantes('2026-12-31', 'quincena')).toBe(6);
  });

  it('si la fecha ya pasó, queda un periodo', () => {
    expect(periodosRestantes('2026-01-01', 'mes')).toBe(1);
  });
});

describe('ahorroPorPeriodo', () => {
  it('reparte lo que falta entre los periodos que quedan, redondeando hacia arriba', () => {
    expect(ahorroPorPeriodo(1000000, 100000, '2026-12-31', 'mes')).toBe(300000);
    expect(ahorroPorPeriodo(1000, 0, '2026-12-31', 'mes')).toBe(334);
  });

  it('una meta cumplida no pide nada', () => {
    expect(ahorroPorPeriodo(1000, 1500, '2026-12-31', 'mes')).toBe(0);
  });
});

describe('ahorradoPorMeta', () => {
  it('"Ya tengo" más los aportes de cada meta', () => {
    const ahorrado = ahorradoPorMeta(
      [{ id: 'm1', ahorradoInicial: 100 }, { id: 'm2' }],
      [
        { metaId: 'm1', valor: 50 },
        { metaId: 'm1', valor: 25 },
        { metaId: 'borrada', valor: 999 },
      ],
    );
    expect(ahorrado.get('m1')).toBe(175);
    expect(ahorrado.get('m2')).toBe(0);
  });
});
