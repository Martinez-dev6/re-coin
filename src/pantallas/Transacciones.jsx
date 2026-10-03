import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoBuscar, IconoFiltros } from '../componentes/iconos.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { useMes } from '../estado/MesContext.jsx';
import { enMes, etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Transacciones.css';

const FILTROS = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
  { valor: 'transferencia', texto: 'Transferencias' },
];

// Qué filtro muestra cada tipo: los gastos con tarjeta van con los gastos y los pagos de tarjeta
// con las transferencias (solo mueven dinero entre lo propio).
const FILTRO_DE_TIPO = {
  gasto: 'gasto',
  gastoTarjeta: 'gasto',
  ingreso: 'ingreso',
  transferencia: 'transferencia',
  pagoTarjeta: 'transferencia',
};

function detalle(m, { cuenta, categoria, tarjeta }) {
  const nombreCuenta = (id) => cuenta(id)?.nombre ?? 'Cuenta eliminada';
  const nombreTarjeta = tarjeta(m.tarjetaId)?.nombre ?? 'Tarjeta eliminada';
  const nombreCategoria = categoria(m.categoriaId)?.nombre ?? 'Sin categoría';
  if (m.tipo === 'transferencia') return `${nombreCuenta(m.cuentaId)} → ${nombreCuenta(m.cuentaDestinoId)}`;
  if (m.tipo === 'pagoTarjeta') return `${nombreCuenta(m.cuentaId)} → ${nombreTarjeta}`;
  if (m.tipo === 'gastoTarjeta') return `${nombreCategoria} · ${nombreTarjeta}${m.cuotas > 1 ? ` · ${m.cuotas} cuotas` : ''}`;
  return `${nombreCategoria} · ${nombreCuenta(m.cuentaId)}`;
}

// En "Todo" el banner muestra el neto (ingresos − gastos); en los demás, la suma del tipo.
function total(lista, filtro) {
  if (filtro !== 'todo') return lista.reduce((t, m) => t + m.valor, 0);
  const signo = { ingreso: 1, gasto: -1 };
  return lista.reduce((t, m) => t + (signo[FILTRO_DE_TIPO[m.tipo]] ?? 0) * m.valor, 0);
}

// Pendiente o Pagado: solo para gastos e ingresos (las compras con tarjeta se pagan en la factura).
const estadoDe = (m) => (m.tipo === 'gasto' || m.tipo === 'ingreso' ? (m.pagado ? 'pagado' : 'pendiente') : undefined);

export default function Transacciones() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const [filtro, setFiltro] = useState('todo');
  const datos = useDatos();

  // datos.movimientos ya viene ordenado: más recientes primero.
  const visibles = datos.movimientos.filter(
    (m) => enMes(m.fecha, anio, mes) && (filtro === 'todo' || FILTRO_DE_TIPO[m.tipo] === filtro),
  );

  const porDia = [];
  for (const m of visibles) {
    const grupo = porDia.at(-1);
    if (grupo?.fecha === m.fecha) grupo.movimientos.push(m);
    else porDia.push({ fecha: m.fecha, movimientos: [m] });
  }

  const pendiente = total(visibles.filter((m) => !m.pagado), filtro);
  const pagado = total(visibles.filter((m) => m.pagado), filtro);
  // Al cambiar de mes o de filtro, los totales y la lista entran deslizándose desde ese lado.
  const posicion = [anio * 12 + mes, FILTROS.findIndex((f) => f.valor === filtro)];

  return (
    <div>
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner transacciones-banner">
          <div className="transacciones-fila">
            <button type="button" className="boton-banner" aria-label="Buscar" onClick={() => navegar('/pendiente/busqueda')}>
              <IconoBuscar />
            </button>
            <MesConFlechas />
            <button type="button" className="boton-banner" aria-label="Filtros" onClick={() => navegar('/pendiente/filtros')}>
              <IconoFiltros />
            </button>
          </div>
          <Deslizar posicion={posicion} distancia={16} className="totales-banner">
            <div>
              <div className="totales-banner-etiqueta">Pendiente</div>
              <div className="totales-banner-valor">{formatearPesos(pendiente)}</div>
            </div>
            <span className="totales-banner-divisor" />
            <div>
              <div className="totales-banner-etiqueta">Pagado</div>
              <div className="totales-banner-valor">{formatearPesos(pagado)}</div>
            </div>
          </Deslizar>
        </header>
      </div>

      <div className="chips transacciones-chips" role="group" aria-label="Tipo de movimiento">
        {FILTROS.map(({ valor, texto }) => (
          <button key={valor} type="button" className="chip" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
            <span>{texto}</span>
          </button>
        ))}
      </div>

      <Deslizar posicion={posicion} className="transacciones-lista">
        {!datos.cargando && porDia.length === 0 && <div className="tarjeta vacio">No hay movimientos en este mes.</div>}
        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalle(m, datos)}
                  estado={estadoDe(m)}
                  mostrarRepetir
                  alTocar={() => navegar('/movimientos/' + m.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </Deslizar>
    </div>
  );
}
