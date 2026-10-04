// Ajustes (design/html/Ajustes.html). Moneda e idioma tienen una sola opción por ahora (peso
// colombiano y español): se muestran sin flecha porque no hay nada que elegir.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BotonExito from '../componentes/BotonExito.jsx';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import {
  IconoBasura,
  IconoCheck,
  IconoFlecha,
  IconoIdioma,
  IconoMoneda,
  IconoOjo,
  IconoSemana,
} from '../componentes/iconos.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { borrarTodo } from '../datos/db.js';
import { cambiarAjustes, useAjustes } from '../estado/ajustes.js';
import { useSaldosOcultos } from '../estado/useSaldosOcultos.js';
import '../componentes/Formulario.css';
import './Ajustes.css';

const DIAS = [
  { valor: 'lunes', texto: 'Lunes' },
  { valor: 'domingo', texto: 'Domingo' },
];

// tono: color del ícono en "Predeterminado" (ver comunes.css).
function Fila({ Icono, tono, etiqueta, children, onClick }) {
  const Elemento = onClick ? 'button' : 'div';
  return (
    <Elemento {...(onClick && { type: 'button', onClick })} className="ajustes-fila">
      <span className="icono-circulo ajustes-icono" data-tono={tono}>
        <Icono />
      </span>
      <span className="ajustes-etiqueta">{etiqueta}</span>
      <span className="ajustes-valor">{children}</span>
      {onClick && (
        <span className="ajustes-flecha">
          <IconoFlecha />
        </span>
      )}
    </Elemento>
  );
}

export default function Ajustes() {
  const navegar = useNavigate();
  const { semanaEmpieza } = useAjustes();
  const [ocultos, alternarOcultos] = useSaldosOcultos();
  const [panelSemana, setPanelSemana] = useState(false);
  const [panelBorrar, setPanelBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState('');

  // Borra mientras el botón anima (BotonExito); al terminar baja el panel y se va a Inicio.
  const borrar = () => {
    setError(null);
    setBorrando(true);
    return borrarTodo();
  };
  const alBorrar = () => {
    setPanelBorrar(false);
    // Que el panel baje antes de cambiar de pantalla.
    setTimeout(() => navegar('/', { replace: true }), DURACION_PANEL_MS);
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Ajustes" volverA="/mi-espacio" />

      <div className="contenido ajustes-contenido">
        <div className="tarjeta ajustes-tarjeta">
          <Fila Icono={IconoMoneda} tono="f" etiqueta="Moneda">
            Peso colombiano ($)
          </Fila>
          <Fila Icono={IconoIdioma} tono="g" etiqueta="Idioma">
            Español
          </Fila>
          <Fila Icono={IconoSemana} tono="b" etiqueta="Semana empieza" onClick={() => setPanelSemana(true)}>
            {DIAS.find((d) => d.valor === semanaEmpieza)?.texto}
          </Fila>
          <div className="ajustes-fila">
            <span className="icono-circulo ajustes-icono" data-tono="c">
              <IconoOjo tamano={18} />
            </span>
            <span className="ajustes-etiqueta" id="ajustes-ocultar">
              Ocultar saldos
            </span>
            <span className="ajustes-valor" />
            <button
              type="button"
              role="switch"
              aria-checked={ocultos}
              aria-labelledby="ajustes-ocultar"
              className={'interruptor' + (ocultos ? ' activo' : '')}
              onClick={alternarOcultos}
            >
              <span />
            </button>
          </div>
        </div>

        <h2 className="titulo-seccion">Datos</h2>
        <div className="tarjeta ajustes-tarjeta">
          <button type="button" className="ajustes-fila ajustes-fila-alta" onClick={() => setPanelBorrar(true)}>
            <span className="icono-circulo grande ajustes-icono-peligro">
              <IconoBasura tamano={20} />
            </span>
            <span className="ajustes-textos">
              <span className="ajustes-titulo-peligro">Borrar todos los datos</span>
              <span className="ajustes-detalle">No se puede deshacer</span>
            </span>
            <span className="ajustes-flecha">
              <IconoFlecha />
            </span>
          </button>
        </div>
      </div>

      {/* Queda abierto al elegir, como los demás paneles de elección. */}
      <PanelInferior
        abierto={panelSemana}
        alCerrar={() => setPanelSemana(false)}
        titulo="La semana empieza el"
        accion={{ texto: 'Listo', alTocar: () => setPanelSemana(false) }}
      >
        <div role="radiogroup" aria-label="La semana empieza el">
          {DIAS.map(({ valor, texto }) => {
            const marcado = valor === semanaEmpieza;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion"
                onClick={() => cambiarAjustes({ semanaEmpieza: valor })}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{texto}</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>{marcado && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
        <p className="panel-texto ajustes-panel-nota">Se usa en el calendario de Programados.</p>
      </PanelInferior>

      <PanelInferior abierto={panelBorrar} alCerrar={() => !borrando && setPanelBorrar(false)} titulo="¿Borrar todos los datos?">
        <p className="panel-texto">
          Se borran tus cuentas, tarjetas, movimientos, presupuestos, metas, programados y etiquetas. Las categorías vuelven
          a las de siempre. Tu nombre, tu foto y los colores se conservan. Si quieres poder recuperar algo, haz antes una
          copia de seguridad.
        </p>
        {error && <p className="panel-texto ajustes-error">{error}</p>}
        <BotonExito
          className="boton-peligro"
          alTocar={borrar}
          alTerminar={alBorrar}
          alFallar={() => {
            setError('No se pudo borrar. No se cambió nada.');
            setBorrando(false);
          }}
        >
          Borrar todo
        </BotonExito>
        <button
          type="button"
          className="boton-secundario"
          disabled={borrando}
          onClick={() => {
            setPanelBorrar(false);
            setTimeout(() => navegar('/mi-espacio/importar-exportar'), DURACION_PANEL_MS);
          }}
        >
          Hacer una copia antes
        </button>
      </PanelInferior>
    </div>
  );
}
