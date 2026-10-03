// PRUEBA TEMPORAL: ajuste en vivo del arranque y la duración del oscurecido (Mi espacio →
// Pruebas). La grabación de pantalla cambia el momento en que iOS arranca su fundido de la
// zona de la hora y la isla, así que el ajuste se hace a ojo, sin grabar.
// Pisa --oscurecido-retraso, --oscurecido-duracion y --oscurecido-curva de base.css.
// Quitar cuando se elija.
const CLAVE = 'sendo.pruebaRitmo';

export const RETRASOS = [-20, -15, -10, -5, 0];
export const DURACIONES = [70, 75, 80, 85, 90];
export const CURVAS = [
  { valor: 'linear', texto: 'Recta' },
  { valor: 'ease-out', texto: 'Frena al final' },
  { valor: 'ease-in', texto: 'Arranca suave' },
];
const PREDETERMINADO = { retraso: -10, duracion: 80, curva: 'linear' };

export function leerRitmo() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE)) ?? {};
    return {
      retraso: RETRASOS.includes(guardado.retraso) ? guardado.retraso : PREDETERMINADO.retraso,
      duracion: DURACIONES.includes(guardado.duracion) ? guardado.duracion : PREDETERMINADO.duracion,
      curva: CURVAS.some((c) => c.valor === guardado.curva) ? guardado.curva : PREDETERMINADO.curva,
    };
  } catch {
    return { ...PREDETERMINADO };
  }
}

export function aplicarRitmo(ritmo) {
  const raiz = document.documentElement;
  raiz.style.setProperty('--oscurecido-retraso', `${ritmo.retraso}ms`);
  raiz.style.setProperty('--oscurecido-duracion', `${ritmo.duracion}ms`);
  raiz.style.setProperty('--oscurecido-curva', ritmo.curva);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ritmo));
  } catch {
    // Sin almacenamiento: el ajuste dura hasta cerrar la app.
  }
}
