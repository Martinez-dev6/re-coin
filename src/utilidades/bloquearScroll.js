// Con un panel o una ventana flotante abiertos, la página de atrás no se desplaza. Puede haber varios
// a la vez (un panel de elección encima de la ventana de editar un movimiento): el bloqueo se quita
// cuando se cierra el último. Antes cada uno ponía y quitaba overflow por su cuenta, y al cerrar el
// panel de encima la página volvía a desplazarse detrás de la ventana que seguía abierta.
let abiertos = 0;

// Bloquea el scroll y devuelve cómo soltarlo (llamarlo más de una vez no hace nada).
export function bloquearScroll() {
  abiertos += 1;
  document.body.style.overflow = 'hidden';
  let soltado = false;
  return () => {
    if (soltado) return;
    soltado = true;
    abiertos -= 1;
    if (abiertos === 0) document.body.style.overflow = '';
  };
}
