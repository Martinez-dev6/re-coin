import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db.js';
import {
  eliminarFecha,
  fechasEntre,
  fechasFuturas,
  guardarProgramado,
  guardarRecurrente,
  programadosDelMes,
  registrarVencidos,
  saldoEstimado,
} from './programados.js';

// Hoy es el lunes 5 de octubre de 2026 (solo se finge la fecha: los temporizadores siguen reales
// para que funcione la base de datos en memoria).
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0));
});
afterAll(() => vi.useRealTimers());

const programado = (campos) => ({ omitidas: [], termina: null, hasta: null, ...campos });

describe('fechasEntre', () => {
  it('cada mes: el día que no existe pasa al último del mes', () => {
    const p = programado({ frecuencia: 'mes', empieza: '2026-01-31' });
    expect(fechasEntre(p, '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('cada quincena: el día en que empieza y 15 días después', () => {
    const p = programado({ frecuencia: 'quincena', empieza: '2026-01-15' });
    expect(fechasEntre(p, '2026-01-01', '2026-02-28')).toEqual(['2026-01-15', '2026-01-30', '2026-02-15', '2026-02-28']);
  });

  it('cada quincena empezando después del 15: 15 días antes, sin fechas anteriores al inicio', () => {
    const p = programado({ frecuencia: 'quincena', empieza: '2026-01-20' });
    expect(fechasEntre(p, '2026-01-01', '2026-02-28')).toEqual(['2026-01-20', '2026-02-05', '2026-02-20']);
  });

  it('cada semana, también si se pide desde una fecha lejana al inicio', () => {
    const p = programado({ frecuencia: 'semana', empieza: '2026-10-01' });
    expect(fechasEntre(p, '2026-10-01', '2026-10-31')).toEqual(['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29']);
    expect(fechasEntre(p, '2026-10-20', '2026-10-31')).toEqual(['2026-10-22', '2026-10-29']);
  });

  it('cada día, cambiando de mes', () => {
    const p = programado({ frecuencia: 'dia', empieza: '2026-10-30' });
    expect(fechasEntre(p, '2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('cada año: el 29 de febrero pasa al 28 en los años que no son bisiestos', () => {
    const p = programado({ frecuencia: 'anio', empieza: '2024-02-29' });
    expect(fechasEntre(p, '2025-01-01', '2028-12-31')).toEqual(['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });

  it('respeta la fecha en que termina y las fechas quitadas una por una', () => {
    const p = programado({ frecuencia: 'mes', empieza: '2026-01-10', termina: '2026-03-10', omitidas: ['2026-02-10'] });
    expect(fechasEntre(p, '2026-01-01', '2026-12-31')).toEqual(['2026-01-10', '2026-03-10']);
  });
});

describe('fechasFuturas', () => {
  it('solo las fechas después de lo ya registrado', () => {
    const p = programado({ frecuencia: 'mes', empieza: '2026-08-15', hasta: '2026-10-15' });
    expect(fechasFuturas(p, '2026-08-01', '2026-12-31')).toEqual(['2026-11-15', '2026-12-15']);
  });
});

describe('programadosDelMes', () => {
  it('un gasto con tarjeta programado va el día en que se paga su factura', () => {
    const tarjeta = { id: 't', diaCierre: 15, diaPago: 25 };
    const p = programado({ id: 'p', tipo: 'gastoTarjeta', tarjetaId: 't', valor: 30000, frecuencia: 'mes', empieza: '2026-10-20', hasta: '2026-10-20' });
    const buscar = (id) => (id === 't' ? tarjeta : undefined);
    // La compra del 20 de noviembre cierra en diciembre: en noviembre no hay nada que pagar.
    expect(programadosDelMes([p], buscar, 2026, 10)).toEqual([]);
    const diciembre = programadosDelMes([p], buscar, 2026, 11);
    expect(diciembre).toHaveLength(1);
    expect(diciembre[0]).toMatchObject({ fecha: '2026-12-25', compra: '2026-11-20', pagado: false, futuro: true });
  });

  it('sin la tarjeta (se borró) no muestra nada', () => {
    const p = programado({ id: 'p', tipo: 'gastoTarjeta', tarjetaId: 'x', valor: 1, frecuencia: 'mes', empieza: '2026-10-20' });
    expect(programadosDelMes([p], () => undefined, 2026, 11)).toEqual([]);
  });
});

describe('saldoEstimado', () => {
  const datos = {
    cuentas: [{ id: 'a', incluirEnSaldo: true, saldo: 1000 }],
    movimientosPorMes: [
      { tipo: 'gasto', cuentaId: 'a', valor: 200, pagado: false, fecha: '2026-10-20' },
      { tipo: 'ingreso', cuentaId: 'a', valor: 50, pagado: true, fecha: '2026-10-01' },
    ],
    programados: [programado({ id: 'p', tipo: 'ingreso', valor: 500, cuentaId: 'a', frecuencia: 'mes', empieza: '2026-10-15', hasta: '2026-10-15' })],
    tarjeta: () => undefined,
  };

  it('suma al saldo de hoy lo pendiente y los recurrentes de cada mes siguiente', () => {
    expect(saldoEstimado(datos, 2026, 10)).toBe(1000 - 200 + 500);
    expect(saldoEstimado(datos, 2026, 11)).toBe(1000 - 200 + 500 + 500);
  });
});

describe('registro de programados en la base de datos', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  const gastoSemanal = {
    id: 'p1',
    tipo: 'gasto',
    valor: 1000,
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
  };

  it('registra como pendientes las fechas hasta el fin del mes y no las repite', async () => {
    await db.programados.add(gastoSemanal);
    await Promise.all([registrarVencidos(), registrarVencidos()]);
    await registrarVencidos();
    const movimientos = await db.movimientos.orderBy('fecha').toArray();
    expect(movimientos.map((m) => [m.fecha, m.pagado])).toEqual([
      ['2026-10-01', false],
      ['2026-10-08', false],
      ['2026-10-15', false],
      ['2026-10-22', false],
      ['2026-10-29', false],
    ]);
    expect((await db.programados.get('p1')).hasta).toBe('2026-10-29');
  });

  it('un movimiento recurrente nuevo guarda el de hoy y programa los siguientes', async () => {
    await guardarRecurrente({
      ...gastoSemanal,
      fecha: '2026-10-05',
      hora: 'ahora',
      pagado: true,
      tarjetaId: null,
      cuotas: 1,
      factura: null,
    });
    const movimientos = await db.movimientos.orderBy('fecha').toArray();
    expect(movimientos.map((m) => [m.fecha, m.pagado])).toEqual([
      ['2026-10-05', true],
      ['2026-10-12', false],
      ['2026-10-19', false],
      ['2026-10-26', false],
    ]);
    expect(new Set(movimientos.map((m) => m.programadoId)).size).toBe(1);
  });

  it('una fecha quitada no vuelve aunque se edite el programado', async () => {
    await db.programados.add({ ...gastoSemanal, empieza: '2026-10-05' });
    await registrarVencidos();
    await eliminarFecha('p1', '2026-10-12');
    const programadoGuardado = await db.programados.get('p1');
    expect(programadoGuardado.omitidas).toEqual(['2026-10-12']);
    // Editarlo borra lo adelantado (después de hoy) y lo vuelve a registrar.
    await guardarProgramado('p1', { ...programadoGuardado, fecha: programadoGuardado.empieza });
    const fechas = (await db.movimientos.orderBy('fecha').toArray()).map((m) => m.fecha);
    expect(fechas).toEqual(['2026-10-05', '2026-10-19', '2026-10-26']);
  });
});
