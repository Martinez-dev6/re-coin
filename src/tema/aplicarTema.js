// Vuelca los colores de tema() a variables CSS en <html>: pageBg -> --page-bg, catASoft -> --cat-a-soft…
import { tema } from './tema.js';

const aVariable = (clave) => '--' + clave.replace(/[A-Z]/g, (letra) => '-' + letra.toLowerCase());

// Tokens que no están en design/tema.js: los de Inicio vienen de su comentario inicial,
// los demás de los HTML del diseño (paneles inferiores y menú del "+").
function extras(oscuro, colores) {
  const esRojo = colores.expenseOnWhite === '#a3195b';
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
    // Fondo oscurecido detrás de un panel inferior (SelectorCuenta del diseño).
    scrim: oscuro ? 'rgba(4,4,8,0.74)' : 'rgba(16,18,30,0.62)',
    // Lo mismo por partes, para mezclar el color de la barra de estado con color-mix().
    scrimColor: oscuro ? 'rgb(4,4,8)' : 'rgb(16,18,30)',
    scrimAlpha: oscuro ? '74%' : '62%',
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

// animar: fundido de toda la pantalla de una sola vez (View Transitions): el navegador
// toma una imagen antes y otra después y las mezcla, así textos, fondos e íconos cambian
// exactamente al mismo tiempo. La franja de la barra de estado no sale en esa imagen
// (iOS pinta la barra copiando su color), así que hace su propia transición de la misma
// duración (ver BarraEstado.css y base.css). Sin soporte o con "Reducir movimiento",
// el cambio es directo.
export function aplicarTema(acento, oscuro, { animar = false } = {}) {
  const raiz = document.documentElement;
  const sinAnimacion =
    !animar || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (sinAnimacion) {
    escribirVariables(acento, oscuro);
    return;
  }

  raiz.dataset.transicionTema = '';
  const transicion = document.startViewTransition(() => escribirVariables(acento, oscuro));
  // Si el navegador omite la animación (app en segundo plano, otro cambio encima),
  // los colores igual se aplican; solo se ignora el aviso.
  transicion.ready.catch(() => {});
  transicion.finished.finally(() => delete raiz.dataset.transicionTema);
}
