// Gastos o ingresos pendientes de un mes (/pendientes?tipo=gasto|ingreso): el mes elegido en
// Inicio, que se cambia con las flechas de arriba. Se abre desde las tarjetas "Pendientes y
// alertas" de Inicio (pedido del dueño, 2026-10-03: antes llevaban a Transacciones). Sube como un
// formulario y se cierra con la X. No está en los diseños. Tocar una fila (o su flecha) abre el panel
// para marcarlo como pagado (PanelConfirmarPago); desde la Sesión 9 ya no abre el detalle (pedido del
// dueño: aquí un pendiente solo se marca). Antes la flecha era un chulito; el chulo queda para la
// animación de "listo" al confirmar. Desde la Sesión 10 (pedido del dueño) en los meses siguientes
// salen también las fechas de los recurrentes que aún no son movimientos (programadosDelMes, como
// en Transacciones y Planes): tocarlas abre el programado (PanelProgramado), porque aún no hay nada
// que marcar como pagado.
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { CabeceraFormulario, Segmentado } from '../componentes/Formulario.jsx';
import { IconoFlecha, IconoRepetir } from '../componentes/iconos.jsx';
import PanelConfirmarPago from '../componentes/PanelConfirmarPago.jsx';
import PanelProgramado from '../componentes/PanelProgramado.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { detalleMovimiento, esGasto } from '../datos/movimientos.js';
import { programadosDelMes, textoFrecuencia } from '../datos/programados.js';
import { useMes } from '../estado/MesContext.jsx';
import { enMes, etiquetaDia, nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Pendientes.css';

const TIPOS = [
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
];

export default function Pendientes() {
  const [parametros] = useSearchParams();
  const [tipo, setTipo] = useState(parametros.get('tipo') === 'ingreso' ? 'ingreso' : 'gasto');
  const { anio, mes } = useMes();
  const datos = useDatos();
  // El pendiente que se va a confirmar; se queda mientras el panel baja.
  const [porConfirmar, setPorConfirmar] = useState(null);
  const [panel, setPanel] = useState(false);
  // Ventana de un programado, al tocar una fecha que aún no es movimiento.
  const [abierto, setAbierto] = useState({ id: null, ocurrencia: null });
  const [panelProgramado, setPanelProgramado] = useState(false);
  const frecuenciaDe = (id) => datos.programados.find((p) => p.id === id)?.frecuencia;
  const abrir = (m) => {
    if (m.futuro) {
      setAbierto({ id: m.programadoId, ocurrencia: m.compra });
      setPanelProgramado(true);
    } else {
      setPorConfirmar(m);
      setPanel(true);
    }
  };

  // Del mes, sin pagar; los gastos incluyen las cuotas de tarjeta que vencen en él, y en los meses
  // siguientes, las fechas de los recurrentes.
  const delTipo = (m) => (tipo === 'ingreso' ? m.tipo === 'ingreso' : esGasto(m));
  const pendientes = [
    ...datos.movimientosPorMes.filter((m) => enMes(m.fecha, anio, mes) && !m.pagado && delTipo(m)).reverse(),
    ...programadosDelMes(datos.programados, datos.tarjeta, anio, mes).filter(delTipo),
  ]
    // Lo más próximo primero.
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const total = pendientes.reduce((suma, m) => suma + m.valor, 0);

  const porDia = [];
  for (const m of pendientes) {
    const grupo = porDia.at(-1);
    if (grupo?.fecha === m.fecha) grupo.movimientos.push(m);
    else porDia.push({ fecha: m.fecha, movimientos: [m] });
  }

  const nombreDelMes = nombreMes(mes, false) + (anio !== new Date().getFullYear() ? ` de ${anio}` : '');
  const posicion = TIPOS.findIndex((t) => t.valor === tipo);

  return (
    <div>
      <CabeceraFormulario titulo="Pendientes" volverA="/" centro={<MesConFlechas />}>
        <Deslizar posicion={[anio * 12 + mes, posicion]} distancia={16} className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">{tipo === 'ingreso' ? 'Ingresos por recibir' : 'Gastos por pagar'}</div>
          <div className="cabecera-cifra-valor">{formatearPesos(total)}</div>
        </Deslizar>
        <Segmentado opciones={TIPOS} valor={tipo} etiqueta="Tipo de pendiente" alCambiar={setTipo} />
      </CabeceraFormulario>

      <Deslizar posicion={[anio * 12 + mes, posicion]} className="pendientes-lista">
        {!datos.cargando && porDia.length === 0 && (
          <div className="tarjeta vacio">
            No tienes {tipo === 'ingreso' ? 'ingresos' : 'gastos'} pendientes en {nombreDelMes}.
          </div>
        )}
        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <div key={m.id} className="pendientes-fila">
                  <FilaMovimiento
                    movimiento={m}
                    detalle={
                      m.futuro ? (
                        <>
                          <IconoRepetir />
                          {textoFrecuencia(frecuenciaDe(m.programadoId))}
                          {m.tarjetaId ? ` · ${datos.tarjeta(m.tarjetaId)?.nombre ?? 'Tarjeta'}` : ''}
                        </>
                      ) : (
                        detalleMovimiento(m, datos)
                      )
                    }
                    estado="pendiente"
                    alTocar={() => abrir(m)}
                  />
                  {/* La flecha: marcar como pagado (o recibido), con confirmación; en una fecha de un
                      recurrente que aún no es movimiento, abre el programado. */}
                  <button
                    type="button"
                    className={'pendientes-marcar ' + (tipo === 'ingreso' ? 'ingreso' : 'gasto')}
                    aria-label={m.futuro ? 'Ver programado' : tipo === 'ingreso' ? 'Marcar como recibido' : 'Marcar como pagado'}
                    onClick={() => abrir(m)}
                  >
                    <IconoFlecha tamano={18} grosor={2.4} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </Deslizar>

      <PanelConfirmarPago movimiento={porConfirmar} abierto={panel} alCerrar={() => setPanel(false)} />
      <PanelProgramado
        programado={datos.programados.find((p) => p.id === abierto.id)}
        ocurrencia={abierto.ocurrencia}
        abierto={panelProgramado}
        alCerrar={() => setPanelProgramado(false)}
      />
    </div>
  );
}
