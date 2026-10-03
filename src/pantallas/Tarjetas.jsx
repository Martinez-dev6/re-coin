// Tarjetas de crédito con su cupo y sus facturas (design/capturas/Tarjetas.png).
import { useNavigate } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoCalendario, IconoCheckCirculo, IconoMas, IconoReloj } from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { facturaPagada, facturasOrdenadas, nombreFactura, proximaFactura, textoVence } from '../datos/tarjetas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Cuentas.css';
import './Tarjetas.css';

// Facturas que se ven bajo cada tarjeta; las más viejas no.
const FACTURAS_VISIBLES = 4;

export default function Tarjetas() {
  const navegar = useNavigate();
  const { tarjetas, cuenta, cargando } = useDatos();
  const nueva = () => navegar('/tarjetas/nueva');
  const cupo = tarjetas.reduce((total, t) => total + t.cupo, 0);
  const disponible = tarjetas.reduce((total, t) => total + Math.max(0, t.cupo - t.usado), 0);

  return (
    <div>
      <CabeceraSubpagina
        titulo="Tarjetas de crédito"
        volverA="/mi-espacio"
        derecha={
          <button type="button" className="boton-banner" aria-label="Nueva tarjeta" onClick={nueva}>
            <IconoMas />
          </button>
        }
      >
        <div className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">Disponible</div>
          <div className="cabecera-cifra-valor">{cargando ? ' ' : formatearPesos(disponible)}</div>
          <div className="cabecera-cifra-nota">de {formatearPesos(cupo)} de cupo</div>
        </div>
      </CabeceraSubpagina>

      <div className="contenido cuentas-contenido">
        {tarjetas.map((t) => {
          const porcentaje = t.cupo > 0 ? Math.min(100, Math.round((t.usado / t.cupo) * 100)) : 0;
          const proxima = proximaFactura(t);
          const vence = proxima ? textoVence(t, proxima.mes) : null;
          const facturas = facturasOrdenadas(t).slice(0, FACTURAS_VISIBLES);
          const pagaDesde = cuenta(t.cuentaPagoId)?.nombre;
          return (
            <section key={t.id} className="tarjetas-grupo">
              <button type="button" className="tarjeta tarjetas-credito" onClick={() => navegar('/tarjetas/' + t.id)}>
                <span className="tarjetas-cabeza">
                  <span className="icono-circulo grande">
                    <IconoPorNombre nombre={t.icono} tamano={20} />
                  </span>
                  <span className="cuentas-textos">
                    <span className="cuentas-nombre">{t.nombre}</span>
                    <span className="cuentas-detalle">Crédito{pagaDesde && ` · paga desde ${pagaDesde}`}</span>
                  </span>
                  <span className="tarjetas-porcentaje">{porcentaje} %</span>
                </span>
                <span className="barra-progreso tarjetas-progreso">
                  <span style={{ width: `${porcentaje}%` }} />
                </span>
                <span className="tarjetas-uso">
                  <span>
                    <strong>{formatearPesos(t.usado)}</strong> usado
                  </span>
                  <span>de {formatearPesos(t.cupo)}</span>
                </span>
                <span className="tarjetas-fechas">
                  <span>
                    <span className="tarjetas-fecha-etiqueta">Cierre</span>
                    <strong>Día {t.diaCierre}</strong>
                  </span>
                  <span>
                    <span className="tarjetas-fecha-etiqueta">Pago</span>
                    <strong>Día {t.diaPago}</strong>
                  </span>
                  <span className="derecha">
                    <span className="tarjetas-fecha-etiqueta">Vence en</span>
                    <strong className={vence === 'Vencida' ? 'vencida' : vence ? 'pendiente' : undefined}>{vence ?? 'Al día'}</strong>
                  </span>
                </span>
              </button>

              {facturas.length > 0 && (
                <>
                  <h2 className="titulo-seccion">{tarjetas.length > 1 ? `Facturas · ${t.nombre}` : 'Facturas'}</h2>
                  <div className="tarjeta tarjetas-facturas">
                    {facturas.map((f) => {
                      const pagada = facturaPagada(f);
                      return (
                        <button
                          key={f.mes}
                          type="button"
                          className="tarjetas-factura"
                          onClick={() => navegar(`/mi-espacio/tarjetas/${t.id}/${f.mes}`)}
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
            </section>
          );
        })}

        {!cargando && (
          <button type="button" className="cuentas-nueva" onClick={nueva}>
            <IconoMas tamano={18} />
            Nueva tarjeta
          </button>
        )}
      </div>
    </div>
  );
}
