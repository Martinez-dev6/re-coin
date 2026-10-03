// Avisa en <html> que hay una capa oscura (panel inferior o menú del "+") para que la franja
// de la barra de estado la acompañe (ver BarraEstado.css):
// - data-capa-oscura: mientras la capa está montada, también durante la animación de cierre.
//   La franja sube por encima del oscurecido.
// - data-oscurecido: mientras el oscurecido está visible. La franja pasa al color oscurecido.
// - data-aclarando: desde que el oscurecido empieza a irse hasta que la capa se desmonta.
//   La franja vuelve a su color.
// Antes las dos primeras eran un solo atributo que se quitaba al empezar el cierre: la
// franja bajaba de golpe por debajo del oscurecido, todavía opaco, y se oscurecía dos veces.
// Se ponen con useLayoutEffect para que cambien en el mismo cuadro que la clase "visible"
// del fondo; con useEffect la franja podía empezar un cuadro tarde.
import { useLayoutEffect, useRef } from 'react';

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
  const oscuro = montado && visible;
  const quitarAclarando = useRef(null);
  const dejarDeAclarar = () => {
    quitarAclarando.current?.();
    quitarAclarando.current = null;
  };

  // Va antes que el efecto de "montado": si la capa desaparece de golpe estando visible,
  // React limpia en este orden y el de abajo quita el "aclarando" que pone este.
  useLayoutEffect(() => {
    if (!oscuro) return undefined;
    dejarDeAclarar();
    const quitar = marcar('oscurecido');
    return () => {
      quitar();
      dejarDeAclarar();
      quitarAclarando.current = marcar('aclarando');
    };
  }, [oscuro]);

  useLayoutEffect(() => {
    if (!montado) return undefined;
    const quitar = marcar('capaOscura');
    return () => {
      dejarDeAclarar();
      quitar();
    };
  }, [montado]);
}
