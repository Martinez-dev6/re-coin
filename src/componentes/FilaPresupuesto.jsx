// Fila de un presupuesto con su barra (Planes → Presupuestos y el bloque de Inicio).
import { formatearPesos } from '../utilidades/formato.js';
import CirculoCategoria from './CirculoCategoria.jsx';
import { IconoAlerta, IconoAviso, IconoCheckCirculo } from './iconos.jsx';
import './FilaPresupuesto.css';

const porcentaje = (parte, todo) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

// Estado de un presupuesto: al día, casi al límite (desde su "Avisarme al") o excedido.
function estadoPresupuesto(gastado, limite, avisarAl = 90, pesos = formatearPesos) {
  const usado = porcentaje(gastado, limite);
  if (gastado > limite) {
    return { clase: 'excedido', color: 'var(--expense)', Icono: IconoAlerta, texto: `Excedido ${pesos(gastado - limite)}`, usado };
  }
  if (usado >= avisarAl) {
    return { clase: 'limite', color: 'var(--pending)', Icono: IconoAviso, texto: 'Casi al límite', usado };
  }
  return { clase: 'ok', color: 'var(--muted)', Icono: IconoCheckCirculo, texto: `Quedan ${pesos(limite - gastado)}`, usado };
}

// alTocar: la fila es un botón (abre Editar presupuesto); la de "General" no.
// pesos: cómo escribir las cifras (en Inicio, con los saldos ocultos, salen con puntos).
// periodo: "esta semana", "esta quincena"… si no es mensual (Sesión 9), junto a las cifras.
export default function FilaPresupuesto({ nombre, icono, color, gastado, limite, avisarAl, periodo, alTocar, pesos = formatearPesos }) {
  const estado = estadoPresupuesto(gastado, limite, avisarAl, pesos);
  const barra = estado.clase === 'ok' ? 'var(--accent-text)' : estado.color;
  const Fila = alTocar ? 'button' : 'div';
  return (
    <Fila {...(alTocar && { type: 'button', onClick: alTocar })} className="presupuesto">
      <CirculoCategoria icono={icono} color={color} />
      <div className="presupuesto-cuerpo">
        <div className="presupuesto-linea">
          <span className="presupuesto-nombre">{nombre}</span>
          <span className="presupuesto-estado" style={{ color: estado.color }}>
            <estado.Icono />
            {estado.texto}
          </span>
        </div>
        <div className="barra-progreso presupuesto-barra">
          <span style={{ width: `${Math.min(estado.usado, 100)}%`, background: barra }} />
        </div>
        <div className="presupuesto-linea">
          <span className="presupuesto-cifras">
            {pesos(gastado)} de {pesos(limite)}
            {periodo && <span className="presupuesto-periodo"> · {periodo}</span>}
          </span>
          <span className="presupuesto-porcentaje" style={{ color: estado.clase === 'ok' ? 'var(--muted)' : estado.color }}>
            {estado.usado} %
          </span>
        </div>
      </div>
    </Fila>
  );
}

