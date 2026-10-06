import { describe, expect, it } from 'vitest';
import { buscarMovimientos, cumpleFiltros, FILTROS_VACIOS, normalizar, totalMovimientos } from './buscar.js';

const porId = (lista) => (id) => lista.find((x) => x.id === id);
const datos = {
  categoria: porId([{ id: 'c1', nombre: 'Transporte' }]),
  cuenta: porId([{ id: 'a', nombre: 'Nequi' }]),
  tarjeta: porId([]),
  etiqueta: porId([{ id: 'e1', nombre: 'Carro' }]),
};
const gasolina = { id: 'm1', tipo: 'gasto', descripcion: 'Gasolina', valor: 50000, categoriaId: 'c1', cuentaId: 'a', etiquetaIds: ['e1'], pagado: true };
const cafe = { id: 'm2', tipo: 'gasto', descripcion: 'Café', valor: 4500, categoriaId: null, cuentaId: 'a', etiquetaIds: [], pagado: false };

describe('normalizar', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar('Café Ñandú')).toBe('cafe nandu');
  });
});

describe('buscarMovimientos', () => {
  it('busca sin importar tildes, en todos los campos y con el valor con o sin puntos', () => {
    expect(buscarMovimientos([gasolina, cafe], 'cafe', datos)).toEqual([cafe]);
    expect(buscarMovimientos([gasolina, cafe], 'carro 50.000', datos)).toEqual([gasolina]);
    expect(buscarMovimientos([gasolina, cafe], '50000 nequi', datos)).toEqual([gasolina]);
    expect(buscarMovimientos([gasolina, cafe], '   ', datos)).toEqual([]);
  });
});

describe('cumpleFiltros', () => {
  it('filtra por tipo, estado, cuenta y etiqueta', () => {
    expect(cumpleFiltros(cafe, { ...FILTROS_VACIOS, estado: 'pendiente' })).toBe(true);
    expect(cumpleFiltros(gasolina, { ...FILTROS_VACIOS, estado: 'pendiente' })).toBe(false);
    expect(cumpleFiltros({ ...gasolina, tipo: 'gastoTarjeta' }, { ...FILTROS_VACIOS, tipo: 'gasto' })).toBe(true);
    expect(cumpleFiltros(gasolina, { ...FILTROS_VACIOS, etiquetas: ['e1'] })).toBe(true);
    expect(cumpleFiltros(cafe, { ...FILTROS_VACIOS, etiquetas: ['e1'] })).toBe(false);
  });
});

describe('totalMovimientos', () => {
  it('en "Todo" es el neto, sin transferencias ni pagos de tarjeta', () => {
    const lista = [
      { tipo: 'ingreso', valor: 100 },
      { tipo: 'gasto', valor: 30 },
      { tipo: 'gastoTarjeta', valor: 10 },
      { tipo: 'transferencia', valor: 50 },
      { tipo: 'pagoTarjeta', valor: 40 },
    ];
    expect(totalMovimientos(lista)).toBe(60);
    expect(totalMovimientos(lista.slice(1, 3), 'gasto')).toBe(40);
  });
});
