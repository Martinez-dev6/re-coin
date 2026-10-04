// Gastos o ingresos pendientes del mes elegido en Inicio (/pendientes?tipo=gasto|ingreso). Se abre
// desde las tarjetas "Pendientes y alertas" de Inicio (pedido del dueño, 2026-10-03: antes llevaban
// a Transacciones). Sube como un formulario y se cierra con la X. No está en los diseños.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { CabeceraFormulario, Segmentado } from '../componentes/Formulario.jsx';
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
      <CabeceraFormulario titulo="Pendientes" volverA="/">
        <Deslizar posicion={posicion} distancia={16} className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">
            {tipo === 'ingreso' ? 'Ingresos' : 'Gastos'} por {tipo === 'ingreso' ? 'recibir' : 'pagar'} en {nombreDelMes}
          </div>
          <div className="cabecera-cifra-valor">{formatearPesos(total)}</div>
        </Deslizar>
        <Segmentado opciones={TIPOS} valor={tipo} etiqueta="Tipo de pendiente" alCambiar={setTipo} />
      </CabeceraFormulario>

      <Deslizar posicion={posicion} className="pendientes-lista">
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
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalleMovimiento(m, datos)}
                  estado="pendiente"
                  alTocar={() => navegar(rutaMovimiento(m))}
                />
              ))}
            </div>
          </section>
        ))}
      </Deslizar>
    </div>
  );
}
