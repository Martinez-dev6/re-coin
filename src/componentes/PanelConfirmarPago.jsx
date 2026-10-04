// Panel pequeño para marcar un pendiente como pagado (o recibido), eligiendo de qué cuenta salió
// el dinero (o a cuál entró): puede no ser la que se había puesto (pedido del dueño, 2026-10-03).
// Una cuota de tarjeta no se paga sola: se paga su factura, desde la cuenta elegida.
// movimiento: una línea de movimientosPorMes; se queda mientras el panel baja.
import { useEffect, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { marcarPagado, tituloMovimiento } from '../datos/movimientos.js';
import { nombreFactura, pagarFactura } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import BotonExito from './BotonExito.jsx';
import { IconoCheck } from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior from './PanelInferior.jsx';
import './PanelConfirmarPago.css';

export default function PanelConfirmarPago({ movimiento: m, abierto, alCerrar }) {
  const { cuentas, categoria, tarjeta: buscarTarjeta } = useDatos();
  const [cuentaId, setCuentaId] = useState(null);
  const esCuota = Boolean(m?.movimientoId);
  const tarjeta = esCuota ? buscarTarjeta(m.tarjetaId) : null;
  const factura = tarjeta?.facturas.get(m.factura);
  const ingreso = m?.tipo === 'ingreso';

  // Cada vez que se abre, parte de la cuenta del movimiento (o desde la que se paga la tarjeta).
  useEffect(() => {
    if (!abierto || !m) return;
    const sugerida = esCuota ? tarjeta?.cuentaPagoId : m.cuentaId;
    setCuentaId(cuentas.some((c) => c.id === sugerida) ? sugerida : (cuentas[0]?.id ?? null));
    // Solo al abrir (y al cambiar de pendiente): después manda lo que se elija.
  }, [abierto, m?.id]);

  if (!m) return null;
  const valor = esCuota && factura ? factura.total - factura.pagado : m.valor;

  // El panel se cierra cuando el botón termina su animación de "listo" (BotonExito).
  const confirmar = () => {
    if (!cuentaId) return false;
    return esCuota ? pagarFactura(tarjeta, factura, cuentaId, hoyTexto()) : marcarPagado(m.id, cuentaId);
  };

  return (
    <PanelInferior abierto={abierto} alCerrar={alCerrar} titulo={ingreso ? '¿Ya lo recibiste?' : '¿Ya lo pagaste?'}>
      <div className="confirmar-pago-resumen">
        <span className="confirmar-pago-titulo">{tituloMovimiento(m, categoria)}</span>
        <strong>{formatearPesos(valor)}</strong>
      </div>
      {esCuota && factura && (
        <p className="panel-texto">
          Se paga la factura de {nombreFactura(m.factura).toLowerCase()} de {tarjeta.nombre}
          {factura.cuotas.length > 1 ? `, que tiene ${factura.cuotas.length} compras` : ''}.
        </p>
      )}
      <h3 className="confirmar-pago-pregunta">{ingreso ? '¿A qué cuenta entró?' : '¿De qué cuenta salió?'}</h3>
      <div className="panel-desplazable confirmar-pago-cuentas" role="radiogroup" aria-label="Cuenta">
        {cuentas.map((c) => {
          const marcada = c.id === cuentaId;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={marcada}
              className="panel-opcion confirmar-pago-cuenta"
              onClick={() => setCuentaId(c.id)}
            >
              <span className="icono-circulo" style={estiloIconoCuenta(c.color)}>
                <IconoPorNombre nombre={c.icono} tamano={16} />
              </span>
              <span className="panel-opcion-textos">
                <span className="panel-opcion-titulo">{c.nombre}</span>
              </span>
              <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
            </button>
          );
        })}
      </div>
      <BotonExito
        className="boton-principal confirmar-pago-boton"
        disabled={!cuentaId}
        alTocar={confirmar}
        alTerminar={alCerrar}
      >
        {ingreso ? 'Marcar como recibido' : 'Marcar como pagado'}
      </BotonExito>
    </PanelInferior>
  );
}
