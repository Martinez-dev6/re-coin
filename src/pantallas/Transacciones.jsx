import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoBuscar, IconoFiltros } from '../componentes/iconos.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { CATEGORIAS, CUENTAS, MOVIMIENTOS } from '../datos/prueba.js';
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

const nombreCuenta = (id) => CUENTAS.find((c) => c.id === id)?.nombre ?? '';

function detalle(m) {
  if (m.tipo === 'transferencia') return `${nombreCuenta(m.cuentaId)} → ${nombreCuenta(m.cuentaDestinoId)}`;
  return `${CATEGORIAS[m.categoriaId]?.nombre ?? 'Sin categoría'} · ${nombreCuenta(m.cuentaId)}`;
}

// En "Todo" el banner muestra el neto (ingresos − gastos); en los demás, la suma del tipo.
function total(lista, filtro) {
  if (filtro !== 'todo') return lista.reduce((t, m) => t + m.valor, 0);
  return lista.reduce((t, m) => t + (m.tipo === 'ingreso' ? m.valor : m.tipo === 'gasto' ? -m.valor : 0), 0);
}

export default function Transacciones() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const [filtro, setFiltro] = useState('todo');

  const visibles = MOVIMIENTOS.filter((m) => enMes(m.fecha, anio, mes) && (filtro === 'todo' || m.tipo === filtro)).sort(
    (a, b) => b.fecha.localeCompare(a.fecha),
  );

  const porDia = [];
  for (const m of visibles) {
    const grupo = porDia.at(-1);
    if (grupo?.fecha === m.fecha) grupo.movimientos.push(m);
    else porDia.push({ fecha: m.fecha, movimientos: [m] });
  }

  const pendiente = total(visibles.filter((m) => !m.pagado), filtro);
  const pagado = total(visibles.filter((m) => m.pagado), filtro);

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
          <div className="totales-banner">
            <div>
              <div className="totales-banner-etiqueta">Pendiente</div>
              <div className="totales-banner-valor">{formatearPesos(pendiente)}</div>
            </div>
            <span className="totales-banner-divisor" />
            <div>
              <div className="totales-banner-etiqueta">Pagado</div>
              <div className="totales-banner-valor">{formatearPesos(pagado)}</div>
            </div>
          </div>
        </header>
      </div>

      <div className="chips transacciones-chips" role="group" aria-label="Tipo de movimiento">
        {FILTROS.map(({ valor, texto }) => (
          <button key={valor} type="button" className="chip" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
            <span>{texto}</span>
          </button>
        ))}
      </div>

      <div className="transacciones-lista">
        {porDia.length === 0 && <div className="tarjeta vacio">No hay movimientos en este mes.</div>}
        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalle(m)}
                  estado={m.pagado ? 'pagado' : 'pendiente'}
                  mostrarRepetir
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
