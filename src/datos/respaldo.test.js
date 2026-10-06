// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { db } from './db.js';
import { avisoDeCopia, diasDesdeCopia, leerCopia } from './respaldo.js';

// Hoy: 5 de octubre de 2026, 8:00 a. m.
const AHORA = new Date(2026, 9, 5, 8, 0).getTime();
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
});
afterAll(() => vi.useRealTimers());

const nuevos = (n, creado = AHORA) => Array.from({ length: n }, () => ({ creado }));

describe('diasDesdeCopia', () => {
  it('cuenta días de calendario, no bloques de 24 horas', () => {
    const anoche = new Date(2026, 9, 4, 23, 0).getTime();
    expect(diasDesdeCopia({ ultimaCopia: anoche }, AHORA)).toBe(1);
    expect(diasDesdeCopia({ ultimaCopia: null }, AHORA)).toBeNull();
  });
});

describe('avisoDeCopia', () => {
  it('sin ninguna copia, avisa con el primer movimiento', () => {
    expect(avisoDeCopia([], { ultimaCopia: null }, AHORA)).toBeNull();
    expect(avisoDeCopia(nuevos(1), { ultimaCopia: null }, AHORA)).toEqual({ dias: null, nuevos: 1 });
  });

  it('con una copia de hoy, avisa solo con 10 movimientos nuevos', () => {
    const ultimaCopia = AHORA - 60 * 60 * 1000;
    expect(avisoDeCopia(nuevos(9), { ultimaCopia }, AHORA)).toBeNull();
    expect(avisoDeCopia(nuevos(10), { ultimaCopia }, AHORA)).toEqual({ dias: 0, nuevos: 10 });
  });

  it('con una copia de otro día, avisa si hay algo nuevo', () => {
    const ultimaCopia = new Date(2026, 9, 4, 20, 0).getTime();
    expect(avisoDeCopia(nuevos(1, ultimaCopia - 1), { ultimaCopia }, AHORA)).toBeNull();
    expect(avisoDeCopia(nuevos(1), { ultimaCopia }, AHORA)).toEqual({ dias: 1, nuevos: 1 });
  });

  it('"Ahora no" lo aplaza', () => {
    expect(avisoDeCopia(nuevos(50), { ultimaCopia: null, avisoCopiaPospuesto: AHORA + 1 }, AHORA)).toBeNull();
  });
});

describe('leerCopia', () => {
  const archivo = (contenido) => ({ text: async () => (typeof contenido === 'string' ? contenido : JSON.stringify(contenido)) });
  const valida = () => ({
    app: 'sendo',
    version: db.verno,
    creada: '2026-10-05T13:00:00.000Z',
    datos: {
      cuentas: [{ id: 'a', nombre: 'Nequi', tipo: 'billetera', saldoInicial: 0, icono: 'billetera', orden: 1 }],
      movimientos: [{ id: 'm', tipo: 'gasto', valor: 10, cuentaId: 'a', fecha: '2026-10-05', pagado: true, etiquetaIds: [] }],
    },
  });

  it('acepta una copia válida y resume lo que trae', async () => {
    const { resumen } = await leerCopia(archivo(valida()));
    expect(resumen).toMatchObject({ cuentas: 1, categorias: 0, movimientos: 1 });
  });

  it('rechaza lo que no es una copia de la app', async () => {
    await expect(leerCopia(archivo('no es json'))).rejects.toThrow('no es una copia');
    await expect(leerCopia(archivo({ ...valida(), app: 'otra' }))).rejects.toThrow('no es una copia');
  });

  it('rechaza una copia de una versión más nueva de la app', async () => {
    await expect(leerCopia(archivo({ ...valida(), version: db.verno + 1 }))).rejects.toThrow('más nueva');
  });

  it('rechaza una copia con filas dañadas, sin cambiar nada', async () => {
    const danada = valida();
    danada.datos.movimientos[0].valor = 'diez';
    await expect(leerCopia(archivo(danada))).rejects.toThrow('dañada');
  });
});
