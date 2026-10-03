import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoBanco, IconoBilletera, IconoCheck, IconoMas } from '../componentes/iconos.jsx';
import { ACENTOS } from '../tema/colores.js';
import { useTema } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import './Apariencia.css';

// Valores de muestra solo para la vista previa (no son datos reales).
const MUESTRA = {
  saldo: 1284300,
  cuentas: [
    { nombre: 'Cuenta bancaria', saldo: 912400, Icono: IconoBanco },
    { nombre: 'Billetera digital', saldo: 358900, Icono: IconoBilletera },
  ],
};

export default function Apariencia() {
  const { acento, cambiarAcento, restablecerAcento } = useTema();

  return (
    <div>
      <CabeceraSubpagina titulo="Apariencia" volverA="/mi-espacio" />

      <div className="contenido">
        <h2 className="titulo-seccion">Color principal</h2>
        <div className="tarjeta apariencia-colores" role="radiogroup" aria-label="Color principal">
          {ACENTOS.map(({ valor, nombre }) => {
            const elegido = valor === acento;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={elegido}
                aria-label={nombre}
                className={'apariencia-color' + (elegido ? ' elegido' : '')}
                style={{ background: valor }}
                onClick={() => cambiarAcento(valor)}
              >
                {elegido && <IconoCheck />}
              </button>
            );
          })}
        </div>

        <h2 className="titulo-seccion">Vista previa</h2>
        <div className="tarjeta apariencia-vista" aria-hidden="true">
          <div className="apariencia-vista-banner">
            <div className="apariencia-vista-etiqueta">Saldo actual en cuentas</div>
            <div className="apariencia-vista-saldo">{formatearPesos(MUESTRA.saldo)}</div>
          </div>
          <div className="apariencia-vista-controles">
            <span className="apariencia-chip activo">Activo</span>
            <span className="apariencia-chip">Inactivo</span>
            <span className="apariencia-progreso">
              <span />
            </span>
          </div>
          <div className="apariencia-vista-separador" />
          {MUESTRA.cuentas.map(({ nombre, saldo, Icono }) => (
            <div key={nombre} className="apariencia-cuenta">
              <span className="icono-circulo grande">
                <Icono />
              </span>
              <span className="apariencia-cuenta-textos">
                <span className="apariencia-cuenta-nombre">{nombre}</span>
                <span className="apariencia-cuenta-saldo">{formatearPesos(saldo)}</span>
              </span>
              <span className="apariencia-cuenta-mas">
                <IconoMas />
              </span>
            </div>
          ))}
        </div>

        <button type="button" className="boton-texto apariencia-restablecer" onClick={restablecerAcento}>
          Restablecer
        </button>
      </div>
    </div>
  );
}
