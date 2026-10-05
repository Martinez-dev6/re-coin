// Nueva etiqueta (/etiquetas/nueva) y editar etiqueta (/etiquetas/:id). No está en los diseños:
// sigue el estilo de Nueva categoría, solo con el nombre.
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import BotonExito from '../componentes/BotonExito.jsx';
import { CabeceraFormulario, Campo, EntradaTexto, PieFormulario } from '../componentes/Formulario.jsx';
import { IconoBasura, IconoTexto } from '../componentes/iconos.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { eliminarEtiqueta, guardarEtiqueta } from '../datos/etiquetas.js';
import { volver } from '../utilidades/navegacion.js';
import './FormularioMovimiento.css';
import { conNegritas } from '../utilidades/negritas.jsx';

const LISTA = '/mi-espacio/etiquetas';

export default function FormularioEtiqueta() {
  const { id } = useParams();
  const { etiqueta, cargando } = useDatos();
  const editando = id !== 'nueva';
  const existente = editando ? etiqueta(id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar etiqueta" volverA={LISTA} />;
  if (editando && !existente) return <Navigate to={LISTA} replace />;
  return <Campos key={id} etiqueta={existente} />;
}

function Campos({ etiqueta }) {
  const navegar = useNavigate();
  const { movimientos } = useDatos();
  const [nombre, setNombre] = useState(etiqueta?.nombre ?? '');
  const [error, setError] = useState(null);
  const [panelEliminar, setPanelEliminar] = useState(false);
  const eliminando = useRef(false);
  const usos = etiqueta ? movimientos.filter((m) => m.etiquetaIds.includes(etiqueta.id)).length : 0;

  // Al terminar la animación del botón (BotonExito) se vuelve; si falla (nombre repetido), avisa.
  const guardar = () => {
    setError(null);
    return guardarEtiqueta(etiqueta?.id, nombre);
  };

  // Primero baja el panel; después se vuelve a la lista y se borra (ver FormularioCuenta).
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanelEliminar(false);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarEtiqueta(etiqueta.id);
    }, DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraFormulario titulo={etiqueta ? 'Editar etiqueta' : 'Nueva etiqueta'} volverA={LISTA} />

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Nombre">
            <EntradaTexto
              valor={nombre}
              maximo={30}
              ejemplo="Ej. Carro"
              alCambiar={(valor) => {
                setNombre(valor);
                setError(null);
              }}
            />
          </Campo>
        </div>

        {etiqueta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanelEliminar(true)}>
            <IconoBasura />
            Eliminar etiqueta
          </button>
        )}
      </div>

      <PieFormulario>
        {error && (
          <p key={error} className="movimiento-aviso" role="status">
            {conNegritas(error)}
          </p>
        )}
        <BotonExito
          className="boton-principal"
          disabled={!nombre.trim()}
          alTocar={guardar}
          alTerminar={() => volver(navegar, LISTA)}
          alFallar={(e) => setError(e.message)}
        >
          Guardar etiqueta
        </BotonExito>
      </PieFormulario>

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar la etiqueta?">
        <p className="panel-texto">
          Se borra <strong>{etiqueta?.nombre}</strong>.{' '}
          {usos > 0 && `Se quita de ${usos === 1 ? '1 movimiento' : `${usos} movimientos`}, que no se borran. `}
          No se puede deshacer.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
