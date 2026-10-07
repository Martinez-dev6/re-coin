// Panel pequeño para marcar un pendiente como pagado (o recibido), eligiendo de qué cuenta salió
// el dinero (o a cuál entró): puede no ser la que se había puesto (pedido del dueño, 2026-10-03).
// Una cuota de tarjeta no se paga sola: se paga su factura, desde la cuenta elegida.
// El valor se toca y se cambia con el teclado numérico, sin botones aparte (Sesión 12, pedido del
// dueño): si se gastó menos o se recibió más de lo anotado. Cambia solo este movimiento (no su
// serie); en una cuota se paga ese valor de la factura y, si es menos, el resto queda pendiente.
// movimiento: una línea de movimientosPorMes; se queda mientras el panel baja.
import { useEffect, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { marcarPagado, tituloMovimiento } from '../datos/movimientos.js';
import { nombreFactura, pagarFactura } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { cursorAlFinal } from './Formulario.jsx';
import BotonExito from './BotonExito.jsx';
import { IconoCheck } from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior from './PanelInferior.jsx';
import './PanelConfirmarPago.css';

export default function PanelConfirmarPago({ movimiento: m, abierto, alCerrar }) {
  const { cuentas, categoria, tarjeta: buscarTarjeta } = useDatos();
  const [cuentaId, setCuentaId] = useState(null);
  const [monto, setMonto] = useState(0);
  const esCuota = Boolean(m?.movimientoId);
  const tarjeta = esCuota ? buscarTarjeta(m.tarjetaId) : null;
  const factura = tarjeta?.facturas.get(m.factura);
  const ingreso = m?.tipo === 'ingreso';

  // Cada vez que se abre, parte de la cuenta del movimiento (o desde la que se paga la tarjeta).
  useEffect(() => {
    if (!abierto || !m) return;
    const sugerida = esCuota ? tarjeta?.cuentaPagoId : m.cuentaId;
    setCuentaId(cuentas.some((c) => c.id === sugerida) ? sugerida : (cuentas[0]?.id ?? null));
    setMonto(esCuota && factura ? factura.total - factura.pagado : m.valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo al abrir (y al cambiar de pendiente): después manda lo que se elija.
  }, [abierto, m?.id]);

  if (!m) return null;

  // El panel se cierra cuando el botón termina su animación de "listo" (BotonExito).
  const confirmar = () => {
    if (!cuentaId || !monto) return false;
    return esCuota
      ? pagarFactura(tarjeta, factura, cuentaId, hoyTexto(), monto)
      : marcarPagado(m.id, cuentaId, monto !== m.valor ? monto : undefined);
  };

  return (
    <PanelInferior abierto={abierto} alCerrar={alCerrar} titulo={ingreso ? '¿Ya lo recibiste?' : '¿Ya lo pagaste?'}>
      <div className="confirmar-pago-resumen">
        <span className="confirmar-pago-titulo">{tituloMovimiento(m, categoria)}</span>
        <input
          className="confirmar-pago-valor"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={ingreso ? 'Valor recibido' : 'Valor pagado'}
          placeholder={formatearPesos(0)}
          // Ancho de la cifra, para que el título use el resto de la fila.
          style={{ width: `${formatearPesos(monto).length + 0.5}ch` }}
          value={monto ? formatearPesos(monto) : ''}
          onFocus={cursorAlFinal}
          onClick={cursorAlFinal}
          onChange={(evento) => setMonto(Number(evento.target.value.replace(/\D/g, '').slice(0, 12)) || 0)}
          onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
        />
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
        // Del color de lo que se confirma (pedido del dueño, Sesión 9): ingreso verde, gasto rojo.
        className={'boton-principal confirmar-pago-boton ' + (ingreso ? 'guardar-ingreso' : 'guardar-gasto')}
        disabled={!cuentaId || !monto}
        alTocar={confirmar}
        alTerminar={alCerrar}
      >
        {ingreso ? 'Ingresar' : 'Pagar'}
      </BotonExito>
    </PanelInferior>
  );
}
