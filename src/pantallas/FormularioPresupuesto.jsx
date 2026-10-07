// Nuevo presupuesto (/presupuestos/nuevo) y editar presupuesto (/presupuestos/:id).
// design/capturas/NuevoPresupuesto.png. Periodo semanal, quincenal, mensual o anual (Sesión 9, pedido
// del dueño; antes solo mensual). "Empieza" es un mes, con el mismo panel y la misma animación al
// cambiar de año que "Elegir mes" de Inicio.
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import BotonExito from '../componentes/BotonExito.jsx';
import { CabeceraFormulario, Campo, Interruptor, MontoEditable, PieFormulario } from '../componentes/Formulario.jsx';
import {
  IconoAnterior,
  IconoBasura,
  IconoCalendario,
  IconoCampana,
  IconoCategorias,
  IconoCheck,
  IconoInfo,
  IconoMas,
  IconoRepetir,
  IconoReloj,
  IconoSiguiente,
} from '../componentes/iconos.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import { eliminarPresupuesto, guardarPresupuesto, PERIODOS, periodoDe, textoMes } from '../datos/presupuestos.js';
import { useMes } from '../estado/MesContext.jsx';
import { MESES, nombreMes } from '../utilidades/fechas.js';
import { volver } from '../utilidades/navegacion.js';
import { mismosDatos } from '../utilidades/sinCambios.js';
import './FormularioMovimiento.css';
import '../componentes/SelectorMes.css';

const LISTA = '/planes/presupuestos';
const AVISOS = [50, 60, 70, 80, 90, 100];
const CORTOS = MESES.map((m) => m.charAt(0).toUpperCase() + m.slice(1, 3));

const IconoPeriodo = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoEmpieza = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;
const IconoRepetirFila = (p) => <IconoRepetir tamano={18} grosor={2} {...p} />;

const textoDesde = (desde) => `${nombreMes(Number(desde.slice(5)) - 1)} ${desde.slice(0, 4)}`;

export default function FormularioPresupuesto() {
  const { id } = useParams();
  const { presupuestos, cargando } = useDatos();
  const editando = id !== 'nuevo';
  const existente = editando ? presupuestos.find((p) => p.id === id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar presupuesto" volverA={LISTA} />;
  if (editando && !existente) return <Navigate to={LISTA} replace />;
  return <Campos key={id} presupuesto={existente} />;
}

function Campos({ presupuesto }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { categorias, categoria: buscarCategoria } = useDatos();
  const [datos, setDatos] = useState(
    () =>
      presupuesto ?? { categoriaId: null, limite: 0, periodo: 'mes', desde: textoMes(anio, mes), repetir: true, avisarAl: 80 },
  );
  const [inicial] = useState(datos);
  const [panel, setPanel] = useState(null); // 'categoria' | 'periodo' | 'desde' | 'aviso' | 'eliminar'
  const periodo = periodoDe(datos);
  const [anioVista, setAnioVista] = useState(Number(datos.desde.slice(0, 4)));
  const [aviso, setAviso] = useState(null);
  const eliminando = useRef(false);
  const monto = useRef(null);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const categoria = buscarCategoria(datos.categoriaId);

  // Si falta algo, avisa y devuelve false (el botón no anima). Al terminar la animación del botón
  // (BotonExito) se vuelve; si falla (otro presupuesto de la misma categoría), avisa.
  const guardar = () => {
    if (!(datos.limite > 0)) {
      setAviso('Escribe el límite.');
      monto.current?.focus();
      return false;
    }
    if (!datos.categoriaId) {
      setAviso('Elige una categoría.');
      setPanel('categoria');
      return false;
    }
    setAviso(null);
    return guardarPresupuesto(presupuesto?.id, datos, categoria?.nombre);
  };

  // Primero baja el panel; después se vuelve y se borra.
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanel(null);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarPresupuesto(presupuesto.id);
    }, DURACION_PANEL_MS + 30);
  };

  // Cierra el panel y, cuando terminó de bajar, va a crear la categoría.
  const crearCategoria = () => {
    setPanel(null);
    setTimeout(() => navegar('/categorias/nueva?tipo=gasto'), DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraFormulario titulo={presupuesto ? 'Editar presupuesto' : 'Nuevo presupuesto'} volverA={LISTA}>
        <MontoEditable ref={monto} etiqueta="Límite" valor={datos.limite} alCambiar={(limite) => cambiar({ limite })} />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoCategorias} etiqueta="Categoría" alTocar={() => setPanel('categoria')}>
            {categoria ? (
              <>
                <CirculoCategoria icono={categoria.icono} color={categoria.color} talla="chico" />
                <span className="campo-recortado">{categoria.nombre}</span>
              </>
            ) : (
              <span className="campo-vacio">Elegir</span>
            )}
          </Campo>
          <Campo Icono={IconoPeriodo} etiqueta="Periodo" alTocar={() => setPanel('periodo')}>
            {periodo.texto}
          </Campo>
          <Campo Icono={IconoEmpieza} etiqueta="Empieza" alTocar={() => setPanel('desde')}>
            {textoDesde(datos.desde)}
          </Campo>
          <Campo Icono={IconoRepetirFila} etiqueta={`Repetir ${periodo.cada}`}>
            <Interruptor
              activo={datos.repetir}
              etiqueta={`Repetir ${periodo.cada}`}
              alCambiar={(repetir) => cambiar({ repetir })}
            />
          </Campo>
          <Campo Icono={IconoCampana} etiqueta="Avisarme al" alTocar={() => setPanel('aviso')}>
            {datos.avisarAl} %
          </Campo>
        </div>
        <p className="formulario-nota">
          <IconoInfo />
          <span>
            Te avisamos en Inicio y en Planes cuando llegues al {datos.avisarAl} % y cuando te pases del límite
            {periodo.valor === 'mes' ? '' : ` de ${periodo.actual}`}.
          </span>
        </p>

        {presupuesto && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar presupuesto
          </button>
        )}
      </div>

      <PieFormulario>
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <BotonExito
          className="boton-principal"
          disabled={Boolean(presupuesto) && mismosDatos(datos, inicial)}
          alTocar={guardar}
          alTerminar={() => volver(navegar, LISTA)}
          alFallar={(e) => setAviso(e.message)}
        >
          Guardar presupuesto
        </BotonExito>
      </PieFormulario>

      <PanelInferior
        abierto={panel === 'categoria'}
        alCerrar={() => setPanel(null)}
        titulo="Categoría"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div className="panel-desplazable">
          <div className="rejilla-categorias" role="radiogroup" aria-label="Categoría">
            {categorias
              .filter((c) => c.tipo === 'gasto')
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === datos.categoriaId}
                  className="rejilla-categorias-opcion"
                  onClick={() => {
                    cambiar({ categoriaId: c.id });
                    setAviso(null);
                  }}
                >
                  <CirculoCategoria icono={c.icono} color={c.color} talla="grande" />
                  <span>{c.nombre}</span>
                </button>
              ))}
            <button type="button" className="rejilla-categorias-opcion nueva" onClick={crearCategoria}>
              <span className="rejilla-categorias-nueva">
                <IconoMas />
              </span>
              <span>Nueva</span>
            </button>
          </div>
        </div>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'desde'}
        alCerrar={() => setPanel(null)}
        titulo="Empieza"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div className="elegir-mes-anio">
          <button type="button" className="mes-flecha" aria-label="Año anterior" onClick={() => setAnioVista((a) => a - 1)}>
            <IconoAnterior />
          </button>
          {/* Al cambiar de año, el año y los meses entran desde ese lado, como en "Elegir mes". */}
          <Deslizar as="span" posicion={anioVista} distancia={16} aria-live="polite">
            {anioVista}
          </Deslizar>
          <button type="button" className="mes-flecha" aria-label="Año siguiente" onClick={() => setAnioVista((a) => a + 1)}>
            <IconoSiguiente />
          </button>
        </div>
        <Deslizar posicion={anioVista} className="elegir-mes-rejilla">
          {CORTOS.map((corto, indice) => {
            const valor = textoMes(anioVista, indice);
            const elegido = valor === datos.desde;
            return (
              <button
                key={corto}
                type="button"
                aria-pressed={elegido}
                aria-label={`${nombreMes(indice)} ${anioVista}`}
                className={'elegir-mes-boton' + (elegido ? ' elegido' : '')}
                onClick={() => cambiar({ desde: valor })}
              >
                {corto}
              </button>
            );
          })}
        </Deslizar>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'periodo'}
        alCerrar={() => setPanel(null)}
        titulo="Periodo"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div role="radiogroup" aria-label="Periodo">
          {PERIODOS.map((p) => {
            const marcado = p.valor === periodo.valor;
            return (
              <button
                key={p.valor}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion panel-lista-opcion"
                onClick={() => cambiar({ periodo: p.valor })}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{p.texto}</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>{marcado && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
        <p className="rejilla-dias-nota">
          {periodo.valor === 'semana' && 'Cuenta lo gastado de cada semana, desde el día que elegiste en Ajustes.'}
          {periodo.valor === 'quincena' && 'Cuenta lo gastado del 1 al 15 y del 16 al final de cada mes.'}
          {periodo.valor === 'mes' && 'Cuenta lo gastado en cada mes.'}
          {periodo.valor === 'anio' && 'Cuenta lo gastado en 12 meses seguidos, desde el mes en que empieza.'}
        </p>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'aviso'}
        alCerrar={() => setPanel(null)}
        titulo="Avisarme al"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div role="radiogroup" aria-label="Avisarme al">
          {AVISOS.map((porcentaje) => {
            const marcado = porcentaje === datos.avisarAl;
            return (
              <button
                key={porcentaje}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion panel-lista-opcion"
                onClick={() => cambiar({ avisarAl: porcentaje })}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{porcentaje} %</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>{marcado && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'eliminar'} alCerrar={() => setPanel(null)} titulo="¿Eliminar el presupuesto?">
        <p className="panel-texto">
          Se borra el presupuesto de {categoria?.nombre ?? 'esta categoría'}. Tus gastos no cambian.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
