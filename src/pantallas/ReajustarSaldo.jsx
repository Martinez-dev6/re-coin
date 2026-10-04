// Reajustar el saldo de una cuenta (/cuentas/:id/reajustar). Pedido del dueño (2026-10-04): cuando
// el saldo real no coincide con el de la app, se escribe el real y la app calcula la diferencia
// (sin tener que salir a una calculadora). Dos formas de registrarla (ver reajustarSaldo en
// cuentas.js): solo corregir el saldo, o dejarla como un gasto "Faltante" o un ingreso "Sobrante".
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import BotonExito from '../componentes/BotonExito.jsx';
import { CabeceraFormulario, Campo, MontoEditable, PieFormulario } from '../componentes/Formulario.jsx';
import { IconoBalanza, IconoCheck, IconoMoneda } from '../componentes/iconos.jsx';
import { reajustarSaldo } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { useAcentoPantalla } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import '../componentes/PanelInferior.css';
import './FormularioMovimiento.css';

const IconoSaldo = (p) => <IconoMoneda tamano={18} {...p} />;

export default function ReajustarSaldo() {
  const { id } = useParams();
  const { cuenta, cargando } = useDatos();
  const c = cuenta(id);
  if (cargando) return <CabeceraFormulario titulo="Reajustar saldo" volverA={`/cuentas/${id}`} />;
  if (!c) return <Navigate to="/mi-espacio/cuentas" replace />;
  return <Campos cuenta={c} />;
}

function Campos({ cuenta: c }) {
  const navegar = useNavigate();
  useAcentoPantalla(c.color);
  // null hasta que se escribe algo (el saldo real también puede ser $ 0).
  const [real, setReal] = useState(null);
  const [modo, setModo] = useState(null); // 'corregir' | 'registrar'
  const diferencia = real === null ? 0 : real - c.saldo;
  const falta = diferencia < 0;
  const listo = real !== null && diferencia !== 0 && modo;

  // Al terminar la animación del botón (BotonExito) se vuelve a la cuenta.
  const guardar = () => (listo ? reajustarSaldo(c, real, modo) : false);

  let textoDiferencia = <span className="campo-vacio">Escribe el saldo real</span>;
  if (real !== null && diferencia === 0) textoDiferencia = 'Coincide';
  else if (real !== null) {
    textoDiferencia = (
      <span className={falta ? 'reajuste-falta' : 'reajuste-sobra'}>
        {falta ? 'Faltan' : 'Sobran'} {formatearPesos(Math.abs(diferencia))}
      </span>
    );
  }

  const opciones = [
    {
      valor: 'corregir',
      titulo: 'Solo corregir el saldo',
      detalle: 'No crea movimientos: tus ingresos, gastos y transferencias quedan igual.',
    },
    {
      valor: 'registrar',
      titulo: diferencia > 0 ? 'Registrar como sobrante' : diferencia < 0 ? 'Registrar como faltante' : 'Registrar la diferencia',
      detalle:
        diferencia === 0
          ? 'Crea un gasto (faltante) o un ingreso (sobrante) de hoy por la diferencia.'
          : `Crea ${falta ? 'un gasto «Faltante»' : 'un ingreso «Sobrante»'} de ${formatearPesos(Math.abs(diferencia))} con fecha de hoy. Después puedes cambiarle el nombre.`,
    },
  ];

  return (
    <div>
      <CabeceraFormulario titulo="Reajustar saldo" volverA={`/cuentas/${c.id}`}>
        <MontoEditable etiqueta={`Saldo real de ${c.nombre}`} valor={real ?? 0} alCambiar={setReal} />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoSaldo} etiqueta="En la app">
            {formatearPesos(c.saldo)}
          </Campo>
          <Campo Icono={IconoBalanza} etiqueta="Diferencia">
            {textoDiferencia}
          </Campo>
        </div>

        <h2 className="titulo-seccion">¿Cómo se registra?</h2>
        <div className="tarjeta reajuste-opciones" role="radiogroup" aria-label="Cómo se registra la diferencia">
          {opciones.map((o) => {
            const marcada = modo === o.valor;
            return (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion reajuste-opcion"
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
      </div>

      <PieFormulario>
        <BotonExito
          className="boton-principal"
          disabled={!listo}
          alTocar={guardar}
          alTerminar={() => volver(navegar, `/cuentas/${c.id}`)}
        >
          Reajustar saldo
        </BotonExito>
      </PieFormulario>
    </div>
  );
}
