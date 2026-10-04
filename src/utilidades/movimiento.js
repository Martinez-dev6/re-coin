// Ritmo de los deslizamientos: pantallas, pestañas, selectores y filas de las listas.
import { useLayoutEffect, useRef } from 'react';

// Curvas de los deslizamientos.
// Historia: la primera, (0.32, 0.72, 0, 1), salía de golpe: en el video del iPhone la pantalla
// ya había recorrido un 20 % en el primer cuadro. La segunda, (0.2, 0, 0, 1), el dueño la sintió
// lenta. La tercera, (0.2, 0.2, 0, 1), le gustó de velocidad pero la sintió forzada (2026-10-04):
// medida, recorría el 38 % del camino entre el 4 % y el 15 % del tiempo (un tirón) y luego se
// arrastraba; y al volver se usaba otra que arrancaba lenta, como dudando.
// Ahora es un resorte sin rebote, como los de iOS: arranca desde quieto pero gana velocidad
// enseguida, su punto más rápido es un tercio menos brusco que el de la anterior y frena de forma
// pareja. Llega a la mitad del tiempo casi al mismo punto que la anterior (91 % contra 90 %), así
// que la velocidad se siente igual. Es la misma para ir y para volver.
// - ENTRAR: el resorte (lo que llega, vuelve o cambia de sitio).
// - SUAVE: arranca y termina suave, sin cola larga (lo que se va, como un panel que baja).
const RIGIDEZ = 8; // ω·duración: más alto, frena antes
const resorte = (t) => 1 - (1 + RIGIDEZ * t) * Math.exp(-RIGIDEZ * t);
const puntos = Array.from({ length: 41 }, (_, i) => +(resorte(i / 40) / resorte(1)).toFixed(4));
const RESPALDO = 'cubic-bezier(0.25, 0.8, 0.25, 1)'; // navegadores sin linear()
export const CURVA_ENTRAR =
  typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? `linear(${puntos.join(', ')})`
    : RESPALDO;
export const CURVA_SUAVE = 'cubic-bezier(0.35, 0.1, 0.15, 1)';

// Las transiciones de CSS usan la misma curva (--curva-entrar; base.css tiene el respaldo).
document.documentElement.style.setProperty('--curva-entrar', CURVA_ENTRAR);

// Quien activó "Reducir movimiento" en el teléfono no ve deslizamientos.
export const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURACION_FILA_MS = 290;

function leerFilas(caja) {
  const filas = new Map();
  for (const fila of caja.children) {
    if (fila.dataset.clave) filas.set(fila.dataset.clave, { fila, alto: fila.offsetHeight });
  }
  return filas;
}

// Cambia el alto de una fila recortando su contenido mientras dura.
function animarAlto(fila, desde, hasta, alTerminar) {
  fila.style.overflow = 'hidden';
  const animacion = fila.animate(
    [
      { height: `${desde}px`, minHeight: '0px', opacity: desde ? 1 : 0 },
      { height: `${hasta}px`, minHeight: '0px', opacity: hasta ? 1 : 0 },
    ],
    { duration: DURACION_FILA_MS, easing: hasta ? CURVA_ENTRAR : CURVA_SUAVE, fill: hasta ? 'none' : 'forwards' },
  );
  const fin = () => {
    fila.style.overflow = '';
    alTerminar?.();
  };
  animacion.finished.then(fin, fin);
}

// Filas que aparecen y desaparecen sin saltos: la nueva crece desde cero y la que se quita se
// encoge hasta desaparecer; las de abajo se corren solas. Las filas son los hijos directos de
// la caja y llevan data-clave. Si cambia la lista entera (otra pestaña, otro mes), no se anima
// fila por fila: de eso se encarga Deslizar.
export function useFilasAnimadas(caja) {
  const antes = useRef(null);

  useLayoutEffect(() => {
    const contenedor = caja.current;
    const previo = antes.current;
    const filas = contenedor ? leerFilas(contenedor) : null;
    antes.current = filas && { contenedor, filas };
    if (!filas || previo?.contenedor !== contenedor || sinMovimiento()) return;
    if (![...filas.keys()].some((clave) => previo.filas.has(clave))) return;

    for (const [clave, { fila, alto }] of filas) {
      if (!previo.filas.has(clave)) animarAlto(fila, 0, alto);
    }

    // React ya quitó la fila: en su lugar se pone una copia sin eventos que se encoge.
    const clavesPrevias = [...previo.filas.keys()];
    clavesPrevias.forEach((clave, indice) => {
      if (filas.has(clave)) return;
      const siguiente = clavesPrevias.slice(indice + 1).find((otra) => filas.has(otra));
      const { fila, alto } = previo.filas.get(clave);
      const copia = fila.cloneNode(true);
      delete copia.dataset.clave;
      copia.inert = true;
      copia.setAttribute('aria-hidden', 'true');
      copia.style.pointerEvents = 'none';
      // Sin una fila siguiente, va justo después de la última (puede haber algo más al final,
      // como el total de Inicio).
      const antesDe = siguiente ? filas.get(siguiente).fila : [...filas.values()].at(-1).fila.nextSibling;
      contenedor.insertBefore(copia, antesDe);
      const quitar = () => copia.remove();
      animarAlto(copia, alto, 0, quitar);
      setTimeout(quitar, DURACION_FILA_MS + 300); // por si el navegador congela la animación
    });
  });
}
