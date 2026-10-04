// Color y modo elegidos, guardados en el teléfono.
// Se usa localStorage (y no la base de datos) porque se lee de forma inmediata al abrir
// la app: así no hay un destello del tema equivocado antes de pintar.
// Ojo: index.html lee esta misma clave en un script en línea; si cambia, cambiarla allá.
import { ACENTOS, ACENTO_PREDETERMINADO, acentoActual, MODOS, MODO_PREDETERMINADO } from './colores.js';

const CLAVE = 'sendo.tema';

export function leerPreferencias() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE)) ?? {};
    const acento = acentoActual(guardado.acento);
    return {
      acento: ACENTOS.some((a) => a.valor === acento) ? acento : ACENTO_PREDETERMINADO,
      modo: MODOS.includes(guardado.modo) ? guardado.modo : MODO_PREDETERMINADO,
    };
  } catch {
    return { acento: ACENTO_PREDETERMINADO, modo: MODO_PREDETERMINADO };
  }
}

export function guardarPreferencias(preferencias) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(preferencias));
  } catch {
    // Sin almacenamiento disponible: el tema funciona igual, solo no se recuerda.
  }
}

export const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

export function esOscuro(modo) {
  return modo === 'oscuro' || (modo === 'auto' && window.matchMedia(CONSULTA_OSCURO).matches);
}
