// Vuelca los colores de tema() a variables CSS en <html>: pageBg -> --page-bg, catASoft -> --cat-a-soft…
import { tema } from './tema.js';

const aVariable = (clave) => '--' + clave.replace(/[A-Z]/g, (letra) => '-' + letra.toLowerCase());

// Tokens que no están en design/tema.js porque solo aparecen en paneles inferiores.
function extras(oscuro) {
  return {
    // Fondo oscurecido detrás de un panel inferior (SelectorCuenta del diseño).
    scrim: oscuro ? 'rgba(4,4,8,0.74)' : 'rgba(16,18,30,0.62)',
    // Lo mismo por partes, para mezclar el color de la barra de estado con color-mix().
    scrimColor: oscuro ? 'rgb(4,4,8)' : 'rgb(16,18,30)',
    scrimAlpha: oscuro ? '74%' : '62%',
  };
}

function escribirVariables(acento, oscuro) {
  const raiz = document.documentElement;
  const colores = { ...tema(acento, oscuro ? 'dark' : 'light'), ...extras(oscuro) };

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
