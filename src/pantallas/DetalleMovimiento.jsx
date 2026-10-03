// Detalle de un movimiento (/movimientos/:id). design/capturas/DetalleMovimiento.png
// Sin barra inferior: entra desde la derecha por encima de ella (TransicionPantallas.jsx).
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import { Campo, PieFormulario } from '../componentes/Formulario.jsx';
import {
  IconoBasura,
  IconoCalendario,
  IconoCategorias,
  IconoCheckCirculo,
  IconoCuentas,
  IconoEtiqueta,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoLapiz,
  IconoNota,
  IconoReloj,
} from '../componentes/iconos.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { cambiarPagado, eliminarMovimiento, tituloMovimiento } from '../datos/movimientos.js';
import { etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import './DetalleMovimiento.css';
import './FormularioMovimiento.css';

const LISTA = '/transacciones';
const SIGNO = { gasto: '- ', ingreso: '+ ', transferencia: '' };

const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;

export default function DetalleMovimiento() {
  const { id } = useParams();
  const { movimientos, cargando } = useDatos();
  const movimiento = movimientos.find((m) => m.id === id);
  // Después de eliminarlo, mientras la pantalla se va, se sigue viendo como estaba.
  const ultimo = useRef(movimiento);
  if (movimiento) ultimo.current = movimiento;

  if (cargando) return <CabeceraSubpagina titulo="Detalle" volverA={LISTA} />;
  if (!ultimo.current) return <Navigate to={LISTA} replace />;
  return <Contenido movimiento={ultimo.current} />;
}

function Contenido({ movimiento: m }) {
  const navegar = useNavigate();
  const { cuenta, categoria: buscarCategoria, etiqueta } = useDatos();
  const [panelEliminar, setPanelEliminar] = useState(false);
  const eliminando = useRef(false);
  const transferencia = m.tipo === 'transferencia';
  const categoria = buscarCategoria(m.categoriaId);
  const nombreCuenta = (id) => cuenta(id)?.nombre ?? 'Cuenta eliminada';
  const anio = Number(m.fecha.slice(0, 4));
  const fecha = etiquetaDia(m.fecha) + (anio !== new Date().getFullYear() ? ` de ${anio}` : '');
  const etiquetas = m.etiquetaIds.map((e) => etiqueta(e)?.nombre).filter(Boolean);

  // Primero baja el panel; después se vuelve y se borra (como al eliminar una cuenta).
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanelEliminar(false);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarMovimiento(m.id);
    }, DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Detalle" volverA={LISTA}>
        <div className="cabecera-cifra detalle-cifra">
          <div className="cabecera-cifra-etiqueta">{tituloMovimiento(m, buscarCategoria)}</div>
          <div className="cabecera-cifra-valor">
            {SIGNO[m.tipo]}
            {formatearPesos(m.valor)}
          </div>
          {/* Tocar el estado lo cambia: así se marca como pagado lo que estaba pendiente. */}
          {!transferencia && (
            <button
              type="button"
              className="detalle-estado"
              aria-label={(m.pagado ? 'Pagado' : 'Pendiente') + '. Tocar para cambiar'}
              onClick={() => cambiarPagado(m.id, !m.pagado)}
            >
              {m.pagado ? <IconoCheckCirculo tamano={14} grosor={2.2} /> : <IconoReloj tamano={14} grosor={2.2} />}
              {m.pagado ? (m.tipo === 'ingreso' ? 'Recibido' : 'Pagado') : 'Pendiente'}
            </button>
          )}
        </div>
      </CabeceraSubpagina>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          {transferencia ? (
            <>
              <Campo Icono={IconoDesde} etiqueta="Desde">
                {nombreCuenta(m.cuentaId)}
              </Campo>
              <Campo Icono={IconoHacia} etiqueta="Hacia">
                {nombreCuenta(m.cuentaDestinoId)}
              </Campo>
            </>
          ) : (
            <>
              <Campo Icono={IconoCategorias} etiqueta="Categoría">
                {categoria ? (
                  <>
                    <CirculoCategoria icono={categoria.icono} color={categoria.color} talla="chico" />
                    <span className="campo-recortado">{categoria.nombre}</span>
                  </>
                ) : (
                  <span className="campo-vacio">Sin categoría</span>
                )}
              </Campo>
              <Campo Icono={IconoCuentas} etiqueta="Cuenta">
                {nombreCuenta(m.cuentaId)}
              </Campo>
            </>
          )}
          <Campo Icono={IconoFecha} etiqueta="Fecha">
            {fecha}
          </Campo>
          {etiquetas.length > 0 && (
            <Campo Icono={IconoEtiqueta} etiqueta="Etiquetas">
              <span className="campo-recortado">{etiquetas.join(', ')}</span>
            </Campo>
          )}
        </div>

        {m.observacion && (
          <>
            <h2 className="titulo-seccion detalle-titulo-nota">
              <IconoNota tamano={14} />
              Observación
            </h2>
            <p className="tarjeta detalle-nota">{m.observacion}</p>
          </>
        )}
      </div>

      <PieFormulario>
        <div className="detalle-botones">
          <button type="button" className="detalle-eliminar" onClick={() => setPanelEliminar(true)}>
            <IconoBasura />
            Eliminar
          </button>
          <button type="button" className="boton-principal" onClick={() => navegar(`/movimientos/${m.id}/editar`)}>
            <IconoLapiz tamano={18} />
            Editar
          </button>
        </div>
      </PieFormulario>

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar el movimiento?">
        <p className="panel-texto">
          Se borra «{tituloMovimiento(m, buscarCategoria)}» de {formatearPesos(m.valor)}. No se puede deshacer.
        </p>
        <button type="button" className="boton-peligro" onClick={eliminar}>
          Eliminar
        </button>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
