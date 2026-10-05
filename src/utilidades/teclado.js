// En el iPhone el teclado solo se abre si un campo recibe el foco dentro del toque, y la pantalla
// nueva (búsqueda, nuevo gasto) se dibuja después. Quien la abre llama a prepararTeclado en su
// onClick: un campo invisible toma el foco ya y, cuando la pantalla existe, pasarTeclado se lo da
// al campo de verdad sin que el teclado se cierre. Sin comprobar del todo en el iPhone.
let campoPuente = null;

// numerico: el teclado de números desde el principio (para los montos), así no cambia al pasar.
export function prepararTeclado({ numerico = false } = {}) {
  campoPuente?.remove();
  campoPuente = document.createElement('input');
  campoPuente.setAttribute('aria-hidden', 'true');
  campoPuente.tabIndex = -1;
  if (numerico) campoPuente.inputMode = 'numeric';
  campoPuente.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;';
  document.body.appendChild(campoPuente);
  campoPuente.focus({ preventScroll: true });
  // Si la pantalla nunca llega a pedirlo, no queda un campo con el teclado abierto.
  setTimeout(soltarPuente, 1500);
}

function soltarPuente() {
  campoPuente?.remove();
  campoPuente = null;
}

// El foco (y el teclado, si se preparó) pasa al campo. Sin campo, solo se quita el invisible.
export function pasarTeclado(campo) {
  campo?.focus({ preventScroll: true });
  soltarPuente();
}
