// Franja fija en el borde superior que le da color a la barra de estado del iPhone.
// Desde iOS/Safari 26 el sistema ignora theme-color: copia el color del elemento fijo
// que encuentra en el centro del borde superior (unos 4 px hacia adentro); si no hay,
// usa el fondo de la página. Esta franja es ese elemento.
// tono: 'banner' (pantallas con banner de color) o 'pagina' (pantallas sin banner).
// Con un panel o el menú del "+" abierto, la franja pasa por encima del fondo oscurecido
// con el color ya oscurecido, para que la isla se oscurezca igual (ver BarraEstado.css).
// Se monta directamente en <body> (portal): si quedara dentro de un encabezado fijo, su
// z-index solo contaría dentro de ese encabezado y el oscurecido le pasaría por encima.
import { createPortal } from 'react-dom';
import './BarraEstado.css';

export default function BarraEstado({ tono = 'banner' }) {
  return createPortal(<div className={'barra-estado ' + tono} aria-hidden="true" />, document.body);
}
