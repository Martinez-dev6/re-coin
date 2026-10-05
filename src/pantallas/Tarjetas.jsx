// Tarjetas de crédito con su cupo (design/capturas/Tarjetas.png). Tocar una abre su pantalla
// (DetalleTarjeta: facturas y movimientos, y Editar arriba). Pedido del dueño (2026-10-04): las
// facturas ya no van aquí debajo de cada tarjeta y tocar la tarjeta ya no abre Editar.
import { useNavigate } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoMas } from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { proximaFactura, textoVence } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Cuentas.css';
import './Tarjetas.css';

// La tarjeta con su cupo usado, cierre, pago y cuándo vence. Con alTocar es un botón (en la lista);
// sin él, solo se ve (arriba de DetalleTarjeta).
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
        {tarjetas.map((t) => (
          <section key={t.id} className="tarjetas-grupo">
            <ResumenTarjeta tarjeta={t} alTocar={() => navegar('/tarjetas/' + t.id)} />
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
