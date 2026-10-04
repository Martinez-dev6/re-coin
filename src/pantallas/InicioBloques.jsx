// Bloques de Inicio que se activan en Mi espacio → Pantalla de inicio: Balance del mes,
// Presupuestos, Metas, Gráfico del mes y Tarjetas de crédito. No están en los diseños: son
// versiones cortas de lo que hay en Rendimiento, Planes, Gráficos y Tarjetas, con "Ver todo" para
// ir allá. pesos: formato de las
// cifras (respeta el ojo de Inicio).
import { useNavigate } from 'react-router-dom';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaPresupuesto from '../componentes/FilaPresupuesto.jsx';
import { Dona } from '../componentes/Graficos.jsx';
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

// Balance del mes (pedido del dueño, 2026-10-04): ingresos − gastos, cuánto se ahorró y una barra
// por cada uno, del largo de su cifra frente a la mayor. Los mismos totales del banner (pagados y
// pendientes, sin transferencias). Toda la tarjeta lleva a Rendimiento. ocultos: el ojo de Inicio.
export function BloqueBalance({ pesos, ocultos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes } = useDatos();
  const ingresos = totalDelMes(movimientosPorMes, 'ingreso', textoMes(anio, mes));
  const gastos = totalDelMes(movimientosPorMes, 'gasto', textoMes(anio, mes));
  const balance = ingresos - gastos;
  const mayor = Math.max(ingresos, gastos);
  const signo = ocultos || balance === 0 ? '' : balance < 0 ? '- ' : '+ ';
  const verRendimiento = () => navegar('/mi-espacio/rendimiento');

  let nota = `Sin ingresos ni gastos en ${nombreMes(mes, false)}.`;
  if (ingresos > 0 && balance >= 0) nota = `Ahorraste el ${porcentaje(balance, ingresos)} % de tus ingresos`;
  else if (balance < 0) nota = `Gastaste ${pesos(-balance)} más de lo que entró`;

  const filas = [
    { nombre: 'Ingresos', valor: ingresos, color: 'var(--income)' },
    { nombre: 'Gastos', valor: gastos, color: 'var(--expense)' },
  ];

  return (
    <>
      <Cabeza titulo="Balance del mes" enlace="Ver rendimiento" alTocar={verRendimiento} />
      <Deslizar
        as="button"
        type="button"
        posicion={posicion}
        className="tarjeta inicio-balance inicio-bloque-cuerpo"
        onClick={verRendimiento}
      >
        <span className="inicio-balance-etiqueta">Balance de {nombreMes(mes, false)}</span>
        <strong className={'inicio-balance-valor' + (balance < 0 ? ' negativo' : balance > 0 ? ' positivo' : '')}>
          {signo}
          {pesos(Math.abs(balance))}
        </strong>
        <span className="inicio-balance-nota">{nota}</span>
        {filas.map(({ nombre, valor, color }) => (
          <span key={nombre} className="inicio-balance-fila">
            <span className="inicio-balance-linea">
              <span>{nombre}</span>
              <strong>{pesos(valor)}</strong>
            </span>
            <span className="barra-progreso">
              <span style={{ width: `${porcentaje(valor, mayor)}%`, background: color }} />
            </span>
          </span>
        ))}
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

// Gastos del mes por categoría: la dona pequeña y la leyenda. Toda la tarjeta lleva a Gráficos
// (pedido del dueño, 2026-10-04: cada cosa de Inicio debe llevar a su sección); allá se toca cada
// parte para ver su valor.
export function BloqueGrafico({ pesos, posicion }) {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { movimientosPorMes, categoria } = useDatos();
  const { total, partes } = porCategoria(movimientosPorMes, categoria, 'gasto', textoMes(anio, mes));
  const verGraficos = () => navegar('/mi-espacio/graficos');

  return (
    <>
      <Cabeza titulo="Gastos del mes" enlace="Ver gráficos" alTocar={verGraficos} />
      <Deslizar
        as="button"
        type="button"
        posicion={posicion}
        className="tarjeta inicio-grafico inicio-bloque-cuerpo"
        aria-label={`Gastos de ${nombreMes(mes, false)}: ver gráficos`}
        onClick={verGraficos}
      >
        <Dona
          partes={partes}
          elegida={null}
          etiqueta={`Gastos de ${nombreMes(mes, false)} por categoría`}
          centro={<strong className="inicio-grafico-total">{pesos(total)}</strong>}
        />
        {partes.length === 0 ? (
          <span className="inicio-grafico-vacio">Sin gastos en {nombreMes(mes, false)}.</span>
        ) : (
          <span className="inicio-grafico-leyenda">
            {partes.map((p) => (
              <span key={p.clave} className="inicio-grafico-fila">
                <i style={{ background: p.color }} />
                <span>{p.nombre}</span>
                <strong>{porcentaje(p.valor, total)} %</strong>
              </span>
            ))}
          </span>
        )}
      </Deslizar>
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
