// Una factura de una tarjeta (/mi-espacio/tarjetas/:id/:mes): sus cuotas, sus pagos y el botón
// para pagarla. No está en los diseños: sigue el estilo de Tarjetas y Transacciones.
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoCheck } from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { facturaPagada, fechaPagoFactura, nombreFactura, pagarFactura, textoVence } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { diaYMes, hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Factura.css';
import './FormularioMovimiento.css';

const LISTA = '/mi-espacio/tarjetas';

export default function Factura() {
  const { id, mes } = useParams();
  const { tarjeta, cargando } = useDatos();
  const t = tarjeta(id);
  if (cargando) return <CabeceraSubpagina titulo="Factura" volverA={LISTA} />;
  if (!t || !/^\d{4}-\d{2}$/.test(mes)) return <Navigate to={LISTA} replace />;
  const factura = t.facturas.get(mes) ?? { mes, total: 0, pagado: 0, cuotas: [], pagos: [] };
  return <Contenido tarjeta={t} factura={factura} />;
}

function Contenido({ tarjeta, factura }) {
  const navegar = useNavigate();
  const { cuentas, cuenta, categoria } = useDatos();
  const [panel, setPanel] = useState(false);
  const [cuentaId, setCuentaId] = useState(tarjeta.cuentaPagoId ?? cuentas[0]?.id ?? null);
  const [pagando, setPagando] = useState(false);
  const falta = Math.max(0, factura.total - factura.pagado);
  const pagada = facturaPagada(factura);
  const vence = textoVence(tarjeta, factura.mes);
  const fechaPago = diaYMes(fechaPagoFactura(tarjeta, factura.mes));

  const pagar = async () => {
    if (!cuentaId || pagando) return;
    setPagando(true);
    try {
      await pagarFactura(tarjeta, factura, cuentaId, hoyTexto());
      setPanel(false);
    } finally {
      setPagando(false);
    }
  };

  let estado;
  if (pagada) estado = 'Pagada';
  else if (factura.total === 0) estado = 'Sin compras';
  else if (vence === 'Vencida') estado = `Venció el ${fechaPago}`;
  else estado = `Vence ${{ Hoy: 'hoy', Mañana: 'mañana' }[vence] ?? 'en ' + vence} · ${fechaPago}`;

  return (
    <div>
      <CabeceraSubpagina titulo={tarjeta.nombre} volverA={LISTA}>
        <div className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">Factura de {nombreFactura(factura.mes).toLowerCase()}</div>
          <div className="cabecera-cifra-valor">{formatearPesos(factura.total)}</div>
          <div className="cabecera-cifra-nota">{estado}</div>
        </div>
      </CabeceraSubpagina>

      <div className="contenido factura-contenido">
        {falta > 0 && (
          <button type="button" className="boton-principal factura-pagar" onClick={() => setPanel(true)}>
            Pagar {formatearPesos(falta)}
          </button>
        )}

        {factura.cuotas.length > 0 && (
          <>
            <h2 className="titulo-seccion">Compras</h2>
            <div className="tarjeta-lista">
              {factura.cuotas.map(({ movimiento: m, numero, valor }) => (
                <FilaMovimiento
                  key={m.id + numero}
                  movimiento={{ ...m, valor }}
                  detalle={
                    `${categoria(m.categoriaId)?.nombre ?? 'Sin categoría'} · ` +
                    (m.cuotas > 1 ? `Cuota ${numero} de ${m.cuotas}` : diaYMes(m.fecha))
                  }
                  alTocar={() => navegar('/movimientos/' + m.id)}
                />
              ))}
            </div>
          </>
        )}

        {factura.pagos.length > 0 && (
          <>
            <h2 className="titulo-seccion">Pagos</h2>
            <div className="tarjeta-lista">
              {factura.pagos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={`${cuenta(m.cuentaId)?.nombre ?? 'Cuenta eliminada'} · ${diaYMes(m.fecha)}`}
                  alTocar={() => navegar('/movimientos/' + m.id)}
                />
              ))}
            </div>
          </>
        )}

        {factura.cuotas.length === 0 && factura.pagos.length === 0 && (
          <div className="tarjeta vacio">Esta factura no tiene compras.</div>
        )}
      </div>

      <PanelInferior abierto={panel} alCerrar={() => setPanel(false)} titulo="Pagar factura">
        <p className="panel-texto">
          Se pagan {formatearPesos(falta)} de la factura de {nombreFactura(factura.mes).toLowerCase()} con fecha de hoy. Sale de:
        </p>
        <div className="panel-desplazable" role="radiogroup" aria-label="Cuenta desde la que se paga">
          {cuentas.map((c) => {
            const marcada = c.id === cuentaId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion"
                onClick={() => setCuentaId(c.id)}
              >
                <span className="icono-circulo grande" style={estiloIconoCuenta(c.color)}>
                  <IconoPorNombre nombre={c.icono} tamano={20} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{c.nombre}</span>
                  <span className={'panel-opcion-detalle ' + (c.saldo < 0 ? 'saldo-negativo' : 'saldo-positivo')}>
                    {formatearPesos(c.saldo)}
                  </span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="boton-principal" disabled={!cuentaId || pagando} onClick={pagar}>
          Pagar {formatearPesos(falta)}
        </button>
      </PanelInferior>
    </div>
  );
}
