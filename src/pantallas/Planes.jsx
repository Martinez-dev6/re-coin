import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import {
  IconoAlerta,
  IconoAviso,
  IconoCalendario,
  IconoCheckCirculo,
  IconoLista,
  IconoMas,
  IconoRepetir,
} from '../componentes/iconos.jsx';
import { MesConFlechas } from '../componentes/SelectorMes.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { useMes } from '../estado/MesContext.jsx';
import { aFecha, diasHasta, enMes, etiquetaDia, fechaCorta, hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Planes.css';
import './Transacciones.css';

const SECCIONES = [
  { valor: 'presupuestos', texto: 'Presupuestos', nuevo: 'nuevo-presupuesto' },
  { valor: 'metas', texto: 'Metas', nuevo: 'nueva-meta' },
  { valor: 'programados', texto: 'Programados', nuevo: 'nuevo-programado' },
];

// Presupuestos, metas y programados llegan con la base de datos en el paso 7.
const PRESUPUESTOS = [];
const METAS = [];
const PROGRAMADOS = [];

const porcentaje = (parte, todo) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

// ---------- Presupuestos ----------

// Estado de un presupuesto: al día (< 90 %), casi al límite (90–100 %) o excedido.
function estadoPresupuesto(gastado, limite) {
  const usado = porcentaje(gastado, limite);
  if (gastado > limite) {
    return { clase: 'excedido', color: 'var(--expense)', Icono: IconoAlerta, texto: `Excedido ${formatearPesos(gastado - limite)}`, usado };
  }
  if (usado >= 90) {
    return { clase: 'limite', color: 'var(--pending)', Icono: IconoAviso, texto: 'Casi al límite', usado };
  }
  return { clase: 'ok', color: 'var(--muted)', Icono: IconoCheckCirculo, texto: `Quedan ${formatearPesos(limite - gastado)}`, usado };
}

function FilaPresupuesto({ nombre, icono, color, gastado, limite }) {
  const estado = estadoPresupuesto(gastado, limite);
  const barra = estado.clase === 'ok' ? 'var(--accent-text)' : estado.color;
  return (
    <div className="presupuesto">
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
    </div>
  );
}

function Presupuestos({ lista }) {
  const { categoria: buscarCategoria } = useDatos();
  if (lista.length === 0) return <div className="tarjeta vacio">No hay presupuestos para este mes.</div>;
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
          />
        );
      })}
    </div>
  );
}

// ---------- Metas ----------

// Meses que quedan contando el actual: de octubre a diciembre son 3.
function mesesRestantes(fechaLimite) {
  const hoy = aFecha(hoyTexto());
  const limite = aFecha(fechaLimite);
  return Math.max(1, (limite.getFullYear() - hoy.getFullYear()) * 12 + limite.getMonth() - hoy.getMonth() + 1);
}

const ahorroMensual = (m) => Math.max(0, Math.ceil((m.objetivo - m.ahorrado) / mesesRestantes(m.fechaLimite)));

function Metas({ navegar }) {
  if (METAS.length === 0) return <div className="tarjeta vacio">Aún no tienes metas de ahorro.</div>;
  const ahorrado = METAS.reduce((t, m) => t + m.ahorrado, 0);
  const objetivo = METAS.reduce((t, m) => t + m.objetivo, 0);
  const mensual = METAS.reduce((t, m) => t + ahorroMensual(m), 0);

  return (
    <>
      <div className="tarjeta-meta">
        <div className="meta-cabeza">
          <CirculoCategoria icono="diana" color="acento" />
          <div className="meta-textos">
            <div className="meta-nombre">General</div>
            <div className="meta-detalle">{METAS.length} metas activas</div>
          </div>
          <div className="meta-porcentaje">{porcentaje(ahorrado, objetivo)} %</div>
        </div>
        <div className="barra-progreso meta-barra">
          <span style={{ width: `${porcentaje(ahorrado, objetivo)}%` }} />
        </div>
        <div className="meta-cifras">
          {formatearPesos(ahorrado)} <span>de {formatearPesos(objetivo)}</span>
        </div>
        <div className="meta-consejo">Ahorra {formatearPesos(mensual)} al mes para cumplirlas a tiempo</div>
      </div>

      {METAS.map((m) => (
        <div key={m.id} className="tarjeta-meta">
          <div className="meta-cabeza">
            <CirculoCategoria icono={m.icono} color={m.color} />
            <div className="meta-textos">
              <div className="meta-nombre">{m.nombre}</div>
              <div className="meta-detalle">Meta: {fechaCorta(m.fechaLimite)}</div>
            </div>
            <button type="button" className="meta-aportar" onClick={() => navegar('/pendiente/aportar')}>
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
          <div className="meta-consejo">Ahorra {formatearPesos(ahorroMensual(m))} al mes para llegar a tiempo</div>
        </div>
      ))}
    </>
  );
}

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
    </>
  );
}

// ---------- Pantalla ----------

export default function Planes() {
  const navegar = useNavigate();
  const { seccion = 'presupuestos' } = useParams();
  const { anio, mes } = useMes();
  const actual = SECCIONES.find((s) => s.valor === seccion) ?? SECCIONES[0];

  const presupuestos = PRESUPUESTOS;
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
    const ahorrado = METAS.reduce((t, m) => t + m.ahorrado, 0);
    const objetivo = METAS.reduce((t, m) => t + m.objetivo, 0);
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
            <button type="button" className="boton-banner" aria-label="Nuevo" onClick={() => navegar('/pendiente/' + actual.nuevo)}>
              <IconoMas />
            </button>
          </div>
          {resumen}
          <div className="planes-secciones" role="tablist" aria-label="Planes">
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

      <div className="planes-contenido">
        {actual.valor === 'presupuestos' && <Presupuestos lista={presupuestos} />}
        {actual.valor === 'metas' && <Metas navegar={navegar} />}
        {actual.valor === 'programados' && <Programados lista={programados} />}
      </div>
    </div>
  );
}
