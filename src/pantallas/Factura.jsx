// Una factura de una tarjeta (/facturas/:tarjetaId/:mes): lo que falta por pagar, sus compras, sus
// pagos y el botón Pagar. No está en los diseños. Rehecha a pedido del dueño (2026-10-03): la
// primera versión se parecía tanto a Tarjetas que al entrar parecía la misma pantalla. Ahora sube
// como una hoja (con la X), se pasa de una factura a otra con las flechas del mes y Pagar va en
// rojo abajo, como los botones de guardar un gasto (sale dinero).
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { CabeceraFormulario, PieFormulario } from '../componentes/Formulario.jsx';
import {
  IconoAlerta,
  IconoAnterior,
  IconoCheck,
  IconoCheckCirculo,
  IconoReloj,
  IconoSiguiente,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import {
  facturaPagada,
  fechaCierreFactura,
  fechaPagoFactura,
  nombreFactura,
  pagarFactura,
  sumarMeses,
  textoVence,
} from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { diaYMes, hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Factura.css';
import './FormularioMovimiento.css';

const LISTA = '/mi-espacio/tarjetas';
const VACIA = { total: 0, pagado: 0, cuotas: [], pagos: [] };

export default function Factura() {
  const { tarjetaId, mes } = useParams();
  const { tarjeta, cargando } = useDatos();
  const t = tarjeta(tarjetaId);
  if (cargando) return <CabeceraFormulario titulo="Factura" volverA={LISTA} />;
  if (!t || !/^\d{4}-\d{2}$/.test(mes)) return <Navigate to={LISTA} replace />;
  return <Contenido tarjeta={t} mesInicial={mes} />;
}

function Contenido({ tarjeta, mesInicial }) {
  const navegar = useNavigate();
  const { cuentas, cuenta, categoria } = useDatos();
  const [mes, setMes] = useState(mesInicial);
  const [panel, setPanel] = useState(false);
  const [cuentaId, setCuentaId] = useState(tarjeta.cuentaPagoId ?? cuentas[0]?.id ?? null);

  const factura = { mes, ...VACIA, ...tarjeta.facturas.get(mes) };
  const falta = Math.max(0, factura.total - factura.pagado);
  const pagada = facturaPagada(factura);
  const vence = textoVence(tarjeta, mes);
  const fechaPago = diaYMes(fechaPagoFactura(tarjeta, mes));
  const posicion = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5));

  // El panel se cierra cuando el botón termina su animación de "listo" (BotonExito).
  const pagar = () => (cuentaId ? pagarFactura(tarjeta, factura, cuentaId, hoyTexto()) : false);

  // Cada estado con su color (estado-banner en comunes.css).
  let estado;
  if (pagada) estado = { clase: 'pagado', Icono: IconoCheckCirculo, texto: 'Pagada' };
  else if (factura.total === 0) estado = { clase: '', Icono: IconoReloj, texto: 'Sin compras' };
  else if (vence === 'Vencida') estado = { clase: 'vencida', Icono: IconoAlerta, texto: `Venció el ${fechaPago}` };
  else {
    const cuando = { Hoy: 'hoy', Mañana: 'mañana' }[vence] ?? `en ${vence}`;
    estado = { clase: 'vence', Icono: IconoReloj, texto: `Vence ${cuando} · ${fechaPago}` };
  }

  const flechas = (
    <div className="mes-flechas">
      <button type="button" className="mes-flecha" aria-label="Factura anterior" onClick={() => setMes(sumarMeses(mes, -1))}>
        <IconoAnterior />
      </button>
      <Deslizar posicion={posicion} distancia={16} className="mes-flechas-texto" aria-live="polite">
        {nombreFactura(mes)}
      </Deslizar>
      <button type="button" className="mes-flecha" aria-label="Factura siguiente" onClick={() => setMes(sumarMeses(mes, 1))}>
        <IconoSiguiente />
      </button>
    </div>
  );

  return (
    <div>
      <CabeceraFormulario titulo={`Factura de ${nombreFactura(mes).toLowerCase()}`} volverA={LISTA} centro={flechas}>
        <Deslizar posicion={posicion} distancia={16} className="factura-cabecera">
          <span className="factura-tarjeta">
            <IconoPorNombre nombre={tarjeta.icono} tamano={14} />
            {tarjeta.nombre}
          </span>
          <span className="cabecera-cifra-etiqueta">{pagada ? 'Total pagado' : 'Por pagar'}</span>
          <span className="cabecera-cifra-valor">{formatearPesos(pagada ? factura.total : falta)}</span>
          <span className={'factura-estado estado-banner ' + estado.clase}>
            <estado.Icono tamano={14} grosor={2.2} />
            {estado.texto}
          </span>
        </Deslizar>
      </CabeceraFormulario>

      <Deslizar posicion={posicion} className="formulario-contenido factura-contenido">
        {/* Sin "$ X pagado de $ Y": el dueño no lo quiere aquí (2026-10-04). */}
        <div className="tarjeta factura-resumen">
          <div className="factura-fechas">
            <span>
              <span className="factura-fecha-etiqueta">Cierre</span>
              <strong>{diaYMes(fechaCierreFactura(tarjeta, mes))}</strong>
            </span>
            <span className="derecha">
              <span className="factura-fecha-etiqueta">Pago</span>
              <strong>{fechaPago}</strong>
            </span>
          </div>
        </div>

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
      </Deslizar>

      {falta > 0 && (
        <PieFormulario>
          <button type="button" className="boton-principal guardar-gasto" onClick={() => setPanel(true)}>
            Pagar {formatearPesos(falta)}
          </button>
        </PieFormulario>
      )}

      <PanelInferior abierto={panel} alCerrar={() => setPanel(false)} titulo="¿Desde qué cuenta pagas?">
        <p className="panel-texto">
          Se pagan {formatearPesos(falta)} de la factura de {nombreFactura(mes).toLowerCase()} con fecha de hoy, y salen
          de la cuenta que elijas.
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
        <BotonExito
          className="boton-principal guardar-gasto factura-confirmar"
          disabled={!cuentaId}
          alTocar={pagar}
          alTerminar={() => setPanel(false)}
        >
          Pagar {formatearPesos(falta)}
        </BotonExito>
      </PanelInferior>
    </div>
  );
}
