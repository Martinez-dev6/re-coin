// PRUEBA TEMPORAL: ajuste en vivo del arranque y la duración del oscurecido (Mi espacio →
// Pruebas). La grabación de pantalla cambia el momento en que iOS arranca su fundido de la
// zona de la hora y la isla, así que el ajuste se hace a ojo, sin grabar.
// Pisa --oscurecido-retraso y --oscurecido-duracion de base.css. Quitar cuando se elija.
const CLAVE = 'sendo.pruebaRitmo';

export const RETRASOS = [-40, -30, -20, -10, 0, 10, 20];
export const DURACIONES = [80, 100, 120];
const PREDETERMINADO = { retraso: -10, duracion: 100 };

export function leerRitmo() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE)) ?? {};
    return {
      retraso: RETRASOS.includes(guardado.retraso) ? guardado.retraso : PREDETERMINADO.retraso,
      duracion: DURACIONES.includes(guardado.duracion) ? guardado.duracion : PREDETERMINADO.duracion,
    };
  } catch {
    return { ...PREDETERMINADO };
  }
}

export function aplicarRitmo(ritmo) {
  const raiz = document.documentElement;
  raiz.style.setProperty('--oscurecido-retraso', `${ritmo.retraso}ms`);
  raiz.style.setProperty('--oscurecido-duracion', `${ritmo.duracion}ms`);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ritmo));
  } catch {
    // Sin almacenamiento: el ajuste dura hasta cerrar la app.
  }
}
