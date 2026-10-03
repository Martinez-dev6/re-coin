// Volver a la pantalla anterior de la app. Si se abrió la dirección directamente (no hay
// historial propio, p. ej. al recargar), ir a la pantalla padre.
export function volver(navegar, padre) {
  if (window.history.state?.idx > 0) navegar(-1);
  else navegar(padre, { replace: true });
}
