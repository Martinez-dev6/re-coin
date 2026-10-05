// Ventana pequeña de un programado (Sesión 9, pedido del dueño: antes era una pantalla con todo el
// formulario). Sube desde abajo como "¿Ya lo pagaste?" y solo tiene lo que no se cambia desde el
// calendario: cada cuánto se repite, desde cuándo y hasta cuándo, y eliminarlo. El valor, la
// categoría, la cuenta o la observación se cambian editando un movimiento de la serie ("Este y los
// siguientes", EditarMovimiento). Se abre desde "Tus programados" y desde una fecha futura del
// calendario que aún no es movimiento (ocurrencia: esa fecha; al eliminar se ofrece quitar solo esa).
// programado: se queda mientras el panel baja.
import { useEffect, useRef, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { tituloMovimiento } from '../datos/movimientos.js';
import { eliminarFecha, eliminarProgramado, FRECUENCIAS, guardarProgramado } from '../datos/programados.js';
import { diaYMes, fechaCorta } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import BotonExito from './BotonExito.jsx';
import { Campo, EntradaFecha, Interruptor } from './Formulario.jsx';
import { IconoBasura, IconoCalendario, IconoCheck, IconoReloj } from './iconos.jsx';
import PanelInferior, { DURACION_PANEL_MS } from './PanelInferior.jsx';
import './PanelConfirmarPago.css';
import './PanelProgramado.css';

const IconoEmpieza = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoTermina = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;
const CORTOS = { dia: 'Día', semana: 'Semana', quincena: 'Quincena', mes: 'Mes', anio: 'Año' };

const ELIMINAR = [
  { valor: 'solo', titulo: 'Solo el programado', detalle: 'Deja de repetirse. Lo ya registrado se queda en Transacciones.' },
  { valor: 'realizados', titulo: 'El programado y sus realizados', detalle: 'También borra los movimientos que ya se pagaron.' },
  { valor: 'todo', titulo: 'Todo', detalle: 'El programado y todos sus movimientos, pagados y pendientes.' },
];

export default function PanelProgramado({ programado, ocurrencia, abierto, alCerrar }) {
  const { categoria } = useDatos();
  const ultimo = useRef(programado);
  if (programado) ultimo.current = programado;
  const p = ultimo.current;
  const [datos, setDatos] = useState({ frecuencia: 'mes', empieza: '', termina: null });
  const [eliminar, setEliminar] = useState(false);
  const [modo, setModo] = useState('solo');

  // Cada vez que se abre, parte de cómo está guardado.
  useEffect(() => {
    if (!abierto || !p) return;
    setDatos({ frecuencia: p.frecuencia, empieza: p.empieza, termina: p.termina ?? null });
    setModo(ocurrencia ? 'fecha' : 'solo');
    // Solo al abrir.
  }, [abierto]);

  if (!p) return null;
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const opcionesEliminar = [
    ...(ocurrencia
      ? [{ valor: 'fecha', titulo: `Solo el del ${diaYMes(ocurrencia)}`, detalle: 'Esa fecha no se registra. Las demás siguen.' }]
      : []),
    ...ELIMINAR,
  ];

  // Guarda con la plantilla de siempre y lo nuevo (guardarProgramado rehace lo que aún no llega).
  const guardar = () =>
    guardarProgramado(p.id, {
      ...p,
      etiquetaIds: p.etiquetaIds ?? [],
      observacion: p.observacion ?? '',
      frecuencia: datos.frecuencia,
      fecha: datos.empieza,
      termina: datos.termina,
    });

  return (
    <>
      <PanelInferior abierto={abierto && !eliminar} alCerrar={alCerrar} titulo="Programado">
        <div className="confirmar-pago-resumen">
          <span className="confirmar-pago-titulo">{tituloMovimiento(p, categoria)}</span>
          <strong>{formatearPesos(p.valor)}</strong>
        </div>

        <h3 className="confirmar-pago-pregunta">Se repite</h3>
        <div className="programado-frecuencias" role="radiogroup" aria-label="Se repite">
          {FRECUENCIAS.map((f) => (
            <button
              key={f.valor}
              type="button"
              role="radio"
              aria-checked={datos.frecuencia === f.valor}
              aria-label={f.texto}
              className="chip"
              onClick={() => cambiar({ frecuencia: f.valor })}
            >
              <span>{CORTOS[f.valor]}</span>
            </button>
          ))}
        </div>

        <div className="tarjeta campos programado-campos">
          <Campo Icono={IconoEmpieza} etiqueta="Empieza" conFlecha>
            {datos.empieza && <EntradaFecha valor={datos.empieza} alCambiar={(empieza) => cambiar({ empieza })} />}
          </Campo>
          <Campo Icono={IconoTermina} etiqueta="Termina">
            {datos.termina && (
              <EntradaFecha
                valor={datos.termina}
                formato={fechaCorta}
                alCambiar={(termina) => cambiar({ termina: termina < datos.empieza ? datos.empieza : termina })}
              />
            )}
            {!datos.termina && <span className="campo-vacio">Nunca</span>}
            <Interruptor
              activo={Boolean(datos.termina)}
              etiqueta="Termina en una fecha"
              alCambiar={(con) => cambiar({ termina: con ? datos.empieza : null })}
            />
          </Campo>
        </div>
        <p className="rejilla-dias-nota">
          Para cambiar el valor, la categoría o la nota, edita uno de sus movimientos en el calendario y elige «Este y los
          siguientes».
        </p>

        <BotonExito className="boton-principal" alTocar={guardar} alTerminar={alCerrar}>
          Guardar
        </BotonExito>
        <button type="button" className="boton-secundario programado-eliminar" onClick={() => setEliminar(true)}>
          <IconoBasura tamano={18} />
          Eliminar
        </button>
      </PanelInferior>

      <PanelInferior
        abierto={abierto && eliminar}
        alCerrar={() => {
          setEliminar(false);
          alCerrar();
        }}
        titulo="¿Qué quieres eliminar?"
      >
        <div role="radiogroup" aria-label="Qué eliminar" className="eliminar-programado">
          {opcionesEliminar.map((o) => {
            const marcada = o.valor === modo;
            return (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion eliminar-programado-opcion"
                onClick={() => setModo(o.valor)}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{o.titulo}</span>
                  <span className="panel-opcion-detalle">{o.detalle}</span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
        <BotonExito
          className="boton-peligro"
          alTerminar={() => {
            setEliminar(false);
            alCerrar();
            setTimeout(() => {
              if (modo === 'fecha') eliminarFecha(p.id, ocurrencia);
              else eliminarProgramado(p.id, modo);
            }, DURACION_PANEL_MS + 30);
          }}
        >
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </>
  );
}
