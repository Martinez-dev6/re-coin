// Nueva meta (/metas/nueva) y editar meta (/metas/:id). design/capturas/NuevaMeta.png
// Al editar se ven también sus aportes, y tocar uno permite borrarlo. "Ahorrar" elige si la cifra
// sugerida es al día, a la semana, a la quincena o al mes; el panel muestra las cuatro.
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import {
  CabeceraFormulario,
  Campo,
  EntradaFecha,
  EntradaPesos,
  EntradaTexto,
  MontoEditable,
  PieFormulario,
  RejillaColores,
} from '../componentes/Formulario.jsx';
import {
  IconoBanco,
  IconoBasura,
  IconoCalendario,
  IconoCheck,
  IconoInfo,
  IconoRepetir,
  IconoTexto,
} from '../componentes/iconos.jsx';
import { ICONOS_META, IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import SelectorIcono from '../componentes/SelectorIcono.jsx';
import { COLORES_CATEGORIA } from '../datos/categorias.js';
import { useDatos } from '../datos/DatosContext.jsx';
import {
  ahorroPorPeriodo,
  eliminarAporte,
  eliminarMeta,
  FRECUENCIAS_META,
  frecuenciaMeta,
  guardarMeta,
} from '../datos/metas.js';
import { useAjustes } from '../estado/ajustes.js';
import { estiloIconoCuenta, estiloIconoTono } from '../tema/colores.js';
import { diaYMes, fechaCorta, textoDeFecha } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import { mismosDatos } from '../utilidades/sinCambios.js';
import './FormularioMovimiento.css';

const LISTA = '/planes/metas';

const IconoFechaLimite = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoYaTengo = (p) => <IconoPorNombre nombre="signo-pesos" tamano={18} {...p} />;
const IconoAhorrar = (p) => <IconoRepetir tamano={18} grosor={2} {...p} />;

// Un año desde hoy. Con fechas reales y no sumando 1 al texto: el 29 de febrero daría una fecha que
// no existe al año siguiente (pasa al 1 de marzo).
function enUnAnio() {
  const hoy = new Date();
  return textoDeFecha(new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate()));
}

export default function FormularioMeta() {
  const { id } = useParams();
  const { metas, cargando } = useDatos();
  const editando = id !== 'nueva';
  const existente = editando ? metas.find((m) => m.id === id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar meta" volverA={LISTA} />;
  if (editando && !existente) return <Navigate to={LISTA} replace />;
  return <Campos key={id} meta={existente} />;
}

function Campos({ meta }) {
  const navegar = useNavigate();
  const { cuentas, cuenta } = useDatos();
  const { semanaEmpieza, colorIconos } = useAjustes();
  const [datos, setDatos] = useState(() =>
    meta
      ? {
          nombre: meta.nombre,
          objetivo: meta.objetivo,
          fechaLimite: meta.fechaLimite,
          frecuencia: frecuenciaMeta(meta.frecuencia).valor,
          ahorradoInicial: meta.ahorradoInicial ?? 0,
          cuentaId: meta.cuentaId,
          icono: meta.icono,
          color: meta.color ?? null,
        }
      : {
          nombre: '',
          objetivo: 0,
          fechaLimite: enUnAnio(),
          frecuencia: 'mes',
          ahorradoInicial: 0,
          cuentaId: cuentas[0]?.id ?? null,
          icono: 'alcancia',
          color: 'f',
        },
  );
  const [inicial] = useState(datos);
  const [panel, setPanel] = useState(null); // 'cuenta' | 'frecuencia' | 'eliminar' | 'aporte'
  // El aporte que se va a borrar; se queda mientras el panel baja.
  const [aporte, setAporte] = useState(null);
  const [aviso, setAviso] = useState(null);
  const eliminando = useRef(false);
  const monto = useRef(null);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));

  // Con lo ahorrado de verdad (también los aportes), no solo con "Ya tengo".
  const ahorrado = (meta?.ahorrado ?? 0) - (meta?.ahorradoInicial ?? 0) + datos.ahorradoInicial;
  const ahorroCada = (frecuencia) => ahorroPorPeriodo(datos.objetivo, ahorrado, datos.fechaLimite, frecuencia, semanaEmpieza);
  const frecuencia = frecuenciaMeta(datos.frecuencia);
  const sugerido = ahorroCada(frecuencia.valor);

  // Si falta algo, avisa y devuelve false (el botón no anima). Al terminar la animación del botón
  // (BotonExito) se vuelve.
  const guardar = () => {
    if (!(datos.objetivo > 0)) {
      setAviso('Escribe el monto objetivo.');
      monto.current?.focus();
      return false;
    }
    if (!datos.nombre.trim()) {
      setAviso('Escribe el nombre de la meta.');
      return false;
    }
    setAviso(null);
    return guardarMeta(meta?.id, datos);
  };

  // Primero baja el panel; después se vuelve y se borra.
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanel(null);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarMeta(meta.id);
    }, DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraFormulario titulo={meta ? 'Editar meta' : 'Nueva meta'} volverA={LISTA}>
        <MontoEditable
          ref={monto}
          etiqueta="Monto objetivo"
          valor={datos.objetivo}
          alCambiar={(objetivo) => cambiar({ objetivo })}
        />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} tono="g" etiqueta="Nombre">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Laptop nueva" />
          </Campo>
          <Campo Icono={IconoFechaLimite} tono="b" etiqueta="Fecha límite" conFlecha>
            <EntradaFecha valor={datos.fechaLimite} alCambiar={(fechaLimite) => cambiar({ fechaLimite })} formato={fechaCorta} />
          </Campo>
          <Campo Icono={IconoAhorrar} tono="c" etiqueta="Ahorrar" alTocar={() => setPanel('frecuencia')}>
            {frecuencia.texto}
          </Campo>
          <Campo Icono={IconoYaTengo} tono="f" etiqueta="Ya tengo">
            <EntradaPesos
              valor={datos.ahorradoInicial}
              etiqueta="Ya tengo"
              alCambiar={(ahorradoInicial) => cambiar({ ahorradoInicial })}
            />
          </Campo>
          <Campo Icono={IconoBanco} tono="c" etiqueta="Se guarda en" alTocar={() => setPanel('cuenta')}>
            {cuenta(datos.cuentaId)?.nombre ?? <span className="campo-vacio">Elegir</span>}
          </Campo>
        </div>
        {datos.objetivo > 0 && (
          <p className="formulario-nota">
            <IconoInfo />
            <span>
              {sugerido > 0
                ? `Para llegar a tiempo tendrías que ahorrar ${formatearPesos(sugerido)} ${frecuencia.cada}.`
                : 'Ya tienes lo de esta meta.'}
            </span>
          </p>
        )}

        <h2 className="titulo-seccion">Ícono</h2>
        {/* Primero el ícono y después el color (pedido del dueño); el ícono va del color elegido abajo. Una meta de antes sin color: verde con el color de los íconos Variado,
            si no el del tema, como en Planes. */}
        <SelectorIcono
          sugeridos={ICONOS_META}
          elegido={datos.icono}
          estilo={datos.color ? estiloIconoTono(datos.color) : colorIconos === 'tema' ? undefined : estiloIconoTono('f')}
          alElegir={(icono) => cambiar({ icono })}
        />

        <h2 className="titulo-seccion">Color</h2>
        <RejillaColores colores={COLORES_CATEGORIA} elegido={datos.color} alElegir={(color) => cambiar({ color })} />

        {meta?.aportes.length > 0 && (
          <>
            <h2 className="titulo-seccion">Aportes</h2>
            <div className="tarjeta campos">
              {meta.aportes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="campo"
                  onClick={() => {
                    setAporte(a);
                    setPanel('aporte');
                  }}
                >
                  <span className="campo-etiqueta">{diaYMes(a.fecha)}</span>
                  <span className="campo-valor saldo-positivo">+ {formatearPesos(a.valor)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {meta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar meta
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
          disabled={Boolean(meta) && mismosDatos(datos, inicial)}
          alTocar={guardar}
          alTerminar={() => volver(navegar, LISTA)}
          alFallar={(e) => setAviso(e.message)}
        >
          {meta ? 'Guardar' : 'Guardar meta'}
        </BotonExito>
      </PieFormulario>

      <PanelInferior
        abierto={panel === 'cuenta'}
        alCerrar={() => setPanel(null)}
        titulo="Se guarda en"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div className="panel-desplazable" role="radiogroup" aria-label="Cuenta donde se guarda">
          {cuentas.map((c) => {
            const marcada = c.id === datos.cuentaId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion"
                onClick={() => cambiar({ cuentaId: c.id })}
              >
                <span className="icono-circulo grande" style={estiloIconoCuenta(c.color)}>
                  <IconoPorNombre nombre={c.icono} tamano={20} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{c.nombre}</span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'frecuencia'}
        alCerrar={() => setPanel(null)}
        titulo="Ahorrar"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div role="radiogroup" aria-label="Cada cuánto ahorrar">
          {FRECUENCIAS_META.map((f) => {
            const marcada = f.valor === frecuencia.valor;
            const cifra = ahorroCada(f.valor);
            return (
              <button
                key={f.valor}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion panel-lista-opcion"
                onClick={() => cambiar({ frecuencia: f.valor })}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{f.texto}</span>
                  {datos.objetivo > 0 && cifra > 0 && (
                    <span className="panel-opcion-detalle">
                      {formatearPesos(cifra)} {f.cada}
                    </span>
                  )}
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'eliminar'} alCerrar={() => setPanel(null)} titulo="¿Eliminar la meta?">
        <p className="panel-texto">
          Se borra <strong>{meta?.nombre}</strong> con sus aportes. Tus cuentas no cambian. No se puede deshacer.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
          Cancelar
        </button>
      </PanelInferior>

      <PanelInferior abierto={panel === 'aporte'} alCerrar={() => setPanel(null)} titulo="¿Borrar este aporte?">
        <p className="panel-texto">
          Se quita el aporte de {aporte && formatearPesos(aporte.valor)} del {aporte && diaYMes(aporte.fecha)}. Tus
          cuentas no cambian.
        </p>
        <BotonExito className="boton-peligro" alTocar={() => eliminarAporte(aporte.id)} alTerminar={() => setPanel(null)}>
          Borrar aporte
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
