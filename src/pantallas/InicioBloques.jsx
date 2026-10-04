// Bloques de Inicio que se activan en Mi espacio → Pantalla de inicio: Presupuestos, Metas y
// Gráfico del mes. No están en los diseños: son versiones cortas de lo que hay en Planes y en
// Gráficos, con "Ver todo" para ir allá. pesos: formato de las cifras (respeta el ojo de Inicio).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaPresupuesto from '../componentes/FilaPresupuesto.jsx';
import { Dona } from '../componentes/Graficos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { porCategoria, textoMes } from '../datos/graficos.js';
import { presupuestosDelMes } from '../datos/presupuestos.js';
import { useMes } from '../estado/MesContext.jsx';
import { nombreMes } from '../utilidades/fechas.js';

const MAXIMO = 3; // filas por bloque; el resto, en "Ver todos"
const porcentaje = (parte, todo) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

function Cabeza({ titulo, enlace, alTocar }) {
  return (
    <div className="inicio-bloque-cabeza">
      <h2 className="inicio-titulo">{titulo}</h2>
      {enlace && (
        <button type="button" className="boton-texto inicio-bloque-enlace" onClick={alTocar}>
          {enlace}
        </button>
      )}
    </div>
  );
}

function Vacio({ texto, boton, alTocar }) {
  return (
    <div className="tarjeta inicio-bloque-vacio">
      <span>{texto}</span>
      <button type="button" className="boton-texto" onClick={alTocar}>
        {boton}
      </button>
    </div>
  );
}

// General y los que más se han usado este mes.
export function BloquePresupuestos({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { presupuestos, movimientosPorMes, categoria } = useDatos();
  const lista = presupuestosDelMes(presupuestos, movimientosPorMes, anio, mes);
  const masUsados = [...lista].sort((a, b) => b.usado - a.usado).slice(0, MAXIMO);
  const gastado = lista.reduce((t, p) => t + p.gastado, 0);
  const limite = lista.reduce((t, p) => t + p.limite, 0);

  return (
    <>
      <Cabeza
        titulo="Presupuestos"
        enlace={lista.length > 0 && 'Ver todos'}
        alTocar={() => navegar('/planes/presupuestos')}
      />
      <Deslizar posicion={posicion} className="inicio-bloque-cuerpo">
        {lista.length === 0 ? (
          <Vacio
            texto={`Sin presupuestos en ${nombreMes(mes, false)}.`}
            boton="Crear"
            alTocar={() => navegar('/presupuestos/nuevo')}
          />
        ) : (
          <div className="tarjeta-lista">
            {lista.length > 1 && (
              <FilaPresupuesto nombre="General" icono="pastel" color="acento" gastado={gastado} limite={limite} pesos={pesos} />
            )}
            {masUsados.map((p) => {
              const c = categoria(p.categoriaId);
              return (
                <FilaPresupuesto
                  key={p.id}
                  nombre={c?.nombre ?? 'Sin categoría'}
                  icono={c?.icono}
                  color={c?.color}
                  gastado={p.gastado}
                  limite={p.limite}
                  avisarAl={p.avisarAl}
                  pesos={pesos}
                  alTocar={() => navegar('/presupuestos/' + p.id)}
                />
              );
            })}
          </div>
        )}
      </Deslizar>
    </>
  );
}

// Las metas en su orden (las primeras), con su avance.
export function BloqueMetas({ pesos }) {
  const navegar = useNavigate();
  const { metas } = useDatos();

  return (
    <>
      <Cabeza titulo="Metas" enlace={metas.length > 0 && 'Ver todas'} alTocar={() => navegar('/planes/metas')} />
      {metas.length === 0 ? (
        <Vacio texto="Aún no tienes metas de ahorro." boton="Crear" alTocar={() => navegar('/metas/nueva')} />
      ) : (
        <div className="tarjeta-lista inicio-bloque-cuerpo">
          {metas.slice(0, MAXIMO).map((m) => {
            const avance = porcentaje(m.ahorrado, m.objetivo);
            return (
              <button key={m.id} type="button" className="inicio-meta" onClick={() => navegar('/metas/' + m.id)}>
                <CirculoCategoria icono={m.icono} color="acento" />
                <span className="inicio-meta-cuerpo">
                  <span className="inicio-meta-linea">
                    <span className="inicio-meta-nombre">{m.nombre}</span>
                    <strong>{avance} %</strong>
                  </span>
                  <span className="barra-progreso inicio-meta-barra">
                    <span style={{ width: `${Math.min(avance, 100)}%` }} />
                  </span>
                  <span className="inicio-meta-cifras">
                    {pesos(m.ahorrado)} de {pesos(m.objetivo)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

// Gastos del mes por categoría: la dona pequeña y la leyenda; tocar una parte la resalta.
export function BloqueGrafico({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes, categoria } = useDatos();
  const { total, partes } = porCategoria(movimientosPorMes, categoria, 'gasto', textoMes(anio, mes));
  const [parte, setParte] = useState(null);

  return (
    <>
      <Cabeza titulo="Gastos del mes" enlace="Ver gráficos" alTocar={() => navegar('/mi-espacio/graficos')} />
      <Deslizar posicion={posicion} className="tarjeta inicio-grafico inicio-bloque-cuerpo">
        <Dona
          partes={partes}
          elegida={parte}
          alElegir={setParte}
          etiqueta={`Gastos de ${nombreMes(mes, false)} por categoría`}
          centro={<strong className="inicio-grafico-total">{pesos(total)}</strong>}
        />
        {partes.length === 0 ? (
          <p className="inicio-grafico-vacio">Sin gastos en {nombreMes(mes, false)}.</p>
        ) : (
          <div className="inicio-grafico-leyenda">
            {partes.map((p) => (
              <button
                key={p.clave}
                type="button"
                className={'inicio-grafico-fila' + (parte && parte !== p.clave ? ' apagada' : '')}
                aria-pressed={parte === p.clave}
                onClick={() => setParte(parte === p.clave ? null : p.clave)}
              >
                <i style={{ background: p.color }} />
                <span>{p.nombre}</span>
                <strong>{porcentaje(p.valor, total)} %</strong>
              </button>
            ))}
          </div>
        )}
      </Deslizar>
    </>
  );
}
