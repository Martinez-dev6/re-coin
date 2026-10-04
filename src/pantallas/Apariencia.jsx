import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import {
  IconoBanco,
  IconoBilletera,
  IconoCheck,
  IconoCuentas,
  IconoMas,
  IconoPaleta,
  IconoTarjeta,
} from '../componentes/iconos.jsx';
import { cambiarAjustes, useAjustes } from '../estado/ajustes.js';
import { ACENTOS } from '../tema/colores.js';
import { useTema } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import '../componentes/PanelInferior.css';
import './Apariencia.css';

// Color de los íconos de las opciones (Mi espacio, Ajustes…): cada una con su color suave, o
// todas con el color del tema (pedido del dueño, 2026-10-04). Muestra: tres íconos de Mi espacio
// con el tono que llevan allá.
const MUESTRA_ICONOS = [
  { Icono: IconoPaleta, tono: 'c' },
  { Icono: IconoCuentas, tono: 'f' },
  { Icono: IconoTarjeta, tono: 'a' },
];
const COLOR_ICONOS = [
  { valor: 'predeterminado', titulo: 'Predeterminado', detalle: 'Cada opción con su color' },
  { valor: 'tema', titulo: 'Color del tema', detalle: 'Todos con el color principal' },
];
const estiloMuestra = (valor, tono) =>
  valor === 'tema'
    ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' }
    : { background: `var(--cat-${tono}-soft)`, color: `var(--cat-${tono})` };

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
  const { colorIconos } = useAjustes();

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

        <h2 className="titulo-seccion">Color de los íconos</h2>
        <div className="tarjeta apariencia-iconos" role="radiogroup" aria-label="Color de los íconos">
          {COLOR_ICONOS.map(({ valor, titulo, detalle }) => {
            const marcado = (colorIconos === 'tema' ? 'tema' : 'predeterminado') === valor;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion apariencia-iconos-opcion"
                onClick={() => cambiarAjustes({ colorIconos: valor })}
              >
                <span className="apariencia-iconos-muestra" aria-hidden="true">
                  {MUESTRA_ICONOS.map(({ Icono, tono }) => (
                    <span key={tono} className="apariencia-iconos-circulo" style={estiloMuestra(valor, tono)}>
                      <Icono tamano={14} />
                    </span>
                  ))}
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{titulo}</span>
                  <span className="panel-opcion-detalle">{detalle}</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>{marcado && <IconoCheck tamano={14} />}</span>
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
