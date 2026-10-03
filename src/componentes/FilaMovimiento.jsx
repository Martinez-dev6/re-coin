// Fila de 64 px de un movimiento: círculo de categoría, descripción, detalle, valor y estado.
// La usan Transacciones y Planes → Programados.
import { useDatos } from '../datos/DatosContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import CirculoCategoria from './CirculoCategoria.jsx';
import { IconoCheckCirculo, IconoReloj, IconoRepetir, IconoTransferencia } from './iconos.jsx';
import './FilaMovimiento.css';

const SIGNO = { gasto: '- ', ingreso: '+ ', transferencia: '' };

// detalle: texto pequeño bajo la descripción (o un nodo, p. ej. "Cada semana" con ícono).
// estado: 'pendiente' | 'pagado' | texto libre (p. ej. "En 13 días").
export default function FilaMovimiento({ movimiento, detalle, estado, mostrarRepetir = false }) {
  const { tipo, valor, descripcion, categoriaId, programado } = movimiento;
  const categoria = useDatos().categoria(categoriaId);

  const circulo =
    tipo === 'transferencia' ? (
      <span className="circulo-categoria" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
        <IconoTransferencia tamano={22} grosor={2} />
      </span>
    ) : (
      <CirculoCategoria
        icono={categoria?.icono}
        color={categoria?.color}
        tono={tipo === 'ingreso' ? 'var(--income)' : undefined}
      />
    );

  return (
    <div className="fila-movimiento">
      {circulo}
      <div className="fila-movimiento-textos">
        <div className="fila-movimiento-titulo">
          {descripcion}
          {mostrarRepetir && programado && (
            <span className="fila-movimiento-repetir" title="Programado">
              <IconoRepetir tamano={13} />
            </span>
          )}
        </div>
        <div className="fila-movimiento-detalle">{detalle}</div>
      </div>
      <div className="fila-movimiento-cifras">
        <div className={'fila-movimiento-valor ' + tipo}>
          {SIGNO[tipo]}
          {formatearPesos(valor)}
        </div>
        {estado === 'pendiente' && (
          <div className="fila-movimiento-estado pendiente">
            <IconoReloj />
            Pendiente
          </div>
        )}
        {estado === 'pagado' && (
          <div className="fila-movimiento-estado pagado">
            <IconoCheckCirculo />
            Pagado
          </div>
        )}
        {estado && estado !== 'pendiente' && estado !== 'pagado' && (
          <div className="fila-movimiento-estado">{estado}</div>
        )}
      </div>
    </div>
  );
}
