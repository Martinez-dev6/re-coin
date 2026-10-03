// Ritmo de los deslizamientos: pantallas, pestañas, selectores y filas de las listas.
import { useLayoutEffect, useRef } from 'react';

// Curvas de los deslizamientos (las mismas están en base.css para las transiciones de CSS).
// Las dos arrancan con velocidad cero: la anterior (0.32, 0.72, 0, 1) salía de golpe y en
// el video del iPhone la pantalla ya había recorrido un 20 % en el primer cuadro; al cerrar,
// bajaba casi entera en uno o dos cuadros y quedaba una franja arrastrándose al final.
// - ENTRAR: acelera y frena largo, como un resorte sin rebote (lo que llega).
// - SUAVE: arranca y termina suave, sin cola larga (lo que sale, vuelve o se mueve de sitio).
export const CURVA_ENTRAR = 'cubic-bezier(0.2, 0, 0, 1)';
export const CURVA_SUAVE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Quien activó "Reducir movimiento" en el teléfono no ve deslizamientos.
export const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURACION_FILA_MS = 300;

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
      contenedor.insertBefore(copia, siguiente ? filas.get(siguiente).fila : null);
      const quitar = () => copia.remove();
      animarAlto(copia, alto, 0, quitar);
      setTimeout(quitar, DURACION_FILA_MS + 300); // por si el navegador congela la animación
    });
  });
}
