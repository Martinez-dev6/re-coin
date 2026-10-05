// Detalle de un movimiento (/movimientos/:id). design/capturas/DetalleMovimiento.png
// Sin barra inferior: entra desde la derecha por encima de ella (TransicionPantallas.jsx).
// Tocar el estado (Pendiente / Pagado) abre una ventana para confirmarlo, con la animación de
// "listo" (pedido del dueño, 2026-10-04: antes cambiaba al instante y se prestaba a confusión).
// La hora solo sale si el movimiento la tiene (horaDe en movimientos.js).
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import BotonExito from '../componentes/BotonExito.jsx';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import EditarMovimiento from '../componentes/EditarMovimiento.jsx';
import { Campo, PieFormulario } from '../componentes/Formulario.jsx';
import {
  IconoBasura,
  IconoCalendario,
  IconoCapas,
  IconoCategorias,
  IconoCheckCirculo,
  IconoCuentas,
  IconoEtiqueta,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoLapiz,
  IconoNota,
  IconoRecibo,
  IconoReloj,
  IconoTarjeta,
} from '../componentes/iconos.jsx';
import PanelConfirmarPago from '../componentes/PanelConfirmarPago.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { cambiarPagado, eliminarMovimiento, horaDe, tituloMovimiento } from '../datos/movimientos.js';
import { nombreFactura } from '../datos/tarjetas.js';
import { etiquetaDia, textoHora } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import './DetalleMovimiento.css';
import './FormularioMovimiento.css';

const LISTA = '/transacciones';
const SIGNO = { gasto: '- ', gastoTarjeta: '- ', ingreso: '+ ', transferencia: '', pagoTarjeta: '' };

const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoCuotas = (p) => <IconoCapas tamano={18} {...p} />;
const IconoFactura = (p) => <IconoRecibo tamano={18} {...p} />;
const IconoHora = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

export default function DetalleMovimiento() {
  const { id } = useParams();
  const { movimientos, cargando } = useDatos();
  const movimiento = movimientos.find((m) => m.id === id);
  // Después de eliminarlo, mientras la pantalla se va, se sigue viendo como estaba.
  const ultimo = useRef(movimiento);
  if (movimiento) ultimo.current = movimiento;

  if (cargando) return <CabeceraSubpagina titulo="Detalle" volverA={LISTA} />;
  if (!ultimo.current) return <Navigate to={LISTA} replace />;
  return <Contenido movimiento={ultimo.current} />;
}

function Contenido({ movimiento: m }) {
  const navegar = useNavigate();
  const { cuenta, categoria: buscarCategoria, etiqueta, tarjeta } = useDatos();
  const [panelEliminar, setPanelEliminar] = useState(false);
  // Ventana del estado: 'pagar' (elegir la cuenta, como en Pendientes), 'hecha' (transferencia
  // programada) o 'pendiente' (volver a dejarlo pendiente).
  const [panelEstado, setPanelEstado] = useState(null);
  const cerrarEstado = () => setPanelEstado(null);
  // Se edita en una ventana flotante encima del detalle (Sesión 9), no en otra pantalla.
  const [editando, setEditando] = useState(false);
  const eliminando = useRef(false);
  // Los gastos e ingresos tienen Pagado / Pendiente; una transferencia, solo si es programada
  // (se registra pendiente).
  const conEstado = m.tipo === 'gasto' || m.tipo === 'ingreso';
  const conChip = conEstado || (m.tipo === 'transferencia' && Boolean(m.programadoId));
  // El pago de una factura se hace desde la factura; aquí solo se puede eliminar.
  const editable = m.tipo !== 'pagoTarjeta';
  const categoria = buscarCategoria(m.categoriaId);
  const nombreCuenta = (id) => cuenta(id)?.nombre ?? 'Cuenta eliminada';
  const nombreTarjeta = tarjeta(m.tarjetaId)?.nombre ?? 'Tarjeta eliminada';
  const filaCategoria = (
    <Campo Icono={IconoCategorias} etiqueta="Categoría">
      {categoria ? (
        <>
          <CirculoCategoria icono={categoria.icono} color={categoria.color} talla="chico" />
          <span className="campo-recortado">{categoria.nombre}</span>
        </>
      ) : (
        <span className="campo-vacio">Sin categoría</span>
      )}
    </Campo>
  );
  const filaTarjeta = (
    <Campo Icono={IconoTarjeta} etiqueta="Tarjeta">
      {nombreTarjeta}
    </Campo>
  );
  const filaFactura = m.factura && (
    <Campo Icono={IconoFactura} etiqueta="Factura">
      {nombreFactura(m.factura)}
    </Campo>
  );
  const anio = Number(m.fecha.slice(0, 4));
  const fecha = etiquetaDia(m.fecha) + (anio !== new Date().getFullYear() ? ` de ${anio}` : '');
  const etiquetas = m.etiquetaIds.map((e) => etiqueta(e)?.nombre).filter(Boolean);
  const hora = horaDe(m);

  let textoPendiente = `El dinero vuelve a ${nombreCuenta(m.cuentaId)} hasta que la marques como hecha.`;
  if (m.tipo === 'gasto') textoPendiente = `Deja de restarse del saldo de ${nombreCuenta(m.cuentaId)} hasta que lo marques como pagado.`;
  if (m.tipo === 'ingreso') textoPendiente = `Deja de sumarse al saldo de ${nombreCuenta(m.cuentaId)} hasta que lo marques como recibido.`;

  // Primero baja el panel; después se vuelve y se borra (como al eliminar una cuenta).
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanelEliminar(false);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarMovimiento(m.id);
    }, DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Detalle" volverA={LISTA}>
        <div className="cabecera-cifra detalle-cifra">
          <div className="cabecera-cifra-etiqueta">{tituloMovimiento(m, buscarCategoria)}</div>
          <div className="cabecera-cifra-valor">
            {SIGNO[m.tipo]}
            {formatearPesos(m.valor)}
          </div>
          {/* Tocar el estado abre la ventana para cambiarlo. */}
          {conChip && (
            <button
              type="button"
              className={'detalle-estado estado-banner ' + (m.pagado ? 'pagado' : 'pendiente')}
              aria-label={(m.pagado ? 'Pagado' : 'Pendiente') + '. Tocar para cambiar'}
              onClick={() => setPanelEstado(m.pagado ? 'pendiente' : m.tipo === 'transferencia' ? 'hecha' : 'pagar')}
            >
              {m.pagado ? <IconoCheckCirculo tamano={14} grosor={2.2} /> : <IconoReloj tamano={14} grosor={2.2} />}
              {m.pagado ? (m.tipo === 'ingreso' ? 'Recibido' : 'Pagado') : 'Pendiente'}
            </button>
          )}
        </div>
      </CabeceraSubpagina>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          {m.tipo === 'transferencia' && (
            <>
              <Campo Icono={IconoDesde} etiqueta="Desde">
                {nombreCuenta(m.cuentaId)}
              </Campo>
              <Campo Icono={IconoHacia} etiqueta="Hacia">
                {nombreCuenta(m.cuentaDestinoId)}
              </Campo>
            </>
          )}
          {m.tipo === 'pagoTarjeta' && (
            <>
              <Campo Icono={IconoDesde} etiqueta="Desde">
                {nombreCuenta(m.cuentaId)}
              </Campo>
              {filaTarjeta}
              {filaFactura}
            </>
          )}
          {m.tipo === 'gastoTarjeta' && (
            <>
              {filaCategoria}
              {filaTarjeta}
              <Campo Icono={IconoCuotas} etiqueta="Cuotas">
                {m.cuotas > 1 ? `${m.cuotas} cuotas` : 'Sin cuotas'}
              </Campo>
              {filaFactura}
            </>
          )}
          {conEstado && (
            <>
              {filaCategoria}
              <Campo Icono={IconoCuentas} etiqueta="Cuenta">
                {nombreCuenta(m.cuentaId)}
              </Campo>
            </>
          )}
          <Campo Icono={IconoFecha} etiqueta="Fecha">
            {fecha}
          </Campo>
          {hora && (
            <Campo Icono={IconoHora} etiqueta="Hora">
              {textoHora(hora)}
            </Campo>
          )}
          {etiquetas.length > 0 && (
            <Campo Icono={IconoEtiqueta} etiqueta="Etiquetas">
              <span className="campo-recortado">{etiquetas.join(', ')}</span>
            </Campo>
          )}
        </div>

        {m.observacion && (
          <>
            <h2 className="titulo-seccion detalle-titulo-nota">
              <IconoNota tamano={14} />
              Observación
            </h2>
            <p className="tarjeta detalle-nota">{m.observacion}</p>
          </>
        )}
      </div>

      <PieFormulario>
        <div className="detalle-botones">
          <button type="button" className="detalle-eliminar" onClick={() => setPanelEliminar(true)}>
            <IconoBasura />
            Eliminar
          </button>
          {editable && (
            <button
              type="button"
              className="boton-principal"
              onClick={() => setEditando(true)}
            >
              <IconoLapiz tamano={18} />
              Editar
            </button>
          )}
        </div>
      </PieFormulario>

      {editable && <EditarMovimiento movimiento={m} abierto={editando} alCerrar={() => setEditando(false)} />}

      <PanelConfirmarPago movimiento={m} abierto={panelEstado === 'pagar'} alCerrar={cerrarEstado} />

      <PanelInferior abierto={panelEstado === 'hecha'} alCerrar={cerrarEstado} titulo="¿Ya hiciste la transferencia?">
        <p className="panel-texto">
          Pasan {formatearPesos(m.valor)} de {nombreCuenta(m.cuentaId)} a {nombreCuenta(m.cuentaDestinoId)}.
        </p>
        <BotonExito
          className="boton-principal guardar-transferencia"
          alTocar={() => cambiarPagado(m.id, true)}
          alTerminar={cerrarEstado}
        >
          Marcar como hecha
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={cerrarEstado}>
          Cancelar
        </button>
      </PanelInferior>

      <PanelInferior abierto={panelEstado === 'pendiente'} alCerrar={cerrarEstado} titulo="¿Marcar como pendiente?">
        <p className="panel-texto">{textoPendiente}</p>
        <BotonExito
          className="boton-principal guardar-pendiente"
          alTocar={() => cambiarPagado(m.id, false)}
          alTerminar={cerrarEstado}
        >
          Marcar como pendiente
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={cerrarEstado}>
          Cancelar
        </button>
      </PanelInferior>

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar el movimiento?">
        <p className="panel-texto">
          Se borra «{tituloMovimiento(m, buscarCategoria)}» de {formatearPesos(m.valor)}. No se puede deshacer.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
