// Reajustar el saldo de una cuenta (/cuentas/:id/reajustar). Pedido del dueño (2026-10-04): cuando
// el saldo real no coincide con el de la app, se escribe el real y la app calcula la diferencia
// (sin tener que salir a una calculadora). Tres formas de registrarla (ver reajustarSaldo en
// cuentas.js): solo corregir el saldo, dejarla como un gasto "Faltante" o un ingreso "Sobrante", o
// como una transferencia con otra de las cuentas (se elige en una ventana al confirmar).
// El botón toma el color de lo elegido (corregir: el del tema; faltante: rojo; sobrante: verde;
// transferencia: azul), con un cambio suave. Los íconos siguen Mi espacio → Apariencia → Color de
// los íconos.
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import { CabeceraFormulario, Campo, MontoEditable, PieFormulario } from '../componentes/Formulario.jsx';
import {
  IconoBalanza,
  IconoCheck,
  IconoGasto,
  IconoIngreso,
  IconoLapiz,
  IconoMoneda,
  IconoTransferencia,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { reajustarSaldo } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { estiloIconoCuenta } from '../tema/colores.js';
import { useAcentoPantalla } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import '../componentes/PanelConfirmarPago.css';
import '../componentes/PanelInferior.css';
import './FormularioMovimiento.css';
import { conNegritas } from '../utilidades/negritas.jsx';

const LISTA = '/mi-espacio/cuentas';
const IconoSaldo = (p) => <IconoMoneda tamano={18} {...p} />;
const IconoDiferencia = (p) => <IconoBalanza tamano={18} {...p} />;

export default function ReajustarSaldo() {
  const { id } = useParams();
  const { cuenta, cargando } = useDatos();
  const c = cuenta(id);
  if (cargando) return <CabeceraFormulario titulo="Reajustar saldo" volverA={LISTA} />;
  if (!c) return <Navigate to={LISTA} replace />;
  return <Campos cuenta={c} />;
}

function Campos({ cuenta: c }) {
  const navegar = useNavigate();
  const { cuentas } = useDatos();
  useAcentoPantalla(c.color);
  // null hasta que se escribe algo (el saldo real también puede ser $ 0).
  const [real, setReal] = useState(null);
  const [modo, setModo] = useState(null); // 'corregir' | 'registrar' | 'transferir'
  const otras = cuentas.filter((o) => o.id !== c.id);
  const [otraId, setOtraId] = useState(otras[0]?.id ?? null);
  // Ventana de la transferencia. Guarda la diferencia al abrirla: al guardar, el saldo de la
  // cuenta cambia y la diferencia pasa a 0 mientras la ventana todavía se ve.
  const [transferencia, setTransferencia] = useState(null); // { monto, sobra }
  const diferencia = real === null ? 0 : real - c.saldo;
  const falta = diferencia < 0;
  const listo = real !== null && diferencia !== 0 && modo && (modo !== 'transferir' || otras.length > 0);

  // Transferir abre la ventana para elegir la otra cuenta (ahí se confirma); lo demás guarda ya y,
  // al terminar la animación del botón (BotonExito), vuelve.
  const guardar = () => {
    if (!listo) return false;
    if (modo === 'transferir') {
      setTransferencia({ monto: Math.abs(diferencia), sobra: !falta });
      return false;
    }
    return reajustarSaldo(c, real, modo);
  };
  const cerrarTransferencia = () => setTransferencia((t) => (t ? { ...t, abierta: false } : t));

  let textoDiferencia = <span className="campo-vacio">Escribe el saldo real</span>;
  if (real !== null && diferencia === 0) textoDiferencia = 'Coincide';
  else if (real !== null) {
    textoDiferencia = (
      <span className={falta ? 'reajuste-falta' : 'reajuste-sobra'}>
        {falta ? 'Faltan' : 'Sobran'} {formatearPesos(Math.abs(diferencia))}
      </span>
    );
  }

  const monto = formatearPesos(Math.abs(diferencia));
  const opciones = [
    {
      valor: 'corregir',
      Icono: IconoLapiz,
      tono: 'c',
      titulo: 'Solo corregir el saldo',
      detalle: 'No crea movimientos: tus ingresos, gastos y transferencias quedan igual.',
    },
    {
      valor: 'registrar',
      Icono: falta ? IconoGasto : IconoIngreso,
      tono: falta ? 'h' : 'f',
      titulo: diferencia > 0 ? 'Registrar como sobrante' : diferencia < 0 ? 'Registrar como faltante' : 'Registrar la diferencia',
      detalle:
        diferencia === 0
          ? 'Crea un gasto (faltante) o un ingreso (sobrante) de hoy por la diferencia.'
          : `Crea ${falta ? 'un gasto «Faltante»' : 'un ingreso «Sobrante»'} de ${monto} con fecha de hoy. Después puedes cambiarle el nombre.`,
    },
    {
      valor: 'transferir',
      Icono: IconoTransferencia,
      tono: 'g',
      titulo: 'Fue una transferencia',
      detalle:
        otras.length === 0
          ? 'Necesitas otra cuenta para registrarla como transferencia.'
          : diferencia === 0
            ? 'La diferencia pasó a otra de tus cuentas o vino de ella: crea una transferencia de hoy.'
            : falta
              ? `Los ${monto} pasaron a otra de tus cuentas: crea una transferencia de hoy hacia la que elijas.`
              : `Los ${monto} vinieron de otra de tus cuentas: crea una transferencia de hoy desde la que elijas.`,
      apagada: otras.length === 0,
    },
  ];

  // Color del botón según lo elegido (FormularioMovimiento.css: guardar-gasto, guardar-ingreso,
  // guardar-azul). Sin elegir o al corregir, el del tema.
  let colorBoton = '';
  if (modo === 'registrar' && diferencia !== 0) colorBoton = falta ? ' guardar-gasto' : ' guardar-ingreso';
  if (modo === 'transferir') colorBoton = ' guardar-azul';

  const otra = cuentas.find((o) => o.id === otraId);
  const desde = transferencia?.sobra ? otra : c;
  const hacia = transferencia?.sobra ? c : otra;

  return (
    <div>
      <CabeceraFormulario titulo="Reajustar saldo" volverA={LISTA}>
        <MontoEditable etiqueta={`Saldo real de ${c.nombre}`} valor={real ?? 0} alCambiar={setReal} />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoSaldo} tono="f" etiqueta="En la app">
            {formatearPesos(c.saldo)}
          </Campo>
          <Campo Icono={IconoDiferencia} tono="d" etiqueta="Diferencia">
            {textoDiferencia}
          </Campo>
        </div>

        <h2 className="titulo-seccion">¿Cómo se registra?</h2>
        <div className="tarjeta reajuste-opciones" role="radiogroup" aria-label="Cómo se registra la diferencia">
          {opciones.map(({ valor, Icono, tono, titulo, detalle, apagada }) => {
            const marcada = modo === valor;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={marcada}
                disabled={apagada}
                className="panel-opcion reajuste-opcion"
                onClick={() => setModo(valor)}
              >
                <span className="icono-circulo" data-tono={tono}>
                  <Icono tamano={16} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{titulo}</span>
                  <span className="panel-opcion-detalle">{conNegritas(detalle)}</span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </div>

      <PieFormulario>
        <BotonExito
          className={'boton-principal reajuste-boton' + colorBoton}
          disabled={!listo}
          alTocar={guardar}
          alTerminar={() => volver(navegar, LISTA)}
        >
          Reajustar saldo
        </BotonExito>
      </PieFormulario>

      {/* Transferencia: de qué cuenta a qué cuenta. La de este reajuste va fija; se elige la otra. */}
      <PanelInferior
        abierto={Boolean(transferencia) && transferencia.abierta !== false}
        alCerrar={cerrarTransferencia}
        titulo={transferencia?.sobra ? '¿De qué cuenta vino?' : '¿A qué cuenta pasó?'}
      >
        <div className="confirmar-pago-resumen">
          <span className="confirmar-pago-titulo">
            {desde?.nombre ?? 'Elegir'} → {hacia?.nombre ?? 'Elegir'}
          </span>
          <strong>{formatearPesos(transferencia?.monto ?? 0)}</strong>
        </div>
        <div className="panel-desplazable confirmar-pago-cuentas" role="radiogroup" aria-label="Otra cuenta">
          {otras.map((o) => {
            const marcada = o.id === otraId;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion confirmar-pago-cuenta"
                onClick={() => setOtraId(o.id)}
              >
                <span className="icono-circulo" style={estiloIconoCuenta(o.color)}>
                  <IconoPorNombre nombre={o.icono} tamano={16} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{o.nombre}</span>
                  <span className={'panel-opcion-detalle ' + (o.saldo < 0 ? 'saldo-negativo' : 'saldo-positivo')}>
                    {formatearPesos(o.saldo)}
                  </span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
        <BotonExito
          className="boton-principal guardar-azul confirmar-pago-boton"
          disabled={!otraId}
          alTocar={() => (otraId ? reajustarSaldo(c, real, 'transferir', otraId) : false)}
          alTerminar={() => {
            cerrarTransferencia();
            // Primero baja la ventana; después se vuelve.
            setTimeout(() => volver(navegar, LISTA), DURACION_PANEL_MS + 30);
          }}
        >
          Transferir {formatearPesos(transferencia?.monto ?? 0)}
        </BotonExito>
      </PanelInferior>
    </div>
  );
}
