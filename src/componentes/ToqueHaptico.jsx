// Vibración suave al tocar un botón en el iPhone (pedido del dueño, 2026-10-04).
// Safari no tiene navigator.vibrate. Lo que sí da un toque háptico es cambiar un interruptor
// nativo (<input type="checkbox" switch>). Hasta iOS 26.4 bastaba con cambiarlo desde el código;
// desde iOS 26.5 Apple solo lo permite si el dedo lo toca directamente. Por eso va un interruptor
// real e invisible encima de todo el botón: el dedo lo toca, iOS vibra, y el clic sigue hacia el
// botón (que hace lo suyo en su onClick). Va dentro del botón, que debe tener position: relative
// o absolute (estilos en comunes.css).
// - No quitarle la apariencia nativa (appearance): sin ella iOS no vibra.
// - aria-hidden y fuera del orden de tabulación: para lectores de pantalla y teclado el control es
//   el botón.
// - disabled: el botón deshabilitado tampoco vibra.
export default function ToqueHaptico({ disabled }) {
  return <input type="checkbox" switch="" className="toque-haptico" aria-hidden="true" tabIndex={-1} disabled={disabled} />;
}
