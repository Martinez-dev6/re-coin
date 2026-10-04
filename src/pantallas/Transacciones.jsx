import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoBuscar, IconoFiltros, IconoVolver } from '../componentes/iconos.jsx';
import PanelFiltros, { TIPOS_FILTRO } from '../componentes/PanelFiltros.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import {
  agruparPorDia,
  cumpleFiltros,
  FILTROS_VACIOS,
  filtrosExtra,
  totalMovimientos,
  useFiltrosTransacciones,
} from '../datos/buscar.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { detalleMovimiento, estadoMovimiento, rutaMovimiento } from '../datos/movimientos.js';
import { useMes } from '../estado/MesContext.jsx';
import { enMes, etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { prepararTeclado } from './Busqueda.jsx';
import './Transacciones.css';

export default function Transacciones() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  // Se conservan al abrir un movimiento y volver (buscar.js).
  const [filtros, setFiltros] = useFiltrosTransacciones();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const datos = useDatos();
  const extra = filtrosExtra(filtros);

  // Ya viene ordenado (más recientes primero) y con cada compra con tarjeta en sus cuotas, cada
  // una en el mes en que se paga.
  const visibles = datos.movimientosPorMes.filter((m) => enMes(m.fecha, anio, mes) && cumpleFiltros(m, filtros));
  const porDia = agruparPorDia(visibles);

  // En "Todo" el banner muestra el neto (ingresos − gastos); en los demás, la suma del tipo.
  const pendiente = totalMovimientos(visibles.filter((m) => !m.pagado), filtros.tipo);
  const pagado = totalMovimientos(visibles.filter((m) => m.pagado), filtros.tipo);
  // Al cambiar de mes o de tipo, los totales y la lista entran deslizándose desde ese lado.
  const posicion = [anio * 12 + mes, TIPOS_FILTRO.findIndex((f) => f.valor === filtros.tipo)];

  const elegirTipo = (tipo) => setFiltros((f) => ({ ...f, tipo }));

  return (
    <div>
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner transacciones-banner">
          <div className="transacciones-fila">
            {/* Volver lleva a Inicio (pedido del dueño, 2026-10-04), junto a la lupa. */}
            <div className="transacciones-izquierda">
              <button type="button" className="boton-banner" aria-label="Volver a Inicio" onClick={() => navegar('/')}>
                <IconoVolver />
              </button>
              <button
                type="button"
                className="boton-banner"
                aria-label="Buscar"
                onClick={() => {
                  prepararTeclado();
                  navegar('/transacciones/buscar');
                }}
              >
                <IconoBuscar />
              </button>
            </div>
            <MesConFlechas />
            <button
              type="button"
              className="boton-banner transacciones-boton-filtros"
              aria-label={extra ? `Filtros (${extra} activos)` : 'Filtros'}
              onClick={() => setPanelAbierto(true)}
            >
              <IconoFiltros />
              {extra > 0 && <span className="transacciones-filtros-punto" aria-hidden="true" />}
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
        {TIPOS_FILTRO.map(({ valor, texto }) => (
          <button key={valor} type="button" className="chip" aria-pressed={filtros.tipo === valor} onClick={() => elegirTipo(valor)}>
            <span>{texto}</span>
          </button>
        ))}
      </div>

      {extra > 0 && (
        <div className="transacciones-aviso-filtros">
          <span>{extra === 1 ? '1 filtro más activo' : `${extra} filtros más activos`}</span>
          <button type="button" className="boton-texto" onClick={() => setFiltros((f) => ({ ...FILTROS_VACIOS, tipo: f.tipo }))}>
            Quitar
          </button>
        </div>
      )}

      <Deslizar posicion={posicion} className="transacciones-lista">
        {!datos.cargando && porDia.length === 0 && (
          <div className="tarjeta vacio">
            {extra > 0 ? 'Ningún movimiento de este mes coincide con los filtros.' : 'No hay movimientos en este mes.'}
          </div>
        )}
        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalleMovimiento(m, datos)}
                  estado={estadoMovimiento(m)}
                  mostrarRepetir
                  conObservacion
                  alTocar={() => navegar(rutaMovimiento(m))}
                />
              ))}
            </div>
          </section>
        ))}
      </Deslizar>

      <PanelFiltros
        abierto={panelAbierto}
        alCerrar={() => setPanelAbierto(false)}
        filtros={filtros}
        alCambiar={setFiltros}
        cantidad={visibles.length}
      />
    </div>
  );
}
