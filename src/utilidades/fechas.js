// Fechas en formato AAAA-MM-DD (hora local, sin zonas horarias de por medio).

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function aFecha(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function hoyTexto() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function diasHasta(texto) {
  return Math.round((aFecha(texto) - aFecha(hoyTexto())) / 86400000);
}

// 'AAAA-MM' más n meses.
export function sumarMeses(mes, n) {
  const [anio, m] = mes.split('-').map(Number);
  const d = new Date(anio, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nombreMes(mes, conMayuscula = true) {
  return conMayuscula ? mayuscula(MESES[mes]) : MESES[mes];
}

export function enMes(texto, anio, mes) {
  const d = aFecha(texto);
  return d.getFullYear() === anio && d.getMonth() === mes;
}

// "25 de octubre" (con el año si no es este).
export function diaYMes(texto) {
  const d = aFecha(texto);
  const anio = d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : '';
  return `${d.getDate()} de ${MESES[d.getMonth()]}${anio}`;
}

// "Hoy · 2 de octubre", "Ayer · 1 de octubre", "Jueves · 15 de octubre" (este mes en curso
// o los próximos 6 días) o "30 de septiembre".
export function etiquetaDia(texto) {
  const d = aFecha(texto);
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  const dias = diasHasta(texto);
  if (dias === 0) return `Hoy · ${base}`;
  if (dias === -1) return `Ayer · ${base}`;
  if (dias > 0) return `${mayuscula(DIAS[d.getDay()])} · ${base}`;
  return base;
}

// "31 dic 2026"
export function fechaCorta(texto) {
  const d = aFecha(texto);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
