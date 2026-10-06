// Exportar todos los movimientos a CSV y a Excel (.xlsx), para abrirlos en una hoja de cálculo.
// Sin librerías: el CSV es texto y el .xlsx se arma a mano (un .zip sin compresión con las partes
// XML mínimas de un libro de Excel). datos: lo de leerDatos() (respaldo.js), ya leído antes del
// toque para que Safari deje compartir.
import { compartirArchivo, nombreArchivo } from './respaldo.js';

const TIPOS = {
  gasto: 'Gasto',
  ingreso: 'Ingreso',
  transferencia: 'Transferencia',
  gastoTarjeta: 'Gasto con tarjeta',
  pagoTarjeta: 'Pago de tarjeta',
};

const COLUMNAS = [
  'Fecha',
  'Tipo',
  'Descripción',
  'Categoría',
  'Cuenta',
  'Cuenta destino',
  'Tarjeta',
  'Cuotas',
  'Valor',
  'Estado',
  'Etiquetas',
  'Observación',
];

// Una fila por movimiento, de la más reciente a la más vieja. Fecha 'AAAA-MM-DD'; valor en pesos.
function filas({ movimientos = [], cuentas = [], categorias = [], tarjetas = [], etiquetas = [] }) {
  const nombre = (lista) => {
    const porId = new Map(lista.map((x) => [x.id, x.nombre]));
    return (id) => (id ? (porId.get(id) ?? '') : '');
  };
  const cuenta = nombre(cuentas);
  const categoria = nombre(categorias);
  const tarjeta = nombre(tarjetas);
  const etiqueta = nombre(etiquetas);
  return [...movimientos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.creado ?? 0) - (a.creado ?? 0))
    .map((m) => [
      m.fecha,
      TIPOS[m.tipo] ?? m.tipo,
      m.descripcion ?? '',
      categoria(m.categoriaId),
      cuenta(m.cuentaId),
      cuenta(m.cuentaDestinoId),
      tarjeta(m.tarjetaId),
      m.tipo === 'gastoTarjeta' ? (m.cuotas ?? 1) : '',
      m.valor,
      m.tipo === 'gasto' || m.tipo === 'ingreso' || !m.pagado ? (m.pagado ? 'Pagado' : 'Pendiente') : '',
      (m.etiquetaIds ?? []).map(etiqueta).filter(Boolean).join(', '),
      m.observacion ?? '',
    ]);
}

// ---------- CSV ----------

// Con punto y coma: en Colombia Excel usa la coma para decimales y abre así el CSV por columnas.
// Empieza con la marca UTF-8 para que las tildes salgan bien.
export function textoCsv(datos) {
  const celda = (valor) => {
    const texto = String(valor ?? '');
    return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const lineas = [COLUMNAS, ...filas(datos)].map((fila) => fila.map(celda).join(';'));
  return '﻿' + lineas.join('\r\n');
}

export function exportarCsv(datos) {
  const archivo = new File([textoCsv(datos)], nombreArchivo('movimientos', 'csv'), { type: 'text/csv' });
  return compartirArchivo(archivo, 'Movimientos de Re-Coin');
}

// ---------- Excel (.xlsx) ----------

const escaparXml = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Caracteres de control que el XML no admite (se buscan a propósito).
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

// Letra de la columna: 0 → A, 25 → Z, 26 → AA.
const letra = (i) => (i < 26 ? String.fromCharCode(65 + i) : letra(Math.floor(i / 26) - 1) + letra(i % 26));

// Días desde el 30 de diciembre de 1899: así guarda Excel las fechas.
function serialExcel(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return Math.round((Date.UTC(anio, mes - 1, dia) - Date.UTC(1899, 11, 30)) / 86400000);
}

// Estilos: 0 normal, 1 encabezado en negrita, 2 fecha dd/mm/aaaa, 3 número con puntos de miles.
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>`;

function hojaXml(datos) {
  const celda = (valor, columna, fila, estilo = 0) => {
    const ref = `${letra(columna)}${fila}`;
    if (valor === '' || valor === null || valor === undefined) return '';
    const s = estilo ? ` s="${estilo}"` : '';
    if (typeof valor === 'number') return `<c r="${ref}"${s}><v>${valor}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`;
  };
  const encabezado = `<row r="1">${COLUMNAS.map((c, i) => celda(c, i, 1, 1)).join('')}</row>`;
  const cuerpo = filas(datos)
    .map((fila, f) => {
      const n = f + 2;
      const celdas = fila.map((valor, i) => {
        if (i === 0) return celda(serialExcel(valor), i, n, 2);
        if (COLUMNAS[i] === 'Valor') return celda(valor, i, n, 3);
        return celda(valor, i, n);
      });
      return `<row r="${n}">${celdas.join('')}</row>`;
    })
    .join('');
  const anchos = [12, 18, 28, 18, 18, 18, 18, 8, 14, 12, 20, 30]
    .map((ancho, i) => `<col min="${i + 1}" max="${i + 1}" width="${ancho}" customWidth="1"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${anchos}</cols><sheetData>${encabezado}${cuerpo}</sheetData></worksheet>`;
}

const PARTES_FIJAS = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Movimientos" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': ESTILOS,
};

// CRC-32 (el que exige el formato .zip).
const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Un .zip con los archivos guardados sin comprimir ("stored"): válido y simple.
function zip(archivos) {
  const codificar = new TextEncoder();
  const partes = [];
  const central = [];
  let desplazamiento = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const nombreBytes = codificar.encode(nombre);
    const datos = codificar.encode(contenido);
    const crc = crc32(datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // versión necesaria
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 0, true); // sin compresión
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombreBytes.length, true);
    partes.push(new Uint8Array(local.buffer), nombreBytes, datos);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint16(10, 0, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, datos.length, true);
    entrada.setUint32(24, datos.length, true);
    entrada.setUint16(28, nombreBytes.length, true);
    entrada.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(entrada.buffer), nombreBytes);
    desplazamiento += 30 + nombreBytes.length + datos.length;
  }
  const largoCentral = central.reduce((t, p) => t + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, Object.keys(archivos).length, true);
  fin.setUint16(10, Object.keys(archivos).length, true);
  fin.setUint32(12, largoCentral, true);
  fin.setUint32(16, desplazamiento, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)]);
}

export function libroExcel(datos) {
  return zip({ ...PARTES_FIJAS, 'xl/worksheets/sheet1.xml': hojaXml(datos) });
}

export function exportarExcel(datos) {
  const archivo = new File([libroExcel(datos)], nombreArchivo('movimientos', 'xlsx'), {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return compartirArchivo(archivo, 'Movimientos de Re-Coin');
}
