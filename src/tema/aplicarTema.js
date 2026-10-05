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

// Colores de categoría que no están en design/tema.js (la segunda fila de la rejilla, 2026-10-04):
// [claro, oscuro]. Mismo criterio que los de tema.js (tonos 700 y 400): contraste de 5 a 7,9 sobre
// blanco en claro y de 6 a 11,8 sobre la superficie en oscuro, también sobre su fondo suave.
const COLORES_EXTRA = {
  h: ['#b91c1c', '#f87171'],
  i: ['#8a4b26', '#d6a072'],
  j: ['#4d7c0f', '#a3e635'],
  k: ['#0f766e', '#2dd4bf'],
  l: ['#4338ca', '#818cf8'],
  m: ['#a21caf', '#e879f9'],
  o: ['#475569', '#94a3b8'],
};

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
const VARIABLES_DE_COLOR = ['bannerBg', 'onBanner', 'onBannerMuted', 'bannerRing', 'accentText', 'accentSoft', 'chipBg'];
export function variablesDeColor(color, oscuro) {
  if (!ACENTOS.some((a) => a.valor === color)) return undefined;
  const colores = tema(color, oscuro ? 'dark' : 'light');
  return Object.fromEntries(VARIABLES_DE_COLOR.map((clave) => [aVariable(clave), colores[clave]]));
}
