// Gráficos (/mi-espacio/graficos): gastos o ingresos del mes por categoría y por mes.
// design/capturas/Graficos.png y GraficosIngresos.png. El mes es el elegido en Inicio y
// Transacciones; tocar una barra elige ese mes. Tocar un segmento o una fila de la leyenda muestra
// su valor en el centro.
import { useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import { Segmentado } from '../componentes/Formulario.jsx';
import { Barras, Dona } from '../componentes/Graficos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { mesCorto, porCategoria, textoMes, totalDelMes, ventanaDeMeses } from '../datos/graficos.js';
import { useMes } from '../estado/MesContext.jsx';
import { nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Graficos.css';

const TIPOS = [
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
];

export default function Graficos() {
  const { anio, mes, elegir } = useMes();
  const { movimientosPorMes, categoria } = useDatos();
  const [tipo, setTipo] = useState('gasto');
  const [parte, setParte] = useState(null);
  const elegido = textoMes(anio, mes);
  // Todas las categorías, cada una con su color, sin juntar las pequeñas en "Otros" (pedido del
  // dueño, Sesión 9: aquí se ven completas; "Otros" de Inicio trae a esta pantalla).
  const { total, cantidad, todas: partes } = porCategoria(movimientosPorMes, categoria, tipo, elegido);
  const tocada = partes.find((p) => p.clave === parte);
  const meses = ventanaDeMeses(elegido);
  const porcentaje = (valor) => (total > 0 ? Math.round((valor / total) * 100) : 0);
  const posicion = [TIPOS.findIndex((t) => t.valor === tipo), anio * 12 + mes];

  const cambiarTipo = (nuevo) => {
    setTipo(nuevo);
    setParte(null);
  };
  const elegirMes = (mesTexto) => {
    elegir(Number(mesTexto.slice(0, 4)), Number(mesTexto.slice(5)) - 1);
    setParte(null);
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Gráficos" volverA="/mi-espacio">
        <Segmentado opciones={TIPOS} valor={tipo} etiqueta="Gastos o ingresos" alCambiar={cambiarTipo} />
      </CabeceraSubpagina>

      <Deslizar posicion={posicion} className="contenido graficos-contenido">
        <div className="tarjeta graficos-tarjeta">
          <Dona
            partes={partes}
            elegida={parte}
            alElegir={setParte}
            etiqueta={`${tipo === 'ingreso' ? 'Ingresos' : 'Gastos'} de ${nombreMes(mes, false)} por categoría`}
            centro={
              tocada ? (
                <>
                  <span className="graficos-centro-etiqueta">{tocada.nombre}</span>
                  <strong className="graficos-centro-valor">{formatearPesos(tocada.valor)}</strong>
                  <span className="graficos-centro-detalle">{porcentaje(tocada.valor)} %</span>
                </>
              ) : (
                <>
                  <span className="graficos-centro-etiqueta">{nombreMes(mes)}</span>
                  <strong className="graficos-centro-valor">{formatearPesos(total)}</strong>
                  <span className="graficos-centro-detalle">
                    {cantidad === 1 ? '1 categoría' : `${cantidad} categorías`}
                  </span>
                </>
              )
            }
          />
          {/* La leyenda guarda al menos el alto de 5 filas: así, al cambiar de mes o de tipo, lo de
              abajo no sube ni baja con pocas categorías (pedido del dueño, 2026-10-04). Con más de
              5, crece. */}
          <div className="graficos-leyenda">
            {partes.length === 0 ? (
              <p className="graficos-vacio">
                Sin {tipo === 'ingreso' ? 'ingresos' : 'gastos'} en {nombreMes(mes, false)}.
              </p>
            ) : (
              partes.map((p) => (
                <button
                  key={p.clave}
                  type="button"
                  className={'graficos-leyenda-fila' + (parte && parte !== p.clave ? ' apagada' : '')}
                  aria-pressed={parte === p.clave}
                  onClick={() => setParte(parte === p.clave ? null : p.clave)}
                >
                  <i style={{ background: p.color }} />
                  <span className="graficos-leyenda-nombre">{p.nombre}</span>
                  <span className="graficos-leyenda-valor">{formatearPesos(p.valor)}</span>
                  <strong>{porcentaje(p.valor)} %</strong>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="tarjeta graficos-tarjeta">
          <div className="graficos-cabeza">
            <h2>{tipo === 'ingreso' ? 'Ingresos por mes' : 'Gastos por mes'}</h2>
            <span>Últimos 6 meses</span>
          </div>
          <Barras
            etiqueta={`${tipo === 'ingreso' ? 'Ingresos' : 'Gastos'} de los últimos 6 meses`}
            elegido={elegido}
            alElegir={elegirMes}
            grupos={meses.map((m) => ({
              clave: m,
              etiqueta: mesCorto(m),
              valores: [{ valor: totalDelMes(movimientosPorMes, tipo, m), color: 'var(--accent-text)' }],
            }))}
          />
          <p className="graficos-nota">Toca un mes para verlo.</p>
        </div>
      </Deslizar>
    </div>
  );
}
