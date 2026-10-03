// Franja fija en el borde superior que le da color a la barra de estado del iPhone.
// Desde iOS/Safari 26 el sistema ignora theme-color: copia el color del elemento fijo
// que encuentra en el centro del borde superior (unos 4 px hacia adentro); si no hay,
// usa el fondo de la página. Esta franja es ese elemento.
// tono: 'banner' (pantallas con banner de color) o 'pagina' (pantallas sin banner). Va en
// data-tono y no como clase: la clase global .banner (comunes.css) le pondría relleno y
// esquinas redondeadas, y la franja crecería hasta tapar los botones del encabezado.
// Con un panel o el menú del "+" abierto, la franja pasa por encima del fondo oscurecido
// con el color ya oscurecido, para que la isla se oscurezca igual (ver BarraEstado.css).
// Es UNA sola franja para toda la app, directamente en <body>, creada la primera vez y nunca
// quitada. Antes cada pantalla montaba la suya: al pasar del menú del "+" a un formulario, la
// franja nueva nacía sin oscurecer mientras el oscurecido todavía se iba y se veía una línea
// clara que parpadeaba bajo la hora (video del iPhone, 2026-10-03). Cada pantalla solo le
// dice su tono; manda la última que se montó.
import { useLayoutEffect } from 'react';
import './BarraEstado.css';

let franja = null;
const tonos = [];

function obtenerFranja() {
  if (!franja) {
    franja = document.createElement('div');
    franja.className = 'barra-estado';
    franja.dataset.tono = 'banner';
    franja.setAttribute('aria-hidden', 'true');
    document.body.append(franja);
  }
  return franja;
}

export default function BarraEstado({ tono = 'banner' }) {
  useLayoutEffect(() => {
    const elemento = obtenerFranja();
    const entrada = { tono };
    tonos.push(entrada);
    elemento.dataset.tono = tono;
    return () => {
      tonos.splice(tonos.indexOf(entrada), 1);
      elemento.dataset.tono = tonos.at(-1)?.tono ?? 'banner';
    };
  }, [tono]);

  return null;
}
