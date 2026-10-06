import { describe, expect, it } from 'vitest';
import { cifraCorta, porCategoria, topeDelEje, ventanaDeMeses } from './graficos.js';

const categorias = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, nombre: id.toUpperCase(), color: 'h' }));
const buscar = (id) => categorias.find((c) => c.id === id);
const gasto = (categoriaId, valor) => ({ tipo: 'gasto', categoriaId, valor, fecha: '2026-10-10' });

describe('porCategoria', () => {
  it('las 4 más grandes con su color y el resto junto en "Otros"', () => {
    const movimientos = [gasto('a', 60), gasto('b', 50), gasto('c', 40), gasto('d', 30), gasto('e', 20), gasto('f', 10)];
    const { total, cantidad, partes, todas } = porCategoria(movimientos, buscar, 'gasto', '2026-10');
    expect(total).toBe(210);
    expect(cantidad).toBe(6);
    expect(partes.map((p) => [p.nombre, p.valor])).toEqual([
      ['A', 60],
      ['B', 50],
      ['C', 40],
      ['D', 30],
      ['Otros', 30],
    ]);
    expect(todas).toHaveLength(6);
  });

  it('con exactamente 5 se ven todas, y el grupo se llama "Resto" si ya hay una categoría "Otros"', () => {
    const conOtros = (id) => (id === 'a' ? { id, nombre: 'Otros' } : buscar(id));
    const cinco = [gasto('a', 60), gasto('b', 50), gasto('c', 40), gasto('d', 30), gasto('e', 20)];
    expect(porCategoria(cinco, buscar, 'gasto', '2026-10').partes).toHaveLength(5);
    const seis = [...cinco, gasto('f', 10)];
    expect(porCategoria(seis, conOtros, 'gasto', '2026-10').partes.at(-1).nombre).toBe('Resto');
  });

  it('no cuenta transferencias ni otros meses', () => {
    const movimientos = [gasto('a', 10), { tipo: 'transferencia', valor: 99, fecha: '2026-10-10' }, { ...gasto('a', 99), fecha: '2026-09-30' }];
    expect(porCategoria(movimientos, buscar, 'gasto', '2026-10').total).toBe(10);
  });
});

describe('ejes y cifras cortas', () => {
  it('tope redondo del eje', () => {
    expect(topeDelEje(0)).toBe(1000);
    expect(topeDelEje(1234)).toBe(1500);
    expect(topeDelEje(2_600_000)).toBe(3_000_000);
  });

  it('cifras cortas en español', () => {
    expect(cifraCorta(1_800_000)).toBe('1,8 M');
    expect(cifraCorta(2_000_000)).toBe('2 M');
    expect(cifraCorta(12_000_000)).toBe('12 M');
    expect(cifraCorta(450_000)).toBe('450 mil');
    expect(cifraCorta(-900)).toBe('-900');
  });
});

describe('ventanaDeMeses', () => {
  it('seis meses que terminan en el elegido si es futuro', () => {
    expect(ventanaDeMeses('2999-06')).toEqual(['2999-01', '2999-02', '2999-03', '2999-04', '2999-05', '2999-06']);
  });

  it('seis meses que empiezan en el elegido si es muy viejo', () => {
    expect(ventanaDeMeses('2000-01')).toEqual(['2000-01', '2000-02', '2000-03', '2000-04', '2000-05', '2000-06']);
  });
});
