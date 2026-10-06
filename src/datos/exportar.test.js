// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { libroExcel, textoCsv } from './exportar.js';

const datos = {
  cuentas: [{ id: 'a', nombre: 'Nequi' }],
  categorias: [{ id: 'c', nombre: 'Transporte' }],
  movimientos: [
    {
      fecha: '2026-10-05',
      tipo: 'gasto',
      descripcion: '=HYPERLINK("http://ejemplo")',
      categoriaId: 'c',
      cuentaId: 'a',
      valor: 5000,
      pagado: true,
      etiquetaIds: [],
      observacion: 'nota; con "comillas"',
    },
  ],
};

describe('textoCsv', () => {
  const [encabezado, fila] = textoCsv(datos).split('\r\n');

  it('empieza con la marca UTF-8 y separa con punto y coma', () => {
    expect(encabezado.startsWith('﻿Fecha;Tipo;Descripción')).toBe(true);
  });

  it('no deja que Excel lea un texto como fórmula y escapa comillas y separadores', () => {
    expect(fila).toBe('2026-10-05;Gasto;"\'=HYPERLINK(""http://ejemplo"")";Transporte;Nequi;;;;5000;Pagado;;"nota; con ""comillas"""');
  });

  it('los valores siguen siendo números', () => {
    expect(fila.split(';')[8]).toBe('5000');
  });
});

describe('libroExcel', () => {
  it('es un archivo .zip (empieza con la firma PK)', async () => {
    const bytes = new Uint8Array(await libroExcel(datos).arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
