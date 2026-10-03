// Avisa en <html> que hay una capa oscura (panel inferior o menú del "+") para que la franja
// de la barra de estado la acompañe (ver BarraEstado.css):
// - data-capa-oscura: mientras la capa está montada, también durante la animación de cierre.
//   La franja sube por encima del oscurecido.
// - data-oscurecido: mientras el oscurecido está visible. La franja pasa al color oscurecido
//   con la misma duración y curva que el fondo, y al cerrar se aclara a la vez que él.
// Antes las dos cosas eran un solo atributo que se quitaba al empezar el cierre: la franja
// bajaba de golpe por debajo del oscurecido, todavía opaco, y se oscurecía dos veces.
// Se ponen con useLayoutEffect para que cambien en el mismo cuadro que la clase "visible"
// del fondo; con useEffect la franja podía empezar un cuadro tarde.
import { useLayoutEffect } from 'react';

const capas = {};

function marcar(atributo) {
  const raiz = document.documentElement;
  capas[atributo] = (capas[atributo] ?? 0) + 1;
  raiz.dataset[atributo] = '';
  return () => {
    capas[atributo] -= 1;
    if (capas[atributo] === 0) delete raiz.dataset[atributo];
  };
}

export function useOscurecido(montado, visible) {
  useLayoutEffect(() => (montado ? marcar('capaOscura') : undefined), [montado]);
  useLayoutEffect(() => (visible ? marcar('oscurecido') : undefined), [visible]);
}
