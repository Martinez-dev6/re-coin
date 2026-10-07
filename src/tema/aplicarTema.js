// Vuelca los colores de tema() a variables CSS en <html>: pageBg -> --page-bg, catASoft -> --cat-a-soft…
import { ACENTOS } from './colores.js';
import { tema } from './tema.js';

const aVariable = (clave) => '--' + clave.replace(/[A-Z]/g, (letra) => '-' + letra.toLowerCase());

// Mezcla un color #rrggbb con otro [r, g, b] en la proporción indicada (0–1) → #rrggbb.
function mezclar(hex, encima, proporcion) {
  const n = parseInt(hex.slice(1), 16);
  const base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return '#' + base.map((v, i) => Math.round(v * (1 - proporcion) + encima[i] * proporcion).toString(16).padStart(2, '0')).join('');
}

// Colores de categoría [claro, oscuro], uno por letra (--cat-X y --cat-X-soft). Sesión 9 (pedido del
// dueño: "que no se parezcan, muy variado"): 18 colores elegidos a mano por familia (rojo, naranja,
// dorado, lima, esmeralda, cian, azul, índigo, violeta, fucsia, rosa, vino, marrón, arena, gris,
// grafito, oliva, bosque) y medidos con CIEDE2000: el par más parecido queda en 10 o más, en claro y
// en oscuro (antes había pares de 4,7). Reemplazan también los de a–g de design/tema.js (se aplican
// después). En claro, 3:1 o más sobre blanco; en oscuro, 3,5:1 o más sobre la superficie.
// k, q y s ya no se ofrecen: Dexie versión 9 pasa las categorías que los tenían a u, b y l (y
// restaurarCopia, las copias viejas); siguen definidos por si algo quedara con ellos.
export const COLORES_CATEGORIA_TEMA = {
  h: ['#dc2626', '#f87171'], // rojo
  a: ['#ea580c', '#fb923c'], // naranja
  p: ['#a16207', '#facc15'], // dorado
  j: ['#4d7c0f', '#bef264'], // lima
  u: ['#047857', '#5eead4'], // esmeralda
  b: ['#0e7490', '#38bdf8'], // cian
  g: ['#2563eb', '#818cf8'], // azul
  l: ['#312e81', '#c7d2fe'], // índigo
  c: ['#7e22ce', '#c084fc'], // violeta
  m: ['#c026d3', '#f0abfc'], // fucsia
  e: ['#db2777', '#fda4af'], // rosa
  r: ['#881337', '#e11d48'], // vino
  i: ['#7c2d12', '#d6a072'], // marrón
  d: ['#8a6d3b', '#e7d3a8'], // arena
  o: ['#475569', '#94a3b8'], // gris
  t: ['#27272a', '#e4e4e7'], // grafito
  v: ['#4d5d16', '#a3b35a'], // oliva
  f: ['#14532d', '#22c55e'], // bosque
  k: ['#047857', '#5eead4'], // (como u)
  q: ['#0e7490', '#38bdf8'], // (como b)
  s: ['#312e81', '#c7d2fe'], // (como l)
};
const COLORES_EXTRA = COLORES_CATEGORIA_TEMA;

function coloresExtra(oscuro) {
  const variables = {};
  for (const [letra, par] of Object.entries(COLORES_EXTRA)) {
    const color = par[oscuro ? 1 : 0];
    const n = parseInt(color.slice(1), 16);
    const clave = 'cat' + letra.toUpperCase();
    variables[clave] = color;
    variables[clave + 'Soft'] = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.14)`;
  }
  return variables;
}

// Tokens que no están en design/tema.js: los de Inicio vienen de su comentario inicial,
// los demás de los HTML del diseño (paneles inferiores y menú del "+").
function extras(oscuro, colores) {
  const esRojo = colores.expenseOnWhite === '#a3195b';
  const scrimRgb = oscuro ? [4, 4, 4] : [16, 18, 30];
  const scrimAlfa = oscuro ? 0.74 : 0.62;
  return {
    // Flechas blancas del banner de Inicio (mismo color en claro y oscuro).
    incomeOnWhite: '#0b7a43',
    // Insignias de "Pendientes y alertas".
    badgeRedBg: oscuro ? (esRojo ? '#f472b6' : '#ff7a70') : esRojo ? '#a3195b' : '#c62828',
    badgeRedText: oscuro ? '#1a0f0f' : '#ffffff',
    badgeGreenBg: oscuro ? '#5fd39a' : '#0b7a43',
    badgeGreenText: oscuro ? '#0e1a13' : '#ffffff',
    // Círculos del menú del "+".
    menuBg: oscuro ? '#2c2c2c' : '#ffffff',
    // Íconos de Transferencia (azul) y Gasto con tarjeta (amarillo) en ese menú: fijos, no siguen
    // el color del tema, como los de Ingreso y Gasto (pedido del dueño, 2026-10-04). Contraste
    // sobre el círculo: azul 5,2 y 5,4; amarillo 3,1 (el amarillo más claro que aún se distingue
    // sobre blanco) y 9.
    menuTransferencia: oscuro ? '#60a5fa' : '#2563eb',
    menuTarjeta: oscuro ? '#facc15' : '#bf8700',
    // Pastilla "Pendiente" de las filas (Sesión 9): amarilla, para que no se confunda con el rojo de
    // los gastos. Texto sobre su fondo: 5,9:1 en claro.
    pendienteFondo: oscuro ? 'rgba(250,204,21,0.16)' : '#fef08a',
    pendienteTexto: oscuro ? '#facc15' : '#854d0e',
    menuBorde: oscuro ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)',
    // Fondo oscurecido detrás de un panel inferior o del menú del "+".
    scrim: `rgba(${scrimRgb.join(',')},${scrimAlfa})`,
    // El mismo oscurecido ya aplicado sobre el banner y sobre el fondo, como color opaco:
    // lo usa la franja de la barra de estado con un panel abierto (ver BarraEstado.css).
    bannerDim: mezclar(colores.bannerBg, scrimRgb, scrimAlfa),
    pageDim: mezclar(colores.pageBg, scrimRgb, scrimAlfa),
    // Sombra de las tarjetas: en oscuro tema() da 'none', que no se puede animar. Se deja la
    // misma sombra y se anima solo su color (transparente en oscuro), que sí es un color.
    shadow: '0 1px 2px var(--sombra-color)',
    sombraColor: oscuro ? 'rgba(20,21,28,0)' : 'rgba(20,21,28,0.06)',
  };
}

// Fondo suave y color de ícono de cada uno de los 10 colores, para las cuentas con color propio
// (estiloIconoCuenta en colores.js): --acento0-suave, --acento0-texto… Cambian con el modo
// oscuro y se animan junto con el resto del tema.
function coloresDeCuentas(oscuro) {
  const variables = {};
  ACENTOS.forEach(({ valor }, indice) => {
    const colores = tema(valor, oscuro ? 'dark' : 'light');
    variables[`acento${indice}Suave`] = colores.accentSoft;
    variables[`acento${indice}Texto`] = colores.accentText;
  });
  return variables;
}

// Fundido del tema: las variables de color se registran como colores (@property) y se
// animan una sola vez, en <html>. Todo lo que las usa cambia en el mismo cuadro y al mismo
// ritmo. Antes se animaba el color de cada elemento (transiciones en "*"), y en Safari un
// texto que hereda el color de un padre que también se está animando va detrás de él:
// cuanto más adentro está el texto, más tarde cambia.
const registradas = new Set();

function registrarColor(nombre, valor) {
  if (registradas.has(nombre) || !window.CSS?.registerProperty || !CSS.supports('color', valor)) return;
  try {
    CSS.registerProperty({ name: nombre, syntax: '<color>', inherits: true, initialValue: valor });
    registradas.add(nombre);
  } catch (error) {
    // Ya estaba registrada (recarga en caliente de Vite).
    if (error.name === 'InvalidModificationError') registradas.add(nombre);
  }
}

function escribirVariables(acento, oscuro) {
  const raiz = document.documentElement;
  const base = tema(acento, oscuro ? 'dark' : 'light');
  const colores = { ...base, ...extras(oscuro, base), ...coloresExtra(oscuro), ...coloresDeCuentas(oscuro) };

  for (const [clave, valor] of Object.entries(colores)) {
    registrarColor(aVariable(clave), valor);
    raiz.style.setProperty(aVariable(clave), valor);
  }
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';

  // iOS 26+ ignora theme-color (ver BarraEstado), pero otros navegadores lo usan.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colores.bannerBg);
}

const DURACION_TRANSICION_MS = 350;
// Pasa muy rápido por la mitad: al cambiar de claro a oscuro, texto y fondo se cruzan en un
// gris medio y con una curva suave el texto "desaparecía" un momento.
const CURVA_TRANSICION = 'cubic-bezier(0.75, 0, 0.25, 1)';
let finTransicion;

// animar: fundido de 350 ms de todos los colores a la vez.
// No se usa View Transitions: pone una capa encima de la página durante el fundido y
// iOS deja de ver la franja de la barra de estado, así que la isla cambiaba al final.
export function aplicarTema(acento, oscuro, { animar = false } = {}) {
  const raiz = document.documentElement;
  if (animar && registradas.size && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // La transición se pone en el mismo cuadro en que cambian las variables. El atributo
    // apaga mientras tanto las transiciones de color propias de cada elemento (base.css).
    raiz.style.transition = [...registradas].map((nombre) => `${nombre} ${DURACION_TRANSICION_MS}ms ${CURVA_TRANSICION}`).join(', ');
    raiz.dataset.transicionTema = '';
    clearTimeout(finTransicion);
    finTransicion = setTimeout(() => {
      raiz.style.transition = '';
      delete raiz.dataset.transicionTema;
    }, DURACION_TRANSICION_MS + 50);
  }
  escribirVariables(acento, oscuro);
}

// Los colores del tema para un color de cuenta o tarjeta, como variables CSS para un solo elemento
// (Sesión 9: la ventana flotante de una cuenta o tarjeta va toda con su color, sin cambiar el de la
// app). Sin color (o uno que no es de los 10), undefined: la ventana sigue con el del tema.
// acentoApp: el color del tema de la app; con él van los íconos de los campos (--icono-app-…), que
// siguen "Color de los íconos" de Apariencia y no el color de la cuenta (pedido del dueño).
const VARIABLES_DE_COLOR = ['bannerBg', 'onBanner', 'onBannerMuted', 'bannerRing', 'accentText', 'accentSoft', 'chipBg'];
export function variablesDeColor(color, oscuro, acentoApp) {
  if (!ACENTOS.some((a) => a.valor === color)) return undefined;
  const modo = oscuro ? 'dark' : 'light';
  const colores = tema(color, modo);
  const app = tema(acentoApp, modo);
  return {
    ...Object.fromEntries(VARIABLES_DE_COLOR.map((clave) => [aVariable(clave), colores[clave]])),
    '--icono-app-suave': app.accentSoft,
    '--icono-app-texto': app.accentText,
  };
}
