import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import BotonExito from '../componentes/BotonExito.jsx';
import { abrirMenuNuevo } from '../componentes/BarraNavegacion.jsx';
import CifraAnimada from '../componentes/CifraAnimada.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import FilaPresupuesto from '../componentes/FilaPresupuesto.jsx';
import { Campo, EntradaPesos } from '../componentes/Formulario.jsx';
import {
  IconoCalendario,
  IconoCheck,
  IconoFlecha,
  IconoInicio,
  IconoMas,
  IconoRepetir,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import PanelProgramado from '../componentes/PanelProgramado.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { ahorroPorPeriodo, aportar, frecuenciaMeta } from '../datos/metas.js';
import { periodoActual, presupuestosDelMes } from '../datos/presupuestos.js';
import { detalleMovimiento, esGasto, estadoMovimiento, rutaMovimiento } from '../datos/movimientos.js';
import { programadosDelMes, terminado, textoFrecuencia } from '../datos/programados.js';
import { useAjustes } from '../estado/ajustes.js';
import { useMes } from '../estado/MesContext.jsx';
import { diasHasta, enMes, etiquetaDia, fechaCorta, hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Planes.css';
import './Transacciones.css';

// Calendario (antes "Programados") va de primero y es lo que abre /planes (pedido del dueño, Sesión 9):
// muestra todo lo del mes. No tiene "+": los programados se crean desde el formulario de un
// movimiento con "… recurrente" prendido, y cada día tiene su "+ Agregar".
const SECCIONES = [
  { valor: 'calendario', texto: 'Calendario', nuevo: null },
  { valor: 'presupuestos', texto: 'Presupuestos', nuevo: '/presupuestos/nuevo' },
  { valor: 'metas', texto: 'Metas', nuevo: '/metas/nueva' },
];

const porcentaje = (parte, todo) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

// ---------- Presupuestos ----------

function Presupuestos({ lista, navegar }) {
  const { categoria: buscarCategoria } = useDatos();
  if (lista.length === 0) {
    return (
      <div className="tarjeta vacio planes-vacio">
        <p>No hay presupuestos para este mes.</p>
        <button type="button" className="boton-principal" onClick={() => navegar('/presupuestos/nuevo')}>
          Crear presupuesto
        </button>
      </div>
    );
  }
  const gastado = lista.reduce((t, p) => t + p.gastado, 0);
  const limite = lista.reduce((t, p) => t + p.limite, 0);
  return (
    <div className="tarjeta-lista">
      <FilaPresupuesto nombre="General" icono="pastel" color="acento" gastado={gastado} limite={limite} />
      {lista.map((p) => {
        const categoria = buscarCategoria(p.categoriaId);
        return (
          <FilaPresupuesto
            key={p.id}
            nombre={categoria?.nombre ?? 'Sin categoría'}
            icono={categoria?.icono}
            color={categoria?.color}
            gastado={p.gastado}
            limite={p.limite}
            avisarAl={p.avisarAl}
            periodo={periodoActual(p)}
            alTocar={() => navegar('/presupuestos/' + p.id)}
          />
        );
      })}
    </div>
  );
}

// ---------- Metas ----------

function Metas({ metas, navegar, alAportar }) {
  const { semanaEmpieza } = useAjustes();
  // Cuánto ahorrar para llegar a tiempo, en la frecuencia de cada meta (o en otra, para General).
  const ahorroDe = (m, frecuencia = m.frecuencia) =>
    ahorroPorPeriodo(m.objetivo, m.ahorrado, m.fechaLimite, frecuenciaMeta(frecuencia).valor, semanaEmpieza);
  if (metas.length === 0) {
    return (
      <div className="tarjeta vacio planes-vacio">
        <p>Aún no tienes metas de ahorro.</p>
        <button type="button" className="boton-principal" onClick={() => navegar('/metas/nueva')}>
          Crear meta
        </button>
      </div>
    );
  }
  const ahorrado = metas.reduce((t, m) => t + m.ahorrado, 0);
  const objetivo = metas.reduce((t, m) => t + m.objetivo, 0);
  // General: si todas las metas usan la misma frecuencia, en esa; si no, al mes.
  const frecuencias = new Set(metas.map((m) => frecuenciaMeta(m.frecuencia).valor));
  const general = frecuenciaMeta(frecuencias.size === 1 ? [...frecuencias][0] : 'mes');
  const sugeridoGeneral = metas.reduce((t, m) => t + ahorroDe(m, general.valor), 0);

  return (
    <>
      <div className="tarjeta-meta">
        <div className="meta-cabeza">
          <CirculoCategoria icono="diana" color="acento" />
          <div className="meta-textos">
            <div className="meta-nombre">General</div>
            <div className="meta-detalle">{metas.length === 1 ? '1 meta activa' : `${metas.length} metas activas`}</div>
          </div>
          <div className="meta-porcentaje">
            <CifraAnimada valor={porcentaje(ahorrado, objetivo)} formato={conPorcentaje} />
          </div>
        </div>
        <div className="barra-progreso meta-barra">
          <span style={{ width: `${Math.min(porcentaje(ahorrado, objetivo), 100)}%` }} />
        </div>
        <div className="meta-cifras">
          <CifraAnimada valor={ahorrado} /> <span>de {formatearPesos(objetivo)}</span>
        </div>
        {sugeridoGeneral > 0 && (
          <div className="meta-consejo">
            Ahorra {formatearPesos(sugeridoGeneral)} {general.cada} para cumplirlas a tiempo
          </div>
        )}
      </div>

      {metas.map((m) => (
        <div key={m.id} className="tarjeta-meta">
          {/* Toda la tarjeta abre la meta; el botón Aportar queda por encima. */}
          <button
            type="button"
            className="meta-abrir"
            aria-label={`Editar ${m.nombre}`}
            onClick={() => navegar('/metas/' + m.id)}
          />
          <div className="meta-cabeza">
            <CirculoCategoria icono={m.icono} color="acento" />
            <div className="meta-textos">
              <div className="meta-nombre">{m.nombre}</div>
              <div className="meta-detalle">Meta: {fechaCorta(m.fechaLimite)}</div>
            </div>
            <button type="button" className="meta-aportar" onClick={() => alAportar(m)}>
              <span>
                <IconoMas tamano={16} />
                Aportar
              </span>
            </button>
          </div>
          <div className="barra-progreso meta-barra">
            <span style={{ width: `${Math.min(porcentaje(m.ahorrado, m.objetivo), 100)}%` }} />
          </div>
          <div className="meta-linea">
            <div className="meta-cifras">
              <CifraAnimada valor={m.ahorrado} /> <span>de {formatearPesos(m.objetivo)}</span>
            </div>
            <div className="meta-porcentaje">
              <CifraAnimada valor={porcentaje(m.ahorrado, m.objetivo)} formato={conPorcentaje} />
            </div>
          </div>
          <div className="meta-consejo">
            {ahorroDe(m) > 0
              ? `Ahorra ${formatearPesos(ahorroDe(m))} ${frecuenciaMeta(m.frecuencia).cada} para llegar a tiempo`
              : '¡Meta cumplida!'}
          </div>
        </div>
      ))}
    </>
  );
}

const conPorcentaje = (n) => `${n} %`;

// Lo que toca ahorrar en el periodo de la meta, como se lee en el panel.
const PERIODO_ACTUAL = { dia: 'hoy', semana: 'esta semana', quincena: 'esta quincena', mes: 'este mes' };

// Panel para aportar a una meta. Solo suma a la meta (no mueve dinero). Desde la Sesión 9 (pedido
// del dueño) ofrece lo que toca ahorrar en el periodo de la meta (hoy, esta semana, esta quincena o
// este mes, según su frecuencia) u otro valor. El aporte se guarda cuando el panel ya bajó, para
// que se vea contar la cifra de la meta (CifraAnimada).
function PanelAportar({ meta, abierto, alCerrar }) {
  const { semanaEmpieza } = useAjustes();
  const [opcion, setOpcion] = useState('sugerido');
  const [otro, setOtro] = useState(0);
  const frecuencia = frecuenciaMeta(meta?.frecuencia).valor;
  const sugerido = meta ? ahorroPorPeriodo(meta.objetivo, meta.ahorrado, meta.fechaLimite, frecuencia, semanaEmpieza) : 0;
  const conSugerido = sugerido > 0;
  const valor = conSugerido && opcion === 'sugerido' ? sugerido : otro;

  // Cada vez que se abre, parte de lo sugerido (si la meta aún no se cumple) y sin otro valor.
  useEffect(() => {
    if (!abierto) return;
    setOpcion('sugerido');
    setOtro(0);
  }, [abierto]);

  const opcionAporte = (clave, titulo, detalle) => {
    const marcada = clave === opcion;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={marcada}
        className="panel-opcion aportar-opcion"
        onClick={() => setOpcion(clave)}
      >
        <span className="panel-opcion-textos">
          <span className="panel-opcion-titulo">{titulo}</span>
          {detalle && <span className="panel-opcion-detalle">{detalle}</span>}
        </span>
        <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
      </button>
    );
  };

  return (
    <PanelInferior abierto={abierto} alCerrar={alCerrar} titulo={meta ? `Aportar a ${meta.nombre}` : 'Aportar'}>
      <p className="panel-texto">
        Suma a lo ahorrado en la meta, con fecha de hoy. Tus cuentas no cambian: el dinero ya está donde lo guardas.
      </p>
      {conSugerido && (
        <div className="aportar-opciones" role="radiogroup" aria-label="Cuánto aportar">
          {opcionAporte(
            'sugerido',
            `Lo de ${PERIODO_ACTUAL[frecuencia]}: ${formatearPesos(sugerido)}`,
            'Lo que toca ahorrar para llegar a tiempo',
          )}
          {opcionAporte('otro', 'Otro valor')}
        </div>
      )}
      {(!conSugerido || opcion === 'otro') && (
        <div className="tarjeta campos aportar-campo">
          <Campo Icono={IconoAhorro} etiqueta="Valor">
            <EntradaPesos valor={otro} etiqueta="Valor del aporte" alCambiar={setOtro} />
          </Campo>
        </div>
      )}
      <BotonExito
        className="boton-principal"
        disabled={!(valor > 0)}
        alTocar={() => valor > 0}
        alTerminar={() => {
          const metaId = meta.id;
          const aporte = valor;
          alCerrar();
          setTimeout(() => aportar(metaId, aporte), DURACION_PANEL_MS);
        }}
      >
        Aportar {valor > 0 ? formatearPesos(valor) : ''}
      </BotonExito>
    </PanelInferior>
  );
}

const IconoAhorro = (p) => <IconoPorNombre nombre="alcancia" tamano={18} {...p} />;

// ---------- Programados ----------

// Empezando en lunes o en domingo, según Ajustes.
const DIAS_SEMANA = {
  lunes: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  domingo: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
};
const dos = (n) => String(n).padStart(2, '0');

// Todo lo del mes para el calendario (Sesión 9, pedido del dueño: Planes es "otra pestaña de
// Transacciones, pero en calendario"): los movimientos del mes como en Transacciones
// (movimientosPorMes: cada cuota de tarjeta el día en que se paga su factura, pagos de factura,
// transferencias, pendientes y pagados) y las fechas de los programados que aún no son movimientos
// (meses siguientes, programadosDelMes). Más próximo primero.
function movimientosDelCalendario({ programados, movimientosPorMes, tarjeta }, anio, mes) {
  const registrados = movimientosPorMes.filter((m) => enMes(m.fecha, anio, mes));
  const futuros = programadosDelMes(programados, tarjeta, anio, mes);
  return [...registrados, ...futuros].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// "Hoy", "Mañana", "En 13 días" para lo programado que falta; para lo ya registrado, Pendiente si
// falta pagarlo y nada si ya se pagó, como en Transacciones.
function estadoProgramado(item) {
  if (!item.futuro) return estadoMovimiento(item);
  const dias = diasHasta(item.fecha);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

// Lo ya registrado abre lo mismo que en Transacciones (el movimiento, o la factura de una cuota);
// lo programado que falta abre el programado para editarlo. Lo que se repite lleva el ícono de
// repetir junto al título; lo que falta dice su frecuencia.
function FilasProgramadas({ items, navegar, frecuenciaDe, alAbrirProgramado }) {
  const datos = useDatos();
  return (
    <div className="tarjeta-lista">
      {items.map((item) => (
        <FilaMovimiento
          key={item.id}
          movimiento={item}
          mostrarRepetir={!item.futuro}
          detalle={
            item.futuro ? (
              <>
                <IconoRepetir />
                {textoFrecuencia(frecuenciaDe(item.programadoId))}
                {item.tarjetaId ? ` · ${datos.tarjeta(item.tarjetaId)?.nombre ?? 'Tarjeta'}` : ''}
              </>
            ) : (
              detalleMovimiento(item, datos)
            )
          }
          estado={estadoProgramado(item)}
          alTocar={() => (item.futuro ? alAbrirProgramado(item.programadoId, item.compra) : navegar(rutaMovimiento(item)))}
        />
      ))}
    </div>
  );
}

// Solo el calendario y los programados guardados (pedido del dueño, Sesión 9: se quitaron la vista
// Lista y "Crear programado"). El calendario lleva todo lo del mes, no solo lo programado. Tocar un
// día muestra lo de ese día.
function Programados({ items, programados, anio, mes, navegar }) {
  const [diaElegido, setDiaElegido] = useState(null);
  const frecuenciaDe = (id) => programados.find((p) => p.id === id)?.frecuencia;
  const { semanaEmpieza } = useAjustes();
  const { tarjeta } = useDatos();
  const [panelSeries, setPanelSeries] = useState(false);
  // Ventana pequeña de un programado (PanelProgramado): cuál y, si se abrió desde una fecha futura
  // del calendario, esa fecha.
  const [abierto, setAbierto] = useState({ id: null, ocurrencia: null });
  const [panelProgramado, setPanelProgramado] = useState(false);
  const abrirProgramado = (id, ocurrencia = null) => {
    setAbierto({ id, ocurrencia });
    setPanelProgramado(true);
  };
  // Transferencias y pagos de tarjeta van en azul (solo mueven dinero entre lo propio).
  const esTransferencia = (it) => it.tipo === 'transferencia' || it.tipo === 'pagoTarjeta';
  const hayTransferencias = items.some(esTransferencia);
  const { elegir } = useMes();
  const ahora = new Date();
  const enMesActual = anio === ahora.getFullYear() && mes === ahora.getMonth();

  // Calendario: semanas de lunes a domingo, o de domingo a sábado (Ajustes). Elegido: el día
  // tocado, o hoy si es de este mes.
  const vacios = (new Date(anio, mes, 1).getDay() + (semanaEmpieza === 'lunes' ? 6 : 0)) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const textoDia = (dia) => `${anio}-${dos(mes + 1)}-${dos(dia)}`;
  const hoy = hoyTexto();
  let elegido = textoDia(1);
  if (diaElegido && enMes(diaElegido, anio, mes)) elegido = diaElegido;
  else if (enMes(hoy, anio, mes)) elegido = hoy;
  const delDia = items.filter((i) => i.fecha === elegido);

  return (
    <>
      {/* Viendo otro mes: volver al actual (y a hoy) de un toque (pedido del dueño, Sesión 9). */}
      {!enMesActual && (
        <div className="programados-mes-actual">
          <button
            type="button"
            className="programados-dia-mas"
            onClick={() => {
              setDiaElegido(null);
              elegir(ahora.getFullYear(), ahora.getMonth());
            }}
          >
            <IconoCalendario tamano={16} />
            Mes actual
          </button>
        </div>
      )}
      <div className="tarjeta calendario">
        <div className="calendario-semana">
          {DIAS_SEMANA[semanaEmpieza].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendario-dias">
          {Array.from({ length: vacios }, (_, i) => (
            <span key={'v' + i} />
          ))}
          {Array.from({ length: diasDelMes }, (_, i) => {
            const fecha = textoDia(i + 1);
            const delMismoDia = items.filter((it) => it.fecha === fecha);
            const hayGasto = delMismoDia.some(esGasto);
            const hayIngreso = delMismoDia.some((it) => it.tipo === 'ingreso');
            const hayTransferencia = delMismoDia.some(esTransferencia);
            return (
              <button
                key={fecha}
                type="button"
                className="calendario-dia"
                aria-pressed={fecha === elegido}
                aria-label={etiquetaDia(fecha) + (delMismoDia.length ? `, ${delMismoDia.length} movimientos` : '')}
                onClick={() => setDiaElegido(fecha)}
              >
                <span className={'calendario-numero' + (fecha === hoy ? ' hoy' : '')}>{i + 1}</span>
                <span className="calendario-puntos">
                  {hayGasto && <i className="punto gasto" />}
                  {hayIngreso && <i className="punto ingreso" />}
                  {hayTransferencia && <i className="punto transferencia" />}
                </span>
              </button>
            );
          })}
        </div>
        {/* Qué es cada punto (pedido del dueño, Sesión 9). */}
        <div className="calendario-leyenda" aria-hidden="true">
          <span>
            <i className="punto gasto" /> Gasto
          </span>
          <span>
            <i className="punto ingreso" /> Ingreso
          </span>
          {hayTransferencias && (
            <span>
              <i className="punto transferencia" /> Transferencia
            </span>
          )}
        </div>
      </div>
      {/* El día elegido y, a su lado, "+ Agregar": abre el menú del "+" de la barra para ese día
          ("Movimiento para el 22 de octubre"; con hoy, el de siempre). Sesión 9, pedido del dueño. */}
      <div className="programados-dia">
        <h2 className="titulo-dia">{etiquetaDia(elegido)}</h2>
        <button
          type="button"
          className="programados-dia-mas"
          aria-label={`Agregar un movimiento el ${etiquetaDia(elegido)}`}
          onClick={() => abrirMenuNuevo(elegido)}
        >
          <IconoMas tamano={16} />
          Agregar
        </button>
      </div>
      <Deslizar posicion={Number(elegido.replaceAll('-', ''))} distancia={16}>
        {delDia.length === 0 ? (
          <div className="tarjeta vacio">Sin movimientos este día.</div>
        ) : (
          <FilasProgramadas items={delDia} navegar={navegar} frecuenciaDe={frecuenciaDe} alAbrirProgramado={abrirProgramado} />
        )}
      </Deslizar>

      {/* Las series que se repiten, aparte (Sesión 9: listadas justo bajo el día parecían un segundo
          gasto). Solo el título (pedido del dueño); abre una ventana con todas para editarlas o eliminarlas. */}
      <button type="button" className="tarjeta programados-lista-boton" onClick={() => setPanelSeries(true)}>
        <span className="icono-circulo">
          <IconoRepetir tamano={16} />
        </span>
        <span className="programados-lista-textos">
          <strong>Tus programados</strong>
        </span>
        <IconoFlecha />
      </button>

      <PanelInferior abierto={panelSeries} alCerrar={() => setPanelSeries(false)} titulo="Tus programados">
        <div className="panel-desplazable">
          {programados.length === 0 ? (
            <p className="panel-texto">
              Aún no tienes programados, como el arriendo o el sueldo. Al registrar un gasto o un ingreso, prende
              <strong>Gasto recurrente</strong> para que se repita.
            </p>
          ) : (
            programados.map((p) => (
              <FilaMovimiento
                key={p.id}
                movimiento={p}
                detalle={
                  <>
                    <IconoRepetir />
                    {textoFrecuencia(p.frecuencia)}
                    {p.tarjetaId ? ` · ${tarjeta(p.tarjetaId)?.nombre ?? 'Tarjeta'}` : ''}
                    {p.termina ? ` · hasta ${fechaCorta(p.termina)}` : ''}
                  </>
                }
                alTocar={() => {
                  setPanelSeries(false);
                  setTimeout(() => abrirProgramado(p.id), DURACION_PANEL_MS + 30);
                }}
              />
            ))
          )}
        </div>
      </PanelInferior>

      <PanelProgramado
        programado={programados.find((p) => p.id === abierto.id)}
        ocurrencia={abierto.ocurrencia}
        abierto={panelProgramado}
        alCerrar={() => setPanelProgramado(false)}
      />
    </>
  );
}

// ---------- Pantalla ----------

export default function Planes() {
  const navegar = useNavigate();
  const { seccion = 'calendario' } = useParams();
  const { anio, mes } = useMes();
  const datos = useDatos();
  // La meta a la que se aporta; se queda mientras el panel baja.
  const [metaAportar, setMetaAportar] = useState(null);
  const [panelAportar, setPanelAportar] = useState(false);
  const actual = SECCIONES.find((s) => s.valor === seccion) ?? SECCIONES[0];
  const indice = SECCIONES.indexOf(actual);
  // Al cambiar de sección o de mes, el resumen y la lista entran deslizándose desde ese lado.
  // Las metas no son de un mes: al cambiar el mes no se mueven.
  const posicion = actual.valor === 'metas' ? [indice] : [indice, anio * 12 + mes];

  const presupuestos = presupuestosDelMes(datos.presupuestos, datos.movimientosPorMes, anio, mes);
  const programados = movimientosDelCalendario(datos, anio, mes);

  let resumen;
  if (actual.valor === 'presupuestos') {
    const gastado = presupuestos.reduce((t, p) => t + p.gastado, 0);
    const limite = presupuestos.reduce((t, p) => t + p.limite, 0);
    resumen = (
      <div className="planes-resumen">
        <div className="planes-resumen-etiqueta">Disponible para gastar</div>
        <div className="planes-resumen-valor">{formatearPesos(Math.max(0, limite - gastado))}</div>
        <div className="planes-resumen-etiqueta">
          de {formatearPesos(limite)} presupuestados · {porcentaje(gastado, limite)} % usado
        </div>
      </div>
    );
  } else if (actual.valor === 'metas') {
    const ahorrado = datos.metas.reduce((t, m) => t + m.ahorrado, 0);
    const objetivo = datos.metas.reduce((t, m) => t + m.objetivo, 0);
    resumen = (
      <div className="planes-resumen">
        <div className="planes-resumen-etiqueta">Ahorrado en tus metas</div>
        <div className="planes-resumen-valor">
          <CifraAnimada valor={ahorrado} />
        </div>
        <div className="planes-resumen-etiqueta">
          de {formatearPesos(objetivo)} · {porcentaje(ahorrado, objetivo)} % completado
        </div>
      </div>
    );
  } else {
    // Todo lo del mes en el calendario (pagado, pendiente y lo programado que falta), sin
    // transferencias ni pagos de tarjeta, como los totales de Inicio.
    const suma = (tipo) =>
      programados.filter((m) => (tipo === 'gasto' ? esGasto(m) : m.tipo === tipo)).reduce((t, m) => t + m.valor, 0);
    resumen = (
      <div className="totales-banner">
        <div>
          <div className="totales-banner-etiqueta">Gastos del mes</div>
          <div className="totales-banner-valor">{formatearPesos(suma('gasto'))}</div>
        </div>
        <span className="totales-banner-divisor" />
        <div>
          <div className="totales-banner-etiqueta">Ingresos del mes</div>
          <div className="totales-banner-valor">{formatearPesos(suma('ingreso'))}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner planes-banner">
          <div className="planes-fila">
            {/* Casita a Inicio, como en Transacciones (pedido del dueño, 2026-10-04). */}
            <button type="button" className="boton-banner" aria-label="Ir a Inicio" onClick={() => navegar('/')}>
              <IconoInicio tamano={20} />
            </button>
            <MesConFlechas />
            {actual.nuevo ? (
              <button type="button" className="boton-banner" aria-label="Nuevo" onClick={() => navegar(actual.nuevo)}>
                <IconoMas />
              </button>
            ) : (
              // Mismo lugar vacío, para que el mes siga centrado.
              <span className="boton-banner planes-hueco" aria-hidden="true" />
            )}
          </div>
          <Deslizar posicion={posicion} distancia={16}>
            {resumen}
          </Deslizar>
          <div className="planes-secciones" role="tablist" aria-label="Planes">
            <span className="selector-pildora" style={{ '--n': SECCIONES.length, '--i': indice }} aria-hidden="true" />
            {SECCIONES.map(({ valor, texto }) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={valor === actual.valor}
                className="planes-seccion"
                onClick={() => navegar(valor === 'calendario' ? '/planes' : '/planes/' + valor, { replace: true })}
              >
                {texto}
              </button>
            ))}
          </div>
        </header>
      </div>

      <Deslizar posicion={posicion} className="planes-contenido">
        {actual.valor === 'presupuestos' && <Presupuestos lista={presupuestos} navegar={navegar} />}
        {actual.valor === 'metas' && (
          <Metas
            metas={datos.metas}
            navegar={navegar}
            alAportar={(m) => {
              setMetaAportar(m);
              setPanelAportar(true);
            }}
          />
        )}
        {actual.valor === 'calendario' && (
          <Programados
            items={programados}
            programados={datos.programados.filter((p) => !terminado(p))}
            anio={anio}
            mes={mes}
            navegar={navegar}
          />
        )}
      </Deslizar>

      <PanelAportar meta={metaAportar} abierto={panelAportar} alCerrar={() => setPanelAportar(false)} />
    </div>
  );
}
