// Banner de las subpantallas: botón Volver a la izquierda, el título centrado y, opcional,
// un botón a la derecha (derecha) y contenido debajo (children: saldo, pestañas…).
import { useNavigate } from 'react-router';
import { volver } from '../utilidades/navegacion.js';
import BarraEstado from './BarraEstado.jsx';
import { IconoVolver } from './iconos.jsx';
import './CabeceraSubpagina.css';

export default function CabeceraSubpagina({ titulo, volverA, derecha, children }) {
  const navegar = useNavigate();

  return (
    <div className="encabezado-fijo">
      <BarraEstado />
      <header className="banner cabecera-subpagina">
        <div className="cabecera-subpagina-fila">
          <button type="button" className="boton-banner" aria-label="Volver" onClick={() => volver(navegar, volverA)}>
            <IconoVolver />
          </button>
          <h1 className="cabecera-subpagina-titulo">{titulo}</h1>
          {derecha ?? <span className="cabecera-subpagina-hueco" />}
        </div>
        {children}
      </header>
    </div>
  );
}
