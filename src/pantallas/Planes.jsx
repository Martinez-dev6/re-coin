import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { Campo, EntradaPesos } from '../componentes/Formulario.jsx';
import {
  IconoAlerta,
  IconoAviso,
  IconoCalendario,
  IconoCheckCirculo,
  IconoLista,
  IconoMas,
  IconoRepetir,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { ahorroMensual, aportar } from '../datos/metas.js';
import { presupuestosDelMes } from '../datos/presupuestos.js';
import { useMes } from '../estado/MesContext.jsx';
import { diasHasta, enMes, etiquetaDia, fechaCorta } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Planes.css';
import './Transacciones.css';

const SECCIONES = [
  { valor: 'presupuestos', texto: 'Presupuestos', nuevo: '/presupuestos/nuevo' },
  { valor: 'metas', texto: 'Metas', nuevo: '/metas/nueva' },
  { valor: 'programados', texto: 'Programados', nuevo: '/pendiente/nuevo-programado' },
];

// Los programados llegan después (paso 7b).
const PROGRAMADOS = [];

const porcentaje = (parte, todo) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

// ---------- Presupuestos ----------

// Estado de un presupuesto: al día, casi al límite (desde su "Avisarme al") o excedido.
function estadoPresupuesto(gastado, limite, avisarAl = 90) {
  const usado = porcentaje(gastado, limite);
  if (gastado > limite) {
    return { clase: 'excedido', color: 'var(--expense)', Icono: IconoAlerta, texto: `Excedido ${formatearPesos(gastado - limite)}`, usado };
  }
  if (usado >= avisarAl) {
    return { clase: 'limite', color: 'var(--pending)', Icono: IconoAviso, texto: 'Casi al límite', usado };
  }
  return { clase: 'ok', color: 'var(--muted)', Icono: IconoCheckCirculo, texto: `Quedan ${formatearPesos(limite - gastado)}`, usado };
}

// alTocar: la fila es un botón (abre Editar presupuesto); la de "General" no.
function FilaPresupuesto({ nombre, icono, color, gastado, limite, avisarAl, alTocar }) {
  const estado = estadoPresupuesto(gastado, limite, avisarAl);
  const barra = estado.clase === 'ok' ? 'var(--accent-text)' : estado.color;
  const Fila = alTocar ? 'button' : 'div';
  return (
    <Fila {...(alTocar && { type: 'button', onClick: alTocar })} className="presupuesto">
      <CirculoCategoria icono={icono} color={color} />
      <div className="presupuesto-cuerpo">
        <div className="presupuesto-linea">
          <span className="presupuesto-nombre">{nombre}</span>
          <span className="presupuesto-estado" style={{ color: estado.color }}>
            <estado.Icono />
            {estado.texto}
          </span>
        </div>
        <div className="barra-progreso presupuesto-barra">
          <span style={{ width: `${Math.min(estado.usado, 100)}%`, background: barra }} />
        </div>
        <div className="presupuesto-linea">
          <span className="presupuesto-cifras">
            {formatearPesos(gastado)} de {formatearPesos(limite)}
          </span>
          <span className="presupuesto-porcentaje" style={{ color: estado.clase === 'ok' ? 'var(--muted)' : estado.color }}>
            {estado.usado} %
          </span>
        </div>
      </div>
    </Fila>
  );
}

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
            alTocar={() => navegar('/presupuestos/' + p.id)}
          />
        );
      })}
    </div>
  );
}

// ---------- Metas ----------

// Cuánto ahorrar al mes para llegar a tiempo con una meta.
const mensualDe = (m) => ahorroMensual(m.objetivo, m.ahorrado, m.fechaLimite);

function Metas({ metas, navegar, alAportar }) {
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
  const mensual = metas.reduce((t, m) => t + mensualDe(m), 0);

  return (
    <>
      <div className="tarjeta-meta">
        <div className="meta-cabeza">
          <CirculoCategoria icono="diana" color="acento" />
          <div className="meta-textos">
            <div className="meta-nombre">General</div>
            <div className="meta-detalle">{metas.length === 1 ? '1 meta activa' : `${metas.length} metas activas`}</div>
          </div>
          <div className="meta-porcentaje">{porcentaje(ahorrado, objetivo)} %</div>
        </div>
        <div className="barra-progreso meta-barra">
          <span style={{ width: `${Math.min(porcentaje(ahorrado, objetivo), 100)}%` }} />
        </div>
        <div className="meta-cifras">
          {formatearPesos(ahorrado)} <span>de {formatearPesos(objetivo)}</span>
        </div>
        {mensual > 0 && <div className="meta-consejo">Ahorra {formatearPesos(mensual)} al mes para cumplirlas a tiempo</div>}
      </div>

      {metas.map((m) => (
        <div key={m.id} className="tarjeta-meta">
          {/* Toda la tarjeta abre la meta; el botón Aportar queda por encima. */}
          <button type="button" className="meta-abrir" aria-label={`Editar ${m.nombre}`} onClick={() => navegar('/metas/' + m.id)} />
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
              {formatearPesos(m.ahorrado)} <span>de {formatearPesos(m.objetivo)}</span>
            </div>
            <div className="meta-porcentaje">{porcentaje(m.ahorrado, m.objetivo)} %</div>
          </div>
          <div className="meta-consejo">
            {mensualDe(m) > 0 ? `Ahorra ${formatearPesos(mensualDe(m))} al mes para llegar a tiempo` : '¡Meta cumplida!'}
          </div>
        </div>
      ))}
    </>
  );
}

// Panel para aportar a una meta: el valor y el botón. Solo suma a la meta (no mueve dinero).
function PanelAportar({ meta, abierto, alCerrar }) {
  const [valor, setValor] = useState(0);
  const listo = async () => {
    await aportar(meta.id, valor);
    setValor(0);
    alCerrar();
  };
  return (
    <PanelInferior abierto={abierto} alCerrar={alCerrar} titulo={meta ? `Aportar a ${meta.nombre}` : 'Aportar'}>
      <p className="panel-texto">
        Suma a lo ahorrado en la meta, con fecha de hoy. Tus cuentas no cambian: el dinero ya está donde lo guardas.
      </p>
      <div className="tarjeta campos aportar-campo">
        <Campo Icono={IconoAhorro} etiqueta="Valor">
          <EntradaPesos valor={valor} etiqueta="Valor del aporte" alCambiar={setValor} />
        </Campo>
      </div>
      <button type="button" className="boton-principal" disabled={!(valor > 0)} onClick={listo}>
        Aportar {valor > 0 ? formatearPesos(valor) : ''}
      </button>
    </PanelInferior>
  );
}

const IconoAhorro = (p) => <IconoPorNombre nombre="alcancia" tamano={18} {...p} />;

// ---------- Programados ----------

const FRECUENCIA = { semana: 'Cada semana', mes: 'Cada mes', anio: 'Cada año', dia: 'Cada día' };

function estadoProgramado(p) {
  const dias = diasHasta(p.proxima);
  if (dias <= 0 && !p.pagado) return 'pendiente';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

function Programados({ lista }) {
  const [vista, setVista] = useState('lista');

  const porDia = [];
  for (const p of [...lista].sort((a, b) => a.proxima.localeCompare(b.proxima))) {
    const grupo = porDia.at(-1);
    if (grupo?.fecha === p.proxima) grupo.items.push(p);
    else porDia.push({ fecha: p.proxima, items: [p] });
  }

  return (
    <>
      <div className="chips planes-vistas" role="group" aria-label="Vista">
        <button type="button" className="chip" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}>
          <span>
            <IconoLista tamano={14} grosor={2.2} />
            Lista
          </span>
        </button>
        <button type="button" className="chip" aria-pressed={vista === 'calendario'} onClick={() => setVista('calendario')}>
          <span>
            <IconoCalendario />
            Calendario
          </span>
        </button>
      </div>

      <Deslizar posicion={vista === 'lista' ? 0 : 1}>
        {vista === 'calendario' && (
          <div className="tarjeta vacio">La vista de calendario se construye junto con los movimientos programados (paso 7).</div>
        )}
        {vista === 'lista' && porDia.length === 0 && <div className="tarjeta vacio">No hay movimientos programados este mes.</div>}
        {vista === 'lista' &&
          porDia.map(({ fecha, items }) => (
            <section key={fecha}>
              <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
              <div className="tarjeta-lista">
                {items.map((p) => (
                  <FilaMovimiento
                    key={p.id}
                    movimiento={p}
                    detalle={
                      <>
                        <IconoRepetir />
                        {FRECUENCIA[p.frecuencia]}
                      </>
                    }
                    estado={estadoProgramado(p)}
                  />
                ))}
              </div>
            </section>
          ))}
      </Deslizar>
    </>
  );
}

// ---------- Pantalla ----------

export default function Planes() {
  const navegar = useNavigate();
  const { seccion = 'presupuestos' } = useParams();
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
  const programados = PROGRAMADOS.filter((p) => enMes(p.proxima, anio, mes));

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
        <div className="planes-resumen-valor">{formatearPesos(ahorrado)}</div>
        <div className="planes-resumen-etiqueta">
          de {formatearPesos(objetivo)} · {porcentaje(ahorrado, objetivo)} % completado
        </div>
      </div>
    );
  } else {
    const suma = (tipo) => programados.filter((p) => p.tipo === tipo).reduce((t, p) => t + p.valor, 0);
    resumen = (
      <div className="totales-banner">
        <div>
          <div className="totales-banner-etiqueta">Gastos programados</div>
          <div className="totales-banner-valor">{formatearPesos(suma('gasto'))}</div>
        </div>
        <span className="totales-banner-divisor" />
        <div>
          <div className="totales-banner-etiqueta">Ingresos programados</div>
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
            <span className="planes-hueco" />
            <MesConFlechas />
            <button type="button" className="boton-banner" aria-label="Nuevo" onClick={() => navegar(actual.nuevo)}>
              <IconoMas />
            </button>
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
                onClick={() => navegar(valor === 'presupuestos' ? '/planes' : '/planes/' + valor, { replace: true })}
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
        {actual.valor === 'programados' && <Programados lista={programados} />}
      </Deslizar>

      <PanelAportar meta={metaAportar} abierto={panelAportar} alCerrar={() => setPanelAportar(false)} />
    </div>
  );
}
