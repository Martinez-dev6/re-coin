// Fila de 64 px de un movimiento: círculo de categoría, descripción, detalle, valor y estado.
// La usan Transacciones y Planes → Programados.
import { useDatos } from '../datos/DatosContext.jsx';
import { tituloMovimiento } from '../datos/movimientos.js';
import { formatearPesos } from '../utilidades/formato.js';
import CirculoCategoria from './CirculoCategoria.jsx';
import { IconoCheckCirculo, IconoReloj, IconoRepetir, IconoTarjeta, IconoTransferencia } from './iconos.jsx';
import './FilaMovimiento.css';

const SIGNO = { gasto: '- ', gastoTarjeta: '- ', ingreso: '+ ', transferencia: '', pagoTarjeta: '' };
// Color del valor: el gasto con tarjeta como gasto y el pago de tarjeta como transferencia.
const CLASE = {
  gasto: 'gasto',
  gastoTarjeta: 'gasto',
  ingreso: 'ingreso',
  transferencia: 'transferencia',
  pagoTarjeta: 'transferencia',
};

// detalle: texto pequeño bajo la descripción (o un nodo, p. ej. "Cada semana" con ícono).
// estado: 'pendiente' | 'pagado' | texto libre (p. ej. "En 13 días").
// alTocar: la fila es un botón (abre el detalle).
export default function FilaMovimiento({ movimiento, detalle, estado, mostrarRepetir = false, alTocar }) {
  const { tipo, valor, categoriaId, programado } = movimiento;
  const buscarCategoria = useDatos().categoria;
  const categoria = buscarCategoria(categoriaId);
  const Fila = alTocar ? 'button' : 'div';

  const circulo =
    tipo === 'transferencia' || tipo === 'pagoTarjeta' ? (
      <span className="circulo-categoria" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
        {tipo === 'pagoTarjeta' ? <IconoTarjeta tamano={22} /> : <IconoTransferencia tamano={22} grosor={2} />}
      </span>
    ) : (
      <CirculoCategoria
        icono={categoria?.icono}
        color={categoria?.color}
        tono={tipo === 'ingreso' ? 'var(--income)' : undefined}
      />
    );

  return (
    <Fila {...(alTocar && { type: 'button', onClick: alTocar })} className="fila-movimiento">
      {circulo}
      <div className="fila-movimiento-textos">
        <div className="fila-movimiento-titulo">
          <span className="fila-movimiento-texto">{tituloMovimiento(movimiento, buscarCategoria)}</span>
          {mostrarRepetir && programado && (
            <span className="fila-movimiento-repetir" title="Programado">
              <IconoRepetir tamano={13} />
            </span>
          )}
        </div>
        <div className="fila-movimiento-detalle">{detalle}</div>
      </div>
      <div className="fila-movimiento-cifras">
        <div className={'fila-movimiento-valor ' + CLASE[tipo]}>
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
            {tipo === 'ingreso' ? 'Recibido' : 'Pagado'}
          </div>
        )}
        {estado && estado !== 'pendiente' && estado !== 'pagado' && (
          <div className="fila-movimiento-estado">{estado}</div>
        )}
      </div>
    </Fila>
  );
}
