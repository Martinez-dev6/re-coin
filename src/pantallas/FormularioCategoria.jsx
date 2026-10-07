// Nueva categoría (/categorias/nueva?tipo=…) y editar categoría (/categorias/:id).
// design/capturas/NuevaCategoria.png
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import {
  CabeceraFormulario,
  Campo,
  EntradaTexto,
  PieFormulario,
  RejillaColores,
  Segmentado,
} from '../componentes/Formulario.jsx';
import { IconoBasura, IconoTexto } from '../componentes/iconos.jsx';
import { ICONOS_CATEGORIA } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import SelectorIcono from '../componentes/SelectorIcono.jsx';
import { estiloIconoTono } from '../tema/colores.js';
import { COLORES_CATEGORIA, eliminarCategoria, guardarCategoria } from '../datos/categorias.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { volver } from '../utilidades/navegacion.js';
import { mismosDatos } from '../utilidades/sinCambios.js';

const TIPOS = [
  { valor: 'gasto', texto: 'Gasto' },
  { valor: 'ingreso', texto: 'Ingreso' },
];

const lista = (tipo) => '/mi-espacio/categorias' + (tipo === 'ingreso' ? '?tipo=ingreso' : '');

export default function FormularioCategoria() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const { categoria, cargando } = useDatos();
  const editando = id !== 'nueva';
  const existente = editando ? categoria(id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar categoría" volverA={lista('gasto')} />;
  if (editando && !existente) return <Navigate to={lista('gasto')} replace />;
  const tipoInicial = parametros.get('tipo') === 'ingreso' ? 'ingreso' : 'gasto';
  return <Campos key={id} categoria={existente} tipoInicial={tipoInicial} />;
}

function Campos({ categoria, tipoInicial }) {
  const navegar = useNavigate();
  const { movimientos, presupuestos } = useDatos();
  const usos = categoria ? movimientos.filter((m) => m.categoriaId === categoria.id).length : 0;
  const conPresupuesto = Boolean(categoria) && presupuestos.some((p) => p.categoriaId === categoria.id);
  const [datos, setDatos] = useState(() => categoria ?? { nombre: '', tipo: tipoInicial, color: 'e', icono: 'corazon' });
  const [panelEliminar, setPanelEliminar] = useState(false);
  const eliminando = useRef(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const volverA = lista(datos.tipo);

  // Al terminar la animación del botón (BotonExito) se vuelve.
  const guardar = () => guardarCategoria(categoria?.id, datos);

  // Primero baja el panel; después se vuelve a la lista y se borra.
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanelEliminar(false);
    setTimeout(() => {
      volver(navegar, volverA);
      eliminarCategoria(categoria.id);
    }, DURACION_PANEL_MS + 30);
  };

  return (
    <div>
      <CabeceraFormulario titulo={categoria ? 'Editar categoría' : 'Nueva categoría'} volverA={volverA}>
        {/* Al editar no se cambia el tipo: los movimientos ya registrados son de ese tipo. */}
        <Segmentado
          opciones={TIPOS}
          valor={datos.tipo}
          etiqueta="Tipo de categoría"
          bloqueado={Boolean(categoria)}
          alCambiar={(tipo) => cambiar({ tipo })}
        />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} tono="g" etiqueta="Nombre">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Mascotas" maximo={30} />
          </Campo>
        </div>

        <h2 className="titulo-seccion">Color</h2>
        <RejillaColores colores={COLORES_CATEGORIA} elegido={datos.color} alElegir={(color) => cambiar({ color })} />

        <h2 className="titulo-seccion">Ícono</h2>
        {/* El ícono elegido va del color elegido arriba: se ve el cambio al tocar otro color. */}
        <SelectorIcono
          sugeridos={ICONOS_CATEGORIA}
          elegido={datos.icono}
          estilo={estiloIconoTono(datos.color)}
          alElegir={(icono) => cambiar({ icono })}
        />

        {categoria && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanelEliminar(true)}>
            <IconoBasura />
            Eliminar categoría
          </button>
        )}
      </div>

      <PieFormulario>
        <BotonExito
          className="boton-principal"
          disabled={!datos.nombre.trim() || (Boolean(categoria) && mismosDatos(datos, categoria))}
          alTocar={guardar}
          alTerminar={() => volver(navegar, volverA)}
        >
          Guardar categoría
        </BotonExito>
      </PieFormulario>

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar la categoría?">
        <p className="panel-texto">
          Se borra <strong>{categoria?.nombre}</strong> de este teléfono.{' '}
          {usos > 0 && `${usos === 1 ? 'Su movimiento queda' : `Sus ${usos} movimientos quedan`} sin categoría. `}
          {conPresupuesto && 'También se borra su presupuesto. '}
          No se puede deshacer.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
