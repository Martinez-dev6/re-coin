// Bloques de Inicio que se activan en Mi espacio → Pantalla de inicio: Balance del mes,
// Presupuestos, Metas, Gráfico del mes y Tarjetas de crédito. No están en los diseños: son
// versiones cortas de lo que hay en Rendimiento, Planes, Gráficos y Tarjetas, con "Ver todo" para
// ir allá. pesos: formato de las
// cifras (respeta el ojo de Inicio).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaPresupuesto from '../componentes/FilaPresupuesto.jsx';
import { Dona } from '../componentes/Graficos.jsx';
import {
  IconoBajada,
  IconoBalanza,
  IconoBilletera,
  IconoCalendarioMes,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoHoja,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { porCategoria, textoMes, totalDelMes } from '../datos/graficos.js';
import { presupuestosDelMes } from '../datos/presupuestos.js';
import { proximaFactura, textoVence } from '../datos/tarjetas.js';
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

// Balance del mes (pedido del dueño, 2026-10-04; estilo nuevo el mismo día, a partir de una imagen):
// la cabeza de los bloques (título y "Ver rendimiento"); dentro, "Balance de <mes>", la cifra grande con su ícono, y abajo ingresos, gastos y cuánto se ahorró.
// El tono de la tarjeta sigue al balance: verde si quedó a favor, rojo si se gastó más de lo que
// entró y ámbar si quedó parejo (o no hay movimientos). Los mismos totales del banner (pagados y
// pendientes, sin transferencias). Toda la tarjeta lleva a Rendimiento. ocultos: el ojo de Inicio.
const TONOS = {
  positivo: { Icono: IconoHoja, titulo: 'Balance positivo' },
  negativo: { Icono: IconoBajada, titulo: 'Balance negativo' },
  parejo: { Icono: IconoBalanza, titulo: 'Balance parejo' },
};

export function BloqueBalance({ pesos, ocultos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes } = useDatos();
  const ingresos = totalDelMes(movimientosPorMes, 'ingreso', textoMes(anio, mes));
  const gastos = totalDelMes(movimientosPorMes, 'gasto', textoMes(anio, mes));
  const balance = ingresos - gastos;
  const tono = balance > 0 ? 'positivo' : balance < 0 ? 'negativo' : 'parejo';
  const { Icono } = TONOS[tono];
  const sinMovimientos = ingresos === 0 && gastos === 0;
  const titulo = sinMovimientos ? 'Sin movimientos este mes' : TONOS[tono].titulo;
  const signo = ocultos || balance === 0 ? '' : balance < 0 ? '-' : '+';

  // Lo que va en el recuadro de la derecha: cuánto se ahorró o cuánto se pasó, frente a lo que entró.
  let cifra = `${porcentaje(Math.abs(balance), ingresos)} %`;
  let nota = tono === 'negativo' ? 'de más' : 'ahorrado';
  if (ingresos === 0 && !sinMovimientos) [cifra, nota] = ['—', 'sin ingresos'];

  // Con cifras largas (millones) no caben las tres columnas en un iPhone: el recuadro de ahorro
  // baja a su propia fila, y la cifra grande se achica un poco.
  const largo = Math.max(pesos(ingresos).length, pesos(gastos).length) > 10;
  const cifraLarga = pesos(Math.abs(balance)).length > 10;

  const verRendimiento = () => navegar('/mi-espacio/rendimiento');

  return (
    <>
      <Cabeza titulo="Balance del mes" enlace="Ver rendimiento" alTocar={verRendimiento} />
      <Deslizar
        as="button"
        type="button"
        posicion={posicion}
        className={
          `tarjeta inicio-balance inicio-bloque-cuerpo ${tono}` + (largo ? ' largo' : '') + (cifraLarga ? ' cifra-larga' : '')
        }
        onClick={verRendimiento}
      >
        <span className="inicio-balance-cabeza">
          <IconoCalendarioMes className="inicio-balance-calendario" />
          <strong className="inicio-balance-titulo">Balance de {nombreMes(mes, false)}</strong>
        </span>

        <span className="inicio-balance-centro">
          <span className="inicio-balance-icono">
            <IconoBilletera tamano={26} />
          </span>
          <span className="inicio-balance-cifra">
            <strong>
              {signo}
              {pesos(Math.abs(balance))}
            </strong>
            <span>{titulo}</span>
          </span>
        </span>

        <span className="inicio-balance-pie">
          <span className="inicio-balance-dato">
            <span className="inicio-balance-dato-nombre">
              <IconoFlechaArriba tamano={16} className="ingreso" />
              Ingresos
            </span>
            <strong>{pesos(ingresos)}</strong>
          </span>
          <span className="inicio-balance-dato">
            <span className="inicio-balance-dato-nombre">
              <IconoFlechaAbajo tamano={16} className="gasto" />
              Gastos
            </span>
            <strong>{pesos(gastos)}</strong>
          </span>
          <span className="inicio-balance-ahorro">
            <span className="inicio-balance-ahorro-cifra">
              <Icono tamano={18} />
              <strong>{cifra}</strong>
            </span>
            <span>{nota}</span>
          </span>
        </span>
      </Deslizar>
    </>
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

// Gastos del mes (rediseño pedido por el dueño, 2026-10-04): la dona con el total en el centro y,
// debajo, un carrusel con una categoría por tarjeta (las mismas partes de la dona: 4 y "Otros").
// La que queda al centro del carrusel se resalta en la dona; tocar un trozo de la dona o un punto
// lleva el carrusel a esa categoría. El carrusel es un scroll horizontal con scroll-snap: así el
// deslizamiento es el del sistema (inercia y freno de iOS), sin animaciones hechas a mano.
export function BloqueGrafico({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes, categoria } = useDatos();
  const { total, partes } = porCategoria(movimientosPorMes, categoria, 'gasto', textoMes(anio, mes));
  const verGraficos = () => navegar('/mi-espacio/graficos');

  return (
    <>
      <Cabeza titulo="Gastos del mes" enlace="Ver gráficos" alTocar={verGraficos} />
      <Deslizar posicion={posicion} className="tarjeta inicio-grafico inicio-bloque-cuerpo">
        {partes.length === 0 ? (
          <span className="inicio-grafico-vacio">Sin gastos en {nombreMes(mes, false)}.</span>
        ) : (
          // key: al cambiar de mes el carrusel vuelve a la primera categoría.
          <CarruselGastos key={textoMes(anio, mes)} partes={partes} total={total} pesos={pesos} mes={mes} />
        )}
      </Deslizar>
    </>
  );
}

function CarruselGastos({ partes, total, pesos, mes }) {
  const { categoria } = useDatos();
  const [indice, setIndice] = useState(0);
  const pista = useRef(null);
  const cuadro = useRef(0);
  const elegida = partes[Math.min(indice, partes.length - 1)];

  // El índice sale de la tarjeta más cercana al centro de la pista (una vez por cuadro).
  const alDesplazar = () => {
    cancelAnimationFrame(cuadro.current);
    cuadro.current = requestAnimationFrame(() => {
      const el = pista.current;
      if (!el) return;
      const centro = el.scrollLeft + el.clientWidth / 2;
      let cercana = 0;
      let distancia = Infinity;
      [...el.children].forEach((hijo, i) => {
        const d = Math.abs(hijo.offsetLeft + hijo.offsetWidth / 2 - centro);
        if (d < distancia) [cercana, distancia] = [i, d];
      });
      setIndice(cercana);
    });
  };
  useEffect(() => () => cancelAnimationFrame(cuadro.current), []);

  const ir = (i) => {
    const el = pista.current;
    const hijo = el?.children[i];
    if (!hijo) return;
    el.scrollTo({ left: hijo.offsetLeft - (el.clientWidth - hijo.offsetWidth) / 2, behavior: 'smooth' });
  };

  return (
    <>
      <Dona
        partes={partes}
        elegida={partes.length > 1 ? elegida.clave : null}
        alElegir={(clave) => clave && ir(partes.findIndex((p) => p.clave === clave))}
        etiqueta={`Gastos de ${nombreMes(mes, false)} por categoría`}
        centro={
          <>
            <strong className="inicio-grafico-total">{pesos(total)}</strong>
            <span className="inicio-grafico-centro-nota">Total de gastos</span>
          </>
        }
      />
      <span className="inicio-grafico-linea" />
      <div
        ref={pista}
        className={'inicio-carrusel' + (partes.length === 1 ? ' unica' : '')}
        onScroll={alDesplazar}
        aria-label="Categorías"
      >
        {partes.map((p, i) => {
          const c = categoria(p.clave);
          return (
            <button
              key={p.clave}
              type="button"
              className={'inicio-carrusel-item' + (i === indice ? ' activa' : '')}
              style={{ '--color-parte': p.color }}
              aria-current={i === indice || undefined}
              onClick={() => (i === indice ? null : ir(i))}
            >
              <CirculoCategoria icono={c?.icono ?? 'cuadricula'} color={c?.color ?? null} talla="mediano" />
              <span className="inicio-carrusel-texto">
                <span className="inicio-carrusel-nombre">{p.nombre}</span>
                <strong className="inicio-carrusel-porcentaje">{porcentaje(p.valor, total)} %</strong>
                <span className="inicio-carrusel-valor">{pesos(p.valor)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {partes.length > 1 && (
        <span className="inicio-carrusel-puntos">
          {partes.map((p, i) => (
            <button
              key={p.clave}
              type="button"
              className={i === indice ? 'activo' : undefined}
              aria-label={p.nombre}
              onClick={() => ir(i)}
            />
          ))}
        </span>
      )}
    </>
  );
}

// Tarjetas de crédito: lo justo de cada una (lo que hay que pagar y cuándo). Toda la tarjeta del
// bloque lleva a Mi espacio → Tarjetas de crédito, como entrar desde el menú.
export function BloqueTarjetas({ pesos }) {
  const navegar = useNavigate();
  const { tarjetas } = useDatos();
  const verTarjetas = () => navegar('/mi-espacio/tarjetas');

  return (
    <>
      <Cabeza titulo="Tarjetas de crédito" enlace={tarjetas.length > 0 && 'Ver tarjetas'} alTocar={verTarjetas} />
      {tarjetas.length === 0 ? (
        <Vacio texto="Aún no tienes tarjetas." boton="Crear" alTocar={() => navegar('/tarjetas/nueva')} />
      ) : (
        <button type="button" className="tarjeta-lista inicio-bloque-cuerpo inicio-tarjetas" onClick={verTarjetas}>
          {tarjetas.map((t) => {
            const proxima = proximaFactura(t);
            const falta = proxima ? proxima.total - proxima.pagado : 0;
            const vence = proxima ? textoVence(t, proxima.mes) : null;
            const cuando = !vence
              ? 'Al día'
              : vence === 'Vencida'
                ? 'Vencida'
                : `Vence ${{ Hoy: 'hoy', Mañana: 'mañana' }[vence] ?? `en ${vence}`}`;
            return (
              <span key={t.id} className="inicio-tarjeta">
                <span className="icono-circulo grande">
                  <IconoPorNombre nombre={t.icono} tamano={20} />
                </span>
                <span className="inicio-tarjeta-textos">
                  <span className="inicio-tarjeta-nombre">{t.nombre}</span>
                  <span className={'inicio-tarjeta-vence' + (vence === 'Vencida' ? ' vencida' : vence ? ' pendiente' : '')}>
                    {cuando}
                  </span>
                </span>
                <span className="inicio-tarjeta-cifras">
                  <strong>{pesos(proxima ? falta : Math.max(0, t.cupo - t.usado))}</strong>
                  <span>{proxima ? 'por pagar' : 'disponible'}</span>
                </span>
              </span>
            );
          })}
        </button>
      )}
    </>
  );
}
