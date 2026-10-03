// Vuelca los colores de tema() a variables CSS en <html>: pageBg -> --page-bg, catASoft -> --cat-a-soft…
import { tema } from './tema.js';

const aVariable = (clave) => '--' + clave.replace(/[A-Z]/g, (letra) => '-' + letra.toLowerCase());

// Mezcla un color #rrggbb con otro [r, g, b] en la proporción indicada (0–1) → #rrggbb.
function mezclar(hex, encima, proporcion) {
  const n = parseInt(hex.slice(1), 16);
  const base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return '#' + base.map((v, i) => Math.round(v * (1 - proporcion) + encima[i] * proporcion).toString(16).padStart(2, '0')).join('');
}

// Tokens que no están en design/tema.js: los de Inicio vienen de su comentario inicial,
// los demás de los HTML del diseño (paneles inferiores y menú del "+").
function extras(oscuro, colores) {
  const esRojo = colores.expenseOnWhite === '#a3195b';
  const scrimRgb = oscuro ? [4, 4, 8] : [16, 18, 30];
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
    menuBg: oscuro ? '#2b2c38' : '#ffffff',
    menuBorde: oscuro ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)',
    // Fondo oscurecido detrás de un panel inferior o del menú del "+".
    scrim: `rgba(${scrimRgb.join(',')},${scrimAlfa})`,
    // El mismo oscurecido ya aplicado sobre el banner y sobre el fondo, como color opaco:
    // lo usa la franja de la barra de estado con un panel abierto (ver BarraEstado.css).
    bannerDim: mezclar(colores.bannerBg, scrimRgb, scrimAlfa),
    pageDim: mezclar(colores.pageBg, scrimRgb, scrimAlfa),
  };
}

function escribirVariables(acento, oscuro) {
  const raiz = document.documentElement;
  const base = tema(acento, oscuro ? 'dark' : 'light');
  const colores = { ...base, ...extras(oscuro, base) };

  for (const [clave, valor] of Object.entries(colores)) {
    raiz.style.setProperty(aVariable(clave), valor);
  }
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';

  // iOS 26+ ignora theme-color (ver BarraEstado), pero otros navegadores lo usan.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colores.bannerBg);
}

// Duración del fundido (debe coincidir con base.css).
const DURACION_TRANSICION_MS = 350;
let finTransicion;

// animar: fundido de todos los colores a la vez con transiciones CSS (base.css).
// No se usa View Transitions: pone una capa encima de la página durante el fundido y
// iOS deja de ver la franja de la barra de estado, así que la isla cambiaba al final.
export function aplicarTema(acento, oscuro, { animar = false } = {}) {
  const raiz = document.documentElement;
  if (animar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // El atributo activa las transiciones en el mismo cuadro en que cambian las variables.
    raiz.dataset.transicionTema = '';
    clearTimeout(finTransicion);
    finTransicion = setTimeout(() => delete raiz.dataset.transicionTema, DURACION_TRANSICION_MS + 50);
  }
  escribirVariables(acento, oscuro);
}
