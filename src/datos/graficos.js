// Cálculos de Gráficos y Rendimiento. Usan movimientosPorMes (DatosContext): las cuotas de tarjeta
// cuentan en el mes en que se pagan y las transferencias no son ingresos ni gastos. Cuentan los
// pagados y los pendientes del mes, como en Inicio y en los presupuestos.
import { hoyTexto, MESES, sumarMeses } from '../utilidades/fechas.js';
import { esGasto } from './movimientos.js';

// Cada categoría va con su propio color (el de sus íconos, --cat-X del tema), decidido por el
// dueño (2026-10-04); antes los gráficos usaban una paleta aparte por orden de tamaño. Una
// categoría sin color va en el gris de sus íconos y el grupo del resto en otro gris.
const colorDeCategoria = (categoria) => (categoria?.color ? `var(--cat-${categoria.color})` : 'var(--muted)');
export const COLOR_OTROS = 'var(--ch-other)';

const dos = (n) => String(n).padStart(2, '0');
export const textoMes = (anio, mes) => `${anio}-${dos(mes + 1)}`;
const delTipo = (tipo) => (tipo === 'ingreso' ? (m) => m.tipo === 'ingreso' : esGasto);

// Total de un tipo ('gasto' | 'ingreso') en un mes 'AAAA-MM'.
export function totalDelMes(movimientosPorMes, tipo, mes) {
  const es = delTipo(tipo);
  return movimientosPorMes.filter((m) => es(m) && m.fecha.startsWith(mes)).reduce((t, m) => t + m.valor, 0);
}

// Por categoría en un mes: las 4 más grandes con el color de cada una y el resto junto en "Otros".
// Devuelve { total, cantidad (categorías con algo), partes: [{ clave, nombre, valor, color }] }.
export function porCategoria(movimientosPorMes, buscarCategoria, tipo, mes) {
  const es = delTipo(tipo);
  const sumas = new Map();
  for (const m of movimientosPorMes) {
    if (!es(m) || !m.fecha.startsWith(mes)) continue;
    const clave = m.categoriaId ?? 'sin-categoria';
    sumas.set(clave, (sumas.get(clave) ?? 0) + m.valor);
  }
  const ordenadas = [...sumas.entries()].sort((a, b) => b[1] - a[1]);
  const total = ordenadas.reduce((t, [, valor]) => t + valor, 0);
  // Las 4 primeras con su color; el resto: si es una sola, con su nombre y su color, y si son
  // más, juntas en "Otros" en gris (nunca un color generado).
  const parte = ([clave, valor]) => {
    const categoria = buscarCategoria(clave);
    return { clave, nombre: categoria?.nombre ?? 'Sin categoría', valor, color: colorDeCategoria(categoria) };
  };
  const visibles = ordenadas.length === 5 ? ordenadas : ordenadas.slice(0, 4);
  const resto = ordenadas.slice(visibles.length);
  const partes = visibles.map(parte);
  if (resto.length > 0) {
    // Si ya se ve una categoría llamada "Otros", el grupo se llama "Resto" para no repetir el nombre.
    const grupo = partes.some((p) => p.nombre.trim().toLowerCase() === 'otros') ? 'Resto' : 'Otros';
    partes.push({ clave: 'otros', nombre: grupo, valor: resto.reduce((t, [, v]) => t + v, 0), color: COLOR_OTROS });
  }
  // todas: cada categoría con su nombre y su color, sin agrupar (el bloque de Inicio).
  return { total, cantidad: ordenadas.length, partes, todas: ordenadas.map(parte) };
}

// Los 'n' meses que terminan en 'hasta' ('AAAA-MM'), del más viejo al más nuevo.
export const ultimosMeses = (hasta, n = 6) => Array.from({ length: n }, (_, i) => sumarMeses(hasta, i - n + 1));

// Los 6 meses que se ven: hasta el actual, o hasta el elegido si es posterior; si el elegido es
// más viejo que eso, los 6 que empiezan en él.
export function ventanaDeMeses(elegido) {
  const actual = hoyTexto().slice(0, 7);
  let hasta = elegido > actual ? elegido : actual;
  if (elegido < sumarMeses(hasta, -5)) hasta = sumarMeses(elegido, 5);
  return ultimosMeses(hasta);
}

// "May", "Jun": el mes corto de 'AAAA-MM'.
export function mesCorto(mesTexto) {
  const m = MESES[Number(mesTexto.slice(5)) - 1];
  return m.charAt(0).toUpperCase() + m.slice(1, 3);
}

// "1,8 M", "450 mil", "900": cifras cortas para ejes y etiquetas de barras.
export function cifraCorta(valor) {
  const abs = Math.abs(valor);
  const signo = valor < 0 ? '-' : '';
  if (abs >= 1e6) return `${signo}${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace('.', ',').replace(',0', '')} M`;
  if (abs >= 1e3) return `${signo}${Math.round(abs / 1e3)} mil`;
  return `${signo}${Math.round(abs)}`;
}

// Tope "redondo" del eje (1, 2 o 5 por una potencia de 10) y su mitad, para dos líneas de guía.
export function topeDelEje(maximo) {
  if (maximo <= 0) return 1000;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  for (const paso of [1, 1.5, 2, 3, 5, 10]) if (paso * potencia >= maximo) return paso * potencia;
  return 10 * potencia;
}
