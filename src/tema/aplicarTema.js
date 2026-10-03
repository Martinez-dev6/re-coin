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

// Duración del fundido al cambiar de color o de modo (debe coincidir con base.css).
const DURACION_TRANSICION_MS = 350;
let finTransicion;

// animar: fundido de todos los colores a la vez (banner, franja de la barra de estado,
// tarjetas, textos). No se anima la primera aplicación al abrir la app.
export function aplicarTema(acento, oscuro, { animar = false } = {}) {
  const raiz = document.documentElement;
  const colores = { ...tema(acento, oscuro ? 'dark' : 'light'), ...extras(oscuro) };

  if (animar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // El atributo activa las transiciones en el mismo cuadro en que cambian las variables.
    raiz.dataset.transicionTema = '';
    clearTimeout(finTransicion);
    finTransicion = setTimeout(() => delete raiz.dataset.transicionTema, DURACION_TRANSICION_MS + 50);
  }

  for (const [clave, valor] of Object.entries(colores)) {
    raiz.style.setProperty(aVariable(clave), valor);
  }
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';

  // iOS 26+ ignora theme-color (ver BarraEstado), pero otros navegadores lo usan.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colores.bannerBg);
}
