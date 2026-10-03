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
  const colores = { ...base, ...extras(oscuro, base), ...coloresDeCuentas(oscuro) };

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
