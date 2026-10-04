// Una tarjeta de crédito (/tarjetas/:id): su resumen, sus facturas y sus movimientos (compras y
// pagos), con Editar arriba a la derecha. No está en los diseños. Pedido del dueño (2026-10-04):
// antes tocar una tarjeta abría directamente Editar tarjeta, y las facturas iban en la lista.
// Sin barra inferior, como el detalle de un movimiento.
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoCalendario, IconoCheckCirculo, IconoLapiz, IconoReloj } from '../componentes/iconos.jsx';
import { agruparPorDia } from '../datos/buscar.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { facturaPagada, facturasOrdenadas, nombreFactura } from '../datos/tarjetas.js';
import { etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { ResumenTarjeta } from './Tarjetas.jsx';
import './Cuentas.css';
import './Tarjetas.css';

const LISTA = '/mi-espacio/tarjetas';

export default function DetalleTarjeta() {
  const { id } = useParams();
  const { tarjeta, cargando } = useDatos();
  const t = tarjeta(id);
  if (cargando) return <CabeceraSubpagina titulo="Tarjeta" volverA={LISTA} />;
  if (!t) return <Navigate to={LISTA} replace />;
  return <Contenido tarjeta={t} />;
}

function Contenido({ tarjeta: t }) {
  const navegar = useNavigate();
  const { movimientos, categoria, cuenta } = useDatos();
  const facturas = facturasOrdenadas(t);
  // Compras y pagos de la tarjeta, los más recientes primero (las compras por el día en que se
  // hicieron, no por el de cada cuota).
  const porDia = agruparPorDia(movimientos.filter((m) => m.tarjetaId === t.id));

  return (
    <div>
      <CabeceraSubpagina
        titulo={t.nombre}
        volverA={LISTA}
        derecha={
          <button
            type="button"
            className="boton-banner"
            aria-label="Editar tarjeta"
            onClick={() => navegar(`/tarjetas/${t.id}/editar`, { state: { desdeDetalle: true } })}
          >
            <IconoLapiz />
          </button>
        }
      >
        <div className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">Disponible</div>
          <div className="cabecera-cifra-valor">{formatearPesos(Math.max(0, t.cupo - t.usado))}</div>
          <div className="cabecera-cifra-nota">de {formatearPesos(t.cupo)} de cupo</div>
        </div>
      </CabeceraSubpagina>

      <div className="contenido cuentas-contenido">
        <ResumenTarjeta tarjeta={t} />

        {facturas.length > 0 && (
          <>
            <h2 className="titulo-seccion">Facturas</h2>
            <div className="tarjeta tarjetas-facturas">
              {facturas.map((f) => {
                const pagada = facturaPagada(f);
                return (
                  <button
                    key={f.mes}
                    type="button"
                    className="tarjetas-factura"
                    onClick={() => navegar(`/facturas/${t.id}/${f.mes}`)}
                  >
                    <span className="icono-circulo grande">
                      <IconoCalendario tamano={18} />
                    </span>
                    <span className="tarjetas-factura-mes">{nombreFactura(f.mes)}</span>
                    <span className="tarjetas-factura-cifras">
                      <span className="tarjetas-factura-valor">- {formatearPesos(f.total)}</span>
                      <span className={'tarjetas-factura-estado ' + (pagada ? 'pagada' : 'pendiente')}>
                        {pagada ? <IconoCheckCirculo /> : <IconoReloj />}
                        {pagada ? 'Pagada' : 'Pendiente'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <h2 className="titulo-seccion">Movimientos</h2>
        {porDia.length === 0 && <div className="tarjeta vacio">Esta tarjeta aún no tiene compras.</div>}
        {porDia.map(({ fecha, movimientos: delDia }) => (
          <section key={fecha}>
            <h3 className="titulo-dia">{etiquetaDia(fecha)}</h3>
            <div className="tarjeta-lista">
              {delDia.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={
                    m.tipo === 'pagoTarjeta'
                      ? `Pago desde ${cuenta(m.cuentaId)?.nombre ?? 'cuenta eliminada'}`
                      : (categoria(m.categoriaId)?.nombre ?? 'Sin categoría')
                  }
                  estado={m.tipo === 'gastoTarjeta' && m.cuotas > 1 ? `${m.cuotas} cuotas` : undefined}
                  conObservacion
                  alTocar={() => navegar('/movimientos/' + m.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
