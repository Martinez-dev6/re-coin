// En el iPhone el teclado solo se abre si un campo recibe el foco dentro del toque, y la pantalla
// nueva (búsqueda, nuevo gasto) se dibuja después. Quien la abre llama a prepararTeclado en su
// onClick: un campo invisible toma el foco ya y, cuando la pantalla existe, pasarTeclado se lo da
// al campo de verdad.
// El invisible va con inputmode="none" (sin teclado): así el teclado no aparece de golpe con el
// toque, sino que sube con su propia animación cuando la pantalla ya terminó de entrar (pedido del
// dueño, 2026-10-04: "es como si el teclado ya estuviera ahí puesto"). Sin comprobar en el iPhone
// que iOS lo suba al pasar el foco desde un campo sin teclado.
import { cuandoQuieta } from './pantallaQuieta.js';

let campoPuente = null;
let espera = null;

export function prepararTeclado() {
  soltarPuente();
  campoPuente = document.createElement('input');
  campoPuente.setAttribute('aria-hidden', 'true');
  campoPuente.tabIndex = -1;
  campoPuente.inputMode = 'none';
  campoPuente.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;caret-color:transparent;';
  document.body.appendChild(campoPuente);
  campoPuente.focus({ preventScroll: true });
  // Si la pantalla nunca llega a pedirlo, no queda un campo con el foco.
  espera = setTimeout(soltarPuente, 2000);
}

function soltarPuente() {
  clearTimeout(espera);
  campoPuente?.remove();
  campoPuente = null;
}

// Cuando la pantalla termina de entrar, el foco (y el teclado, si se preparó) pasa al campo. Sin
// campo, solo se quita el invisible. Devuelve cómo cancelarlo (al salir de la pantalla antes).
export function pasarTeclado(obtenerCampo) {
  const cancelar = cuandoQuieta(() => {
    obtenerCampo()?.focus({ preventScroll: true });
    soltarPuente();
  });
  return () => {
    cancelar();
    soltarPuente();
  };
}
