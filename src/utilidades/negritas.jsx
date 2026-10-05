// Texto con «…»: lo de adentro sale en negrita y sin las comillas (pedido del dueño, Sesión 9: en
// toda la app los nombres van en negrita, no entre « »). Para textos que llegan como cadena (avisos
// de error, Ayuda, descripciones de opciones); en JSX se usa <strong> directo.
export function conNegritas(texto) {
  if (typeof texto !== 'string' || !texto.includes('«')) return texto;
  return texto.split(/«([^»]*)»/).map((parte, i) => (i % 2 === 1 ? <strong key={i}>{parte}</strong> : parte));
}
