import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { diasHasta, etiquetaDia, sumarMeses, textoDeFecha } from './fechas.js';
import { formatearPesos } from './formato.js';

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0));
});
afterAll(() => vi.useRealTimers());

describe('fechas', () => {
  it('suma meses cruzando el año', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01');
    expect(sumarMeses('2026-01', -1)).toBe('2025-12');
    expect(sumarMeses('2026-10', 15)).toBe('2028-01');
  });

  it('texto de una fecha en hora local', () => {
    expect(textoDeFecha(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
  });

  it('días hasta una fecha', () => {
    expect(diasHasta('2026-10-05')).toBe(0);
    expect(diasHasta('2026-10-31')).toBe(26);
    expect(diasHasta('2026-10-04')).toBe(-1);
  });

  it('etiqueta de un día', () => {
    expect(etiquetaDia('2026-10-05')).toBe('Hoy · 5 de octubre');
    expect(etiquetaDia('2026-10-04')).toBe('Ayer · 4 de octubre');
    expect(etiquetaDia('2026-10-08')).toBe('Jueves · 8 de octubre');
    expect(etiquetaDia('2025-12-31')).toBe('31 de diciembre de 2025');
  });
});

describe('formatearPesos', () => {
  it('punto de miles y sin decimales', () => {
    expect(formatearPesos(0)).toBe('$ 0');
    expect(formatearPesos(1500)).toBe('$ 1.500');
    expect(formatearPesos(1284300)).toBe('$ 1.284.300');
    expect(formatearPesos(1499.6)).toBe('$ 1.500');
  });

  it('negativos con signo, pero no "-$ 0"', () => {
    expect(formatearPesos(-250000)).toBe('-$ 250.000');
    expect(formatearPesos(-0.4)).toBe('$ 0');
  });
});
