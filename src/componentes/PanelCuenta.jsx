// Ventana de una cuenta (pedido del dueño, 2026-10-04, con una captura de referencia: el panel de
// "¿Ya lo pagaste?"). Sube al tocar una cuenta en Inicio o en Mi espacio → Cuentas y reemplaza a la
// pantalla completa que había antes (DetalleCuenta). Muestra el saldo, los datos de la cuenta,
// "Ver movimientos" (Transacciones con el filtro de esa cuenta) y los botones Reajustar saldo y
// Editar. cuenta: la de DatosContext (con su saldo); se queda mientras el panel baja.
// ocultos: el ojo de Inicio (las cifras salen como "$ •••••").
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fijarCuentaTransacciones } from '../datos/buscar.js';
import { tipoCuenta } from '../datos/cuentas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import { IconoFlecha } from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from './PanelInferior.jsx';
import './PanelConfirmarPago.css';
import './PanelCuenta.css';

export default function PanelCuenta({ cuenta, abierto, alCerrar, ocultos = false }) {
  const navegar = useNavigate();
  const ultima = useRef(cuenta);
  if (cuenta) ultima.current = cuenta;
  const c = ultima.current;
  if (!c) return null;

  const pesos = (valor) => (ocultos ? '$ •••••' : formatearPesos(valor));
  const conSigno = (valor) => (ocultos ? pesos(valor) : (valor < 0 ? '- ' : '+ ') + formatearPesos(Math.abs(valor)));
  const ajuste = c.ajuste ?? 0;
  // Lo que movieron los movimientos pagados (el saldo actual es inicial + ajustes + esto).
  const neto = c.saldo - c.saldoInicial - ajuste;

  // Primero baja el panel y después se cambia de pantalla (si no, desaparecería de golpe).
  const ir = (ruta) => {
    alCerrar();
    setTimeout(() => navegar(ruta), DURACION_PANEL_MS + 30);
  };

  return (
    <PanelInferior abierto={abierto} alCerrar={alCerrar} titulo={c.nombre}>
      <div className="confirmar-pago-resumen panel-cuenta-resumen">
        <span className="icono-circulo grande" style={estiloIconoCuenta(c.color)}>
          <IconoPorNombre nombre={c.icono} tamano={20} />
        </span>
        <span className="panel-cuenta-resumen-textos">
          <span>Saldo actual</span>
          {!c.incluirEnSaldo && <small>No suma al saldo total</small>}
        </span>
        <strong className={c.saldo < 0 && !ocultos ? 'negativo' : undefined}>{pesos(c.saldo)}</strong>
      </div>

      <h3 className="confirmar-pago-pregunta">Detalles</h3>
      <div className="panel-cuenta-filas">
        <div className="panel-cuenta-fila">
          <span>Saldo inicial</span>
          <strong>{pesos(c.saldoInicial)}</strong>
        </div>
        <div className="panel-cuenta-fila">
          <span>Movimientos</span>
          <strong>{conSigno(neto)}</strong>
        </div>
        {ajuste !== 0 && (
          <div className="panel-cuenta-fila">
            <span>Ajustes de saldo</span>
            <strong>{conSigno(ajuste)}</strong>
          </div>
        )}
        <div className="panel-cuenta-fila">
          <span>Tipo</span>
          <strong>{tipoCuenta(c.tipo).texto}</strong>
        </div>
        <div className="panel-cuenta-fila">
          <span>En el saldo total</span>
          <strong>{c.incluirEnSaldo ? 'Sí' : 'No'}</strong>
        </div>
        <button
          type="button"
          className="panel-cuenta-fila panel-cuenta-ver"
          onClick={() => {
            fijarCuentaTransacciones(c.id);
            ir('/transacciones');
          }}
        >
          <span>Ver movimientos</span>
          <IconoFlecha />
        </button>
      </div>

      <button type="button" className="boton-principal panel-cuenta-reajustar" onClick={() => ir(`/cuentas/${c.id}/reajustar`)}>
        Reajustar saldo
      </button>
      <button type="button" className="boton-secundario" onClick={() => ir(`/cuentas/${c.id}/editar`)}>
        Editar
      </button>
    </PanelInferior>
  );
}
