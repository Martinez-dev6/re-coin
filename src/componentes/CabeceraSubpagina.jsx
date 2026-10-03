// Banner de las subpantallas: botón Volver a la izquierda y el título centrado.
import { useNavigate } from 'react-router-dom';
import BarraEstado from './BarraEstado.jsx';
import { IconoVolver } from './iconos.jsx';
import './CabeceraSubpagina.css';

export default function CabeceraSubpagina({ titulo, volverA }) {
  const navegar = useNavigate();

  // Si se llegó desde otra pantalla de la app, volver atrás; si se abrió la dirección
  // directamente (no hay historial propio), ir a la pantalla padre.
  const volver = () => {
    if (window.history.state?.idx > 0) navegar(-1);
    else navegar(volverA, { replace: true });
  };

  return (
    <div className="encabezado-fijo">
      <BarraEstado />
      <header className="banner cabecera-subpagina">
        <div className="cabecera-subpagina-fila">
          <button type="button" className="boton-banner" aria-label="Volver" onClick={volver}>
            <IconoVolver />
          </button>
          <h1 className="cabecera-subpagina-titulo">{titulo}</h1>
        </div>
      </header>
    </div>
  );
}
