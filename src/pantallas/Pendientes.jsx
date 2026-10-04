// Gastos o ingresos pendientes de un mes (/pendientes?tipo=gasto|ingreso): el mes elegido en
// Inicio, que se cambia con las flechas de arriba. Se abre desde las tarjetas "Pendientes y
// alertas" de Inicio (pedido del dueño, 2026-10-03: antes llevaban a Transacciones). Sube como un
// formulario y se cierra con la X. No está en los diseños. La flecha de cada fila abre el panel para
// marcarlo como pagado (PanelConfirmarPago); antes era un chulito, y el dueño pidió una flecha simple
// (2026-10-04): el chulo queda para la animación de "listo" al confirmar.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { CabeceraFormulario, Segmentado } from '../componentes/Formulario.jsx';
import { IconoFlecha } from '../componentes/iconos.jsx';
import PanelConfirmarPago from '../componentes/PanelConfirmarPago.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { detalleMovimiento, esGasto, rutaMovimiento } from '../datos/movimientos.js';
import { useMes } from '../estado/MesContext.jsx';
import { enMes, etiquetaDia, nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Pendientes.css';

const TIPOS = [
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
];

export default function Pendientes() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [tipo, setTipo] = useState(parametros.get('tipo') === 'ingreso' ? 'ingreso' : 'gasto');
  const { anio, mes } = useMes();
  const datos = useDatos();
  // El pendiente que se va a confirmar; se queda mientras el panel baja.
  const [porConfirmar, setPorConfirmar] = useState(null);
  const [panel, setPanel] = useState(false);

  // Del mes, sin pagar; los gastos incluyen las cuotas de tarjeta que vencen en él.
  const pendientes = datos.movimientosPorMes
    .filter((m) => enMes(m.fecha, anio, mes) && !m.pagado && (tipo === 'ingreso' ? m.tipo === 'ingreso' : esGasto(m)))
    // Lo más próximo primero.
    .reverse();
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
                    detalle={detalleMovimiento(m, datos)}
                    estado="pendiente"
                    alTocar={() => navegar(rutaMovimiento(m))}
                  />
                  {/* La flecha: marcar como pagado (o recibido), con confirmación. */}
                  <button
                    type="button"
                    className="pendientes-marcar"
                    aria-label={tipo === 'ingreso' ? 'Marcar como recibido' : 'Marcar como pagado'}
                    onClick={() => {
                      setPorConfirmar(m);
                      setPanel(true);
                    }}
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
    </div>
  );
}
