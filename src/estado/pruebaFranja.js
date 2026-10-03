// PRUEBA TEMPORAL: variantes de la franja de la barra de estado al oscurecer, para
// compararlas en el iPhone sin publicar una versión por cada una (Mi espacio → Pruebas).
// Se aplican con data-franja en <html> (ver BarraEstado.css). Quitar cuando se elija una.
const CLAVE = 'sendo.pruebaFranja';

export const VARIANTES_FRANJA = [
  { valor: 'capas', titulo: 'A · Dos capas', detalle: 'La de ahora' },
  { valor: 'unico', titulo: 'D · Un solo oscurecido', detalle: 'La franja queda bajo el mismo oscurecido' },
  { valor: 'ritmo', titulo: 'E · Mismo ritmo', detalle: 'Fondo y franja cambian en el mismo cuadro' },
];

export function leerVarianteFranja() {
  try {
    const guardada = localStorage.getItem(CLAVE);
    return VARIANTES_FRANJA.some((v) => v.valor === guardada) ? guardada : 'capas';
  } catch {
    return 'capas';
  }
}

export function aplicarVarianteFranja(valor) {
  document.documentElement.dataset.franja = valor;
  try {
    localStorage.setItem(CLAVE, valor);
  } catch {
    // Sin almacenamiento: la variante dura hasta cerrar la app.
  }
}
