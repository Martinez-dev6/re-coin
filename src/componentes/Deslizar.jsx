// Cuando cambia "posicion" (sección, mes, filtro…), el contenido nuevo entra con un
// deslizamiento corto desde el lado hacia el que se avanzó: desde la derecha si la posición
// sube y desde la izquierda si baja. posicion es un número o una lista de números que se
// comparan en orden ([sección, mes]: manda la que cambió).
import { useLayoutEffect, useRef } from 'react';
import { CURVA_ENTRAR, sinMovimiento } from '../utilidades/movimiento.js';

function comparar(a, b) {
  const x = [].concat(a);
  const y = [].concat(b);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) return (x[i] ?? -Infinity) > (y[i] ?? -Infinity) ? 1 : -1;
  }
  return 0;
}

export default function Deslizar({ posicion, distancia = 24, as: Etiqueta = 'div', children, ...resto }) {
  const caja = useRef(null);
  const anterior = useRef(posicion);

  useLayoutEffect(() => {
    const lado = comparar(posicion, anterior.current);
    anterior.current = posicion;
    if (lado === 0 || !caja.current || sinMovimiento()) return;
    caja.current.animate(
      [
        { transform: `translateX(${lado * distancia}px)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 340, easing: CURVA_ENTRAR },
    );
  });

  return (
    <Etiqueta ref={caja} {...resto}>
      {children}
    </Etiqueta>
  );
}
