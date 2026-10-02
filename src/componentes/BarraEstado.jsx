// Franja fija en el borde superior que le da color a la barra de estado del iPhone.
// Desde iOS/Safari 26 el sistema ignora theme-color: toma el color de un elemento
// position: fixed pegado arriba, de ancho completo, con fondo opaco y al menos ~6 px
// de alto; si no lo encuentra, usa el fondo de la página. Cada pantalla pasa el color
// de lo que tiene arriba (el banner, o el fondo en pantallas sin banner).
import './BarraEstado.css';

export default function BarraEstado({ color }) {
  return <div className="barra-estado" style={{ background: color }} aria-hidden="true" />;
}
