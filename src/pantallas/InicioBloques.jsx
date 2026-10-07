// Bloques de Inicio que se activan en Mi espacio → Pantalla de inicio: Balance del mes,
// Presupuestos, Metas, Gráfico del mes y Tarjetas de crédito. No están en los diseños: son
// versiones cortas de lo que hay en Rendimiento, Planes, Gráficos y Tarjetas, con "Ver todo" para
// ir allá. pesos: formato de las
// cifras (respeta el ojo de Inicio).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaPresupuesto from '../componentes/FilaPresupuesto.jsx';
import {
  IconoBajada,
  IconoBalanza,
  IconoCaraFeliz,
  IconoCaraNormal,
  IconoCaraTriste,
  IconoCalendarioMes,
  IconoFlechaAbajo,
  IconoFlecha,
  IconoFlechaArriba,
  IconoHoja,
} from '../componentes/iconos.jsx';
import { Dona } from '../componentes/Graficos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { conProgramados, programadosDelMes } from '../datos/programados.js';
import { porCategoria, textoMes, totalDelMes } from '../datos/graficos.js';
import { periodoActual, presupuestosDelMes } from '../datos/presupuestos.js';
import { proximaFactura, textoVence } from '../datos/tarjetas.js';
import { useMes } from '../estado/MesContext.jsx';
import { estiloIconoCuenta } from '../tema/colores.js';
import { nombreMes } from '../utilidades/fechas.js';
import { abrirVentana } from '../estado/ventanas.js';

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

// Balance del mes. Sesión 9 (pedido del dueño, con una imagen de referencia: "opción 2" apilada):
// una sola tarjeta con dos balances, para verlo con pendientes y sin ellos a la vez.
// - Arriba, en un recuadro de su color, "Balance actual · En vivo": solo lo ya pagado o recibido
//   (primero, pedido del dueño).
// - Abajo, "Balance proyectado": todo lo del mes, pagado y pendiente (también lo programado que ya
//   quedó registrado como pendiente), como los totales del banner. Con ingresos, gastos y un aviso
//   de cuánto se ahorra o cuánto se pasa frente a lo que entra.
// Cada uno con su tono: verde a favor, rojo en contra y ámbar parejo. Sin transferencias. Toda la
// tarjeta lleva a Rendimiento. ocultos: el ojo de Inicio.
const TONOS = { positivo: 'Balance positivo', negativo: 'Balance negativo', parejo: 'Balance parejo' };

function resumenBalance(movimientos, mesTexto) {
  const ingresos = totalDelMes(movimientos, 'ingreso', mesTexto);
  const gastos = totalDelMes(movimientos, 'gasto', mesTexto);
  const balance = ingresos - gastos;
  const tono = balance > 0 ? 'positivo' : balance < 0 ? 'negativo' : 'parejo';
  return { ingresos, gastos, balance, tono };
}

export function BloqueBalance({ pesos, ocultos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes, programados, tarjeta } = useDatos();
  const mesTexto = textoMes(anio, mes);
  // El proyectado suma, en los meses siguientes, las fechas de los recurrentes que aún no son
  // movimientos (Sesión 10, como el saldo estimado del banner).
  const proyectado = resumenBalance([...movimientosPorMes, ...programadosDelMes(programados, tarjeta, anio, mes)], mesTexto);
  const actual = resumenBalance(
    movimientosPorMes.filter((m) => m.pagado),
    mesTexto,
  );
  const sinMovimientos = proyectado.ingresos === 0 && proyectado.gastos === 0;
  const conSigno = ({ balance }) =>
    (ocultos || balance === 0 ? '' : balance < 0 ? '-' : '+') + pesos(Math.abs(balance));

  // El aviso de abajo: cuánto se ahorra de lo que entra, o cuánto más se gasta.
  const { ingresos, gastos, balance, tono } = proyectado;
  let aviso = `${porcentaje(Math.abs(balance), ingresos)} %`;
  let notaAviso = tono === 'negativo' ? 'más gastos que ingresos' : 'de tus ingresos ahorrado';
  if (ingresos === 0 && !sinMovimientos) [aviso, notaAviso] = ['', 'Sin ingresos este mes'];
  const IconoAviso = tono === 'negativo' ? IconoBajada : tono === 'positivo' ? IconoHoja : IconoBalanza;
  const IconoCara = tono === 'negativo' ? IconoCaraTriste : tono === 'positivo' ? IconoCaraFeliz : IconoCaraNormal;

  // Con cifras largas (millones) se achican un poco para que quepan en un iPhone.
  const cifraLarga = conSigno(proyectado).length > 10;
  const vivoLargo = conSigno(actual).length > 10 || Math.max(pesos(actual.ingresos).length, pesos(actual.gastos).length) > 10;
  const verRendimiento = () => navegar('/mi-espacio/rendimiento');

  return (
    <>
      <Cabeza titulo="Balance del mes" enlace="Ver rendimiento" alTocar={verRendimiento} />
      <Deslizar
        as="button"
        type="button"
        posicion={posicion}
        className={`tarjeta inicio-balance inicio-bloque-cuerpo ${tono}` + (cifraLarga ? ' cifra-larga' : '')}
        onClick={verRendimiento}
      >
        <span className={`inicio-balance-vivo ${actual.tono}` + (vivoLargo ? ' largo' : '')}>
          <span className="inicio-balance-vivo-textos">
            <span className="inicio-balance-vivo-cabeza">
              <span className="inicio-balance-vivo-punto" />
              En vivo
            </span>
            <span className="inicio-balance-vivo-titulo">Balance actual</span>
            <strong className="inicio-balance-vivo-cifra">{conSigno(actual)}</strong>
            <span className="inicio-balance-vivo-nota">Sin pendientes</span>
          </span>
          <span className="inicio-balance-vivo-datos">
            <span>
              <IconoFlechaArriba tamano={14} className="ingreso" />
              {pesos(actual.ingresos)}
            </span>
            <span>
              <IconoFlechaAbajo tamano={14} className="gasto" />
              {pesos(actual.gastos)}
            </span>
          </span>
        </span>
        <span className="inicio-balance-cabeza">
          <IconoCalendarioMes className="inicio-balance-calendario" />
          <span className="inicio-balance-titulos">
            <strong className="inicio-balance-titulo">Balance proyectado de {nombreMes(mes, false)}</strong>
            <span className="inicio-balance-subtitulo">Con pendientes y programados</span>
          </span>
          <span className="inicio-balance-etiqueta">Planificado</span>
        </span>

        <span className="inicio-balance-centro">
          <span className="inicio-balance-icono">
            <IconoCara tamano={28} />
          </span>
          <span className="inicio-balance-cifra">
            <strong>{conSigno(proyectado)}</strong>
            <span>{sinMovimientos ? 'Sin movimientos este mes' : TONOS[tono]}</span>
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
        </span>

        {!sinMovimientos && (
          <span className="inicio-balance-aviso">
            <IconoAviso tamano={18} />
            {aviso && <strong>{aviso}</strong>}
            <span>{notaAviso}</span>
          </span>
        )}

      </Deslizar>
    </>
  );
}

// General y los que más se han usado este mes.
export function BloquePresupuestos({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const datos = useDatos();
  const { presupuestos, categoria } = datos;
  // En los meses siguientes, también las fechas de los recurrentes (Sesión 10).
  const lista = presupuestosDelMes(presupuestos, conProgramados(datos, [textoMes(anio, mes)]), anio, mes);
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
                  periodo={periodoActual(p)}
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

// Gastos del mes (rediseño pedido por el dueño, 2026-10-04, con una imagen de referencia): arriba
// el total y una dona pequeña con el % y el nombre de la categoría elegida (de entrada, la mayor);
// abajo las categorías (hasta 5, de la mayor a la menor) en una fila que se desliza de lado, dos a
// la vez. Tocar una categoría la resalta en la dona (otra vez, la suelta); tocar la dona o el total
// lleva a Gráficos. Deslizar la fila no cuenta como toque. Si hay más de 5, al final de la fila va
// "Otros" con una flecha: junta las demás y lleva a Gráficos, donde se ven todas (Sesión 9).
const MAXIMO_CATEGORIAS = 5;

export function BloqueGrafico({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const datos = useDatos();
  const { categoria } = datos;
  // En los meses siguientes, también las fechas de los recurrentes (Sesión 10, pedido del dueño).
  const { total, todas } = porCategoria(conProgramados(datos, [textoMes(anio, mes)]), categoria, 'gasto', textoMes(anio, mes));

  return (
    <>
      <Cabeza titulo="Gastos del mes" enlace="Ver gráficos" alTocar={() => navegar('/mi-espacio/graficos')} />
      <Deslizar posicion={posicion} className={'tarjeta inicio-grafico inicio-bloque-cuerpo' + (todas.length ? '' : ' vacio')}>
        {todas.length === 0 ? (
          <span className="inicio-grafico-vacio">Sin gastos en {nombreMes(mes, false)}.</span>
        ) : (
          // key: al cambiar de mes se suelta la categoría elegida y la fila vuelve al principio.
          <GastosDelMes key={textoMes(anio, mes)} todas={todas} total={total} pesos={pesos} mes={mes} />
        )}
      </Deslizar>
    </>
  );
}

function GastosDelMes({ todas, total, pesos, mes }) {
  const navegar = useNavigate();
  const { categoria } = useDatos();
  const [elegida, setElegida] = useState(null);
  const verGraficos = () => navegar('/mi-espacio/graficos');
  const visibles = todas.slice(0, MAXIMO_CATEGORIAS);
  // En la dona, lo que no sale en la fila va junto en gris.
  const resto = todas.slice(MAXIMO_CATEGORIAS).reduce((t, p) => t + p.valor, 0);
  // Si ya se ve una categoría llamada "Otros", el grupo se llama "Resto" (como en graficos.js).
  const nombreResto = visibles.some((p) => p.nombre.trim().toLowerCase() === 'otros') ? 'Resto' : 'Otros';
  const otros = { clave: 'otros-grupo', nombre: nombreResto, valor: resto, color: 'var(--ch-other)' };
  const partes = resto > 0 ? [...visibles, otros] : visibles;
  const centro = visibles.find((p) => p.clave === elegida) ?? visibles[0];
  const icono = (clave) => categoria(clave)?.icono ?? 'cuadricula';

  return (
    <>
      <button type="button" className="inicio-grafico-arriba" onClick={verGraficos}>
        <span className="inicio-grafico-textos">
          <span className="inicio-grafico-etiqueta">Total de {nombreMes(mes, false)}</span>
          <strong className={'inicio-grafico-total' + (pesos(total).length > 11 ? ' largo' : '')}>{pesos(total)}</strong>
          <span className="inicio-grafico-nota">{todas.length === 1 ? 'En 1 categoría' : `En ${todas.length} categorías`}</span>
        </span>
        <span className="inicio-grafico-dona">
          <Dona
            partes={partes}
            elegida={elegida}
            etiqueta={`Gastos de ${nombreMes(mes, false)} por categoría`}
            centro={
              <>
                <strong className="inicio-grafico-dona-porcentaje">{porcentaje(centro.valor, total)} %</strong>
                <span className="inicio-grafico-dona-nombre">{centro.nombre}</span>
              </>
            }
          />
        </span>
      </button>
      <span className="inicio-grafico-linea" />
      <div className="inicio-carrusel" role="radiogroup" aria-label="Resaltar una categoría">
        {visibles.map((p) => (
          <button
            key={p.clave}
            type="button"
            role="radio"
            aria-checked={elegida === p.clave}
            className={'inicio-carrusel-item' + (elegida === p.clave ? ' elegida' : '')}
            onClick={() => setElegida((e) => (e === p.clave ? null : p.clave))}
          >
            <CirculoCategoria icono={icono(p.clave)} color={categoria(p.clave)?.color ?? null} talla="mediano" />
            <span className="inicio-carrusel-texto">
              <span className="inicio-carrusel-nombre">{p.nombre}</span>
              <strong className="inicio-carrusel-porcentaje">{porcentaje(p.valor, total)} %</strong>
              <span className="inicio-carrusel-valor">{pesos(p.valor)}</span>
            </span>
          </button>
        ))}
        {resto > 0 && (
          <button type="button" className="inicio-carrusel-item inicio-carrusel-otros" onClick={verGraficos}>
            <span className="inicio-carrusel-otros-icono">
              <IconoPorNombre nombre="cuadricula" tamano={20} />
            </span>
            <span className="inicio-carrusel-texto">
              <span className="inicio-carrusel-nombre">
                {otros.nombre}
                <IconoFlecha tamano={14} grosor={2.4} />
              </span>
              <strong className="inicio-carrusel-porcentaje">{porcentaje(resto, total)} %</strong>
              <span className="inicio-carrusel-valor">{pesos(resto)}</span>
            </span>
          </button>
        )}
      </div>
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
        <Vacio texto="Aún no tienes tarjetas." boton="Crear" alTocar={() => abrirVentana('tarjeta')} />
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
                <span className="icono-circulo grande" style={estiloIconoCuenta(t.color)}>
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
          {/* Última fila, como el Total de Cuentas (pedido del dueño): cupo disponible de todas, sin el cupo total. */}
          <span className="inicio-cuentas-total inicio-tarjetas-total">
            <span className="inicio-cuentas-total-titulo">Cupo disponible</span>
            <span className="inicio-tarjeta-cifras">
              <strong>{pesos(tarjetas.reduce((t, x) => t + Math.max(0, x.cupo - x.usado), 0))}</strong>
            </span>
          </span>
        </button>
      )}
    </>
  );
}
