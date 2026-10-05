// Tarjetas de crédito con su cupo (design/capturas/Tarjetas.png). Debajo de cada una, Ver movimientos
// (Transacciones con el filtro de esa tarjeta) y Editar (ventana flotante). Sesión 9, pedido del dueño:
// se quitó la pantalla de cada tarjeta (DetalleTarjeta), que era casi esta misma con los movimientos.
import { useNavigate } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoLapiz, IconoLista, IconoMas } from '../componentes/iconos.jsx';
import { fijarCuentaTransacciones } from '../datos/buscar.js';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { proximaFactura, textoVence } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Cuentas.css';
import './Tarjetas.css';
import { abrirVentana } from '../estado/ventanas.js';

// La tarjeta con su cupo usado, cierre, pago y cuándo vence. Con alTocar es un botón.
export function ResumenTarjeta({ tarjeta: t, alTocar }) {
  const { cuenta } = useDatos();
  const porcentaje = t.cupo > 0 ? Math.min(100, Math.round((t.usado / t.cupo) * 100)) : 0;
  const proxima = proximaFactura(t);
  const vence = proxima ? textoVence(t, proxima.mes) : null;
  const pagaDesde = cuenta(t.cuentaPagoId)?.nombre;
  const Caja = alTocar ? 'button' : 'div';
  return (
    <Caja {...(alTocar && { type: 'button', onClick: alTocar })} className="tarjeta tarjetas-credito">
      <span className="tarjetas-cabeza">
        <span className="icono-circulo grande" style={estiloIconoCuenta(t.color)}>
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
    </Caja>
  );
}

export default function Tarjetas() {
  const navegar = useNavigate();
  const { tarjetas, cargando } = useDatos();
  const nueva = () => abrirVentana('tarjeta');
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
        {tarjetas.map((t) => (
          <section key={t.id} className="tarjetas-grupo">
            <ResumenTarjeta tarjeta={t} />
            <div className="botones-lado tarjetas-botones">
              <button
                type="button"
                className="boton-borde"
                onClick={() => {
                  fijarCuentaTransacciones(t.id);
                  navegar('/transacciones');
                }}
              >
                <IconoLista tamano={18} />
                Ver movimientos
              </button>
              <button type="button" className="boton-principal" onClick={() => abrirVentana('tarjeta', t.id)}>
                <IconoLapiz tamano={18} />
                Editar
              </button>
            </div>
          </section>
        ))}

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
