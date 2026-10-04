// Panel "Filtros" de Transacciones (design/html/Filtros.html): tipo, estado, cuenta o tarjeta,
// categoría y etiqueta. Como los demás paneles de elección, el cambio se ve en vivo detrás y no
// se cierra al elegir; "Ver N movimientos" lo cierra. En cuenta, categoría y etiqueta se pueden
// elegir varias; "Todas" las quita.
import { Fragment } from 'react';
import { FILTROS_VACIOS } from '../datos/buscar.js';
import { useDatos } from '../datos/DatosContext.jsx';
import PanelInferior from './PanelInferior.jsx';
import './PanelFiltros.css';

export const TIPOS_FILTRO = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
  { valor: 'transferencia', texto: 'Transferencias' },
];

const ESTADOS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'pagado', texto: 'Pagado' },
  { valor: 'pendiente', texto: 'Pendiente' },
];

function Chip({ elegido, alTocar, children }) {
  return (
    <button type="button" className="chip" aria-pressed={elegido} onClick={alTocar}>
      <span>{children}</span>
    </button>
  );
}

function Grupo({ titulo, children }) {
  return (
    <section className="filtros-grupo">
      <h3 className="filtros-titulo">{titulo}</h3>
      <div className="filtros-chips" role="group" aria-label={titulo}>
        {children}
      </div>
    </section>
  );
}

// Varias a la vez: "Todas" (lista vacía) o las elegidas.
function GrupoVarios({ titulo, opciones, elegidos, alCambiar }) {
  const alternar = (id) => alCambiar(elegidos.includes(id) ? elegidos.filter((e) => e !== id) : [...elegidos, id]);
  return (
    <Grupo titulo={titulo}>
      <Chip elegido={elegidos.length === 0} alTocar={() => alCambiar([])}>
        Todas
      </Chip>
      {opciones.map((o, i) => (
        <Fragment key={o.id}>
          {/* En "Todo", las de ingreso van aparte: si no, "Otros" saldría dos veces sin saber cuál es cuál. */}
          {o.tipo === 'ingreso' && opciones[i - 1]?.tipo === 'gasto' && <span className="filtros-subtitulo">De ingreso</span>}
          <Chip elegido={elegidos.includes(o.id)} alTocar={() => alternar(o.id)}>
            {o.nombre}
          </Chip>
        </Fragment>
      ))}
    </Grupo>
  );
}

// Categorías que tienen sentido con el tipo elegido (las transferencias no llevan).
function categoriasDelTipo(categorias, tipo) {
  if (tipo === 'transferencia') return [];
  if (tipo === 'todo') return [...categorias.filter((c) => c.tipo === 'gasto'), ...categorias.filter((c) => c.tipo === 'ingreso')];
  return categorias.filter((c) => c.tipo === tipo);
}

export default function PanelFiltros({ abierto, alCerrar, filtros, alCambiar, cantidad }) {
  const datos = useDatos();
  const categorias = categoriasDelTipo(datos.categorias, filtros.tipo);
  const cuentasYTarjetas = [...datos.cuentas, ...datos.tarjetas];
  const cambiar = (campo) => (valor) => alCambiar((f) => ({ ...f, [campo]: valor }));

  // Al cambiar el tipo se sueltan las categorías que ya no se ven (p. ej. de gasto a ingreso).
  const cambiarTipo = (tipo) =>
    alCambiar((f) => {
      const validas = new Set(categoriasDelTipo(datos.categorias, tipo).map((c) => c.id));
      return { ...f, tipo, categorias: f.categorias.filter((id) => validas.has(id)) };
    });

  return (
    <PanelInferior
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Filtros"
      accion={{ texto: 'Limpiar', alTocar: () => alCambiar(FILTROS_VACIOS) }}
    >
      <div className="panel-desplazable filtros-desplazable">
        <Grupo titulo="Tipo">
          {TIPOS_FILTRO.map(({ valor, texto }) => (
            <Chip key={valor} elegido={filtros.tipo === valor} alTocar={() => cambiarTipo(valor)}>
              {texto}
            </Chip>
          ))}
        </Grupo>

        <Grupo titulo="Estado">
          {ESTADOS.map(({ valor, texto }) => (
            <Chip key={valor} elegido={filtros.estado === valor} alTocar={() => cambiar('estado')(valor)}>
              {texto}
            </Chip>
          ))}
        </Grupo>

        {cuentasYTarjetas.length > 0 && (
          <GrupoVarios
            titulo={datos.tarjetas.length > 0 ? 'Cuenta o tarjeta' : 'Cuenta'}
            opciones={cuentasYTarjetas}
            elegidos={filtros.cuentas}
            alCambiar={cambiar('cuentas')}
          />
        )}

        {categorias.length > 0 && (
          <GrupoVarios titulo="Categoría" opciones={categorias} elegidos={filtros.categorias} alCambiar={cambiar('categorias')} />
        )}

        {datos.etiquetas.length > 0 && (
          <GrupoVarios titulo="Etiqueta" opciones={datos.etiquetas} elegidos={filtros.etiquetas} alCambiar={cambiar('etiquetas')} />
        )}
      </div>

      <button type="button" className="boton-principal filtros-ver" onClick={alCerrar}>
        {cantidad === 0 ? 'Ningún movimiento' : cantidad === 1 ? 'Ver 1 movimiento' : `Ver ${cantidad} movimientos`}
      </button>
    </PanelInferior>
  );
}
