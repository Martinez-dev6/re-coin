// Vibración corta y suave al tocar (pedido del dueño, 2026-10-04): al abrir el "+" y al confirmar
// un movimiento. Hay que llamarla dentro del toque mismo (en el onClick, sin esperar nada antes).
// - Android: navigator.vibrate.
// - iPhone: Safari no tiene navigator.vibrate. Desde iOS 18, cambiar un interruptor
//   (<input type="checkbox" switch>) da un toque háptico del sistema; se crea uno invisible, se
//   "toca" su etiqueta y se quita. En versiones anteriores de iOS no hace nada (ni falla).
export function vibrar() {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(8);
      return;
    }
    const etiqueta = document.createElement('label');
    etiqueta.setAttribute('aria-hidden', 'true');
    etiqueta.style.display = 'none';
    const interruptor = document.createElement('input');
    interruptor.type = 'checkbox';
    interruptor.setAttribute('switch', '');
    etiqueta.append(interruptor);
    // En <head> y no en <body>: el clic no pasa por la app (React escucha en #root).
    document.head.append(etiqueta);
    etiqueta.click();
    etiqueta.remove();
  } catch {
    // Sin vibración: no importa.
  }
}
