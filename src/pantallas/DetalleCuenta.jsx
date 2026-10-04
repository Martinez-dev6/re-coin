// Una cuenta (/cuentas/:id): su saldo actual y el inicial, sus datos, sus movimientos y Reajustar
// saldo abajo; Editar va arriba a la derecha. No está en los diseños. Pedido del dueño
// (2026-10-04): antes tocar una cuenta (en Inicio o en Mi espacio → Cuentas) abría directamente
// Editar cuenta. Va con el color propio de la cuenta, si tiene (useAcentoPantalla).
// Sin barra inferior, como el detalle de un movimiento.
import { useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { Campo, PieFormulario } from '../componentes/Formulario.jsx';
import { IconoBalanza, IconoBanco, IconoImportar, IconoLapiz, IconoMoneda, IconoOjo } from '../componentes/iconos.jsx';
import { agruparPorDia } from '../datos/buscar.js';
import { tipoCuenta } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { detalleMovimiento, estadoMovimiento, rutaMovimiento } from '../datos/movimientos.js';
import { useAcentoPantalla } from '../tema/TemaContext.jsx';
import { etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './DetalleMovimiento.css';
import './FormularioMovimiento.css';

const LISTA = '/mi-espacio/cuentas';
// Movimientos que se ven (los más recientes); el resto, en Transacciones.
const MAXIMO = 60;

const IconoSaldo = (p) => <IconoMoneda tamano={18} {...p} />;
const IconoMovimientos = (p) => <IconoImportar tamano={18} {...p} />;
const IconoTipo = (p) => <IconoBanco tamano={18} {...p} />;
const IconoEnSaldo = (p) => <IconoOjo tamano={18} {...p} />;

// "+ $ 20.000" o "- $ 20.000".
const conSigno = (valor) => (valor < 0 ? '- ' : '+ ') + formatearPesos(Math.abs(valor));

export default function DetalleCuenta() {
  const { id } = useParams();
  const { cuenta, cargando } = useDatos();
  const actual = cuenta(id);
  // Si se borra mientras la pantalla se va, se sigue viendo como estaba.
  const ultima = useRef(actual);
  if (actual) ultima.current = actual;

  if (cargando) return <CabeceraSubpagina titulo="Cuenta" volverA={LISTA} />;
  if (!ultima.current) return <Navigate to={LISTA} replace />;
  return <Contenido cuenta={ultima.current} />;
}

function Contenido({ cuenta: c }) {
  const navegar = useNavigate();
  const datos = useDatos();
  useAcentoPantalla(c.color);
  const ajuste = c.ajuste ?? 0;
  // Lo que movieron los movimientos pagados (el saldo actual es inicial + ajustes + esto).
  const neto = c.saldo - c.saldoInicial - ajuste;
  const propios = datos.movimientos.filter((m) => m.cuentaId === c.id || m.cuentaDestinoId === c.id);
  const porDia = agruparPorDia(propios.slice(0, MAXIMO));

  return (
    <div>
      <CabeceraSubpagina
        titulo={c.nombre}
        volverA={LISTA}
        derecha={
          <button
            type="button"
            className="boton-banner"
            aria-label="Editar cuenta"
            onClick={() => navegar(`/cuentas/${c.id}/editar`, { state: { desdeDetalle: true } })}
          >
            <IconoLapiz />
          </button>
        }
      >
        <div className="cabecera-cifra detalle-cifra">
          <div className="cabecera-cifra-etiqueta">Saldo actual</div>
          <div className="cabecera-cifra-valor">{formatearPesos(c.saldo)}</div>
          {!c.incluirEnSaldo && <div className="cabecera-cifra-nota">No suma al saldo total</div>}
        </div>
      </CabeceraSubpagina>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoSaldo} etiqueta="Saldo inicial">
            {formatearPesos(c.saldoInicial)}
          </Campo>
          <Campo Icono={IconoMovimientos} etiqueta="Movimientos">
            {conSigno(neto)}
          </Campo>
          {ajuste !== 0 && (
            <Campo Icono={IconoBalanza} etiqueta="Ajustes de saldo">
              {conSigno(ajuste)}
            </Campo>
          )}
          <Campo Icono={IconoTipo} etiqueta="Tipo">
            {tipoCuenta(c.tipo).texto}
          </Campo>
          <Campo Icono={IconoEnSaldo} etiqueta="Suma al total">
            {c.incluirEnSaldo ? 'Sí' : 'No'}
          </Campo>
        </div>

        <h2 className="titulo-seccion">Movimientos</h2>
        {porDia.length === 0 && <div className="tarjeta vacio">Esta cuenta aún no tiene movimientos.</div>}
        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h3 className="titulo-dia">{etiquetaDia(fecha)}</h3>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalleMovimiento(m, datos)}
                  estado={estadoMovimiento(m)}
                  mostrarRepetir
                  conObservacion
                  alTocar={() => navegar(rutaMovimiento(m))}
                />
              ))}
            </div>
          </section>
        ))}
        {propios.length > MAXIMO && (
          <p className="detalle-cuenta-nota">Se ven los {MAXIMO} más recientes. Los demás están en Transacciones.</p>
        )}
      </div>

      <PieFormulario>
        <button type="button" className="boton-principal" onClick={() => navegar(`/cuentas/${c.id}/reajustar`)}>
          Reajustar saldo
        </button>
      </PieFormulario>
    </div>
  );
}
