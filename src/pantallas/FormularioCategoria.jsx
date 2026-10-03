// Nueva categoría (/categorias/nueva?tipo=…) y editar categoría (/categorias/:id).
// design/capturas/NuevaCategoria.png
import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CabeceraFormulario,
  Campo,
  EntradaTexto,
  PieFormulario,
  RejillaColores,
  RejillaIconos,
  Segmentado,
} from '../componentes/Formulario.jsx';
import { IconoBasura, IconoTexto } from '../componentes/iconos.jsx';
import { ICONOS_CATEGORIA } from '../componentes/iconosPorNombre.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { COLORES_CATEGORIA, eliminarCategoria, guardarCategoria } from '../datos/categorias.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { volver } from '../utilidades/navegacion.js';

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
  const [datos, setDatos] = useState(() => categoria ?? { nombre: '', tipo: tipoInicial, color: 'e', icono: 'corazon' });
  const [panelEliminar, setPanelEliminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const volverA = lista(datos.tipo);

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarCategoria(categoria?.id, datos);
      volver(navegar, volverA);
    } finally {
      setGuardando(false);
    }
  };

  // Primero se vuelve a la lista y después se borra (ver FormularioCuenta).
  const eliminar = () => {
    volver(navegar, volverA);
    eliminarCategoria(categoria.id);
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
          <Campo Icono={IconoTexto} etiqueta="Nombre">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Mascotas" maximo={30} />
          </Campo>
        </div>

        <h2 className="titulo-seccion">Color</h2>
        <RejillaColores colores={COLORES_CATEGORIA} elegido={datos.color} alElegir={(color) => cambiar({ color })} />

        <h2 className="titulo-seccion">Ícono</h2>
        <RejillaIconos
          nombres={ICONOS_CATEGORIA}
          elegido={datos.icono}
          etiqueta="Ícono"
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
        <button
          type="button"
          className="boton-principal"
          disabled={guardando || !datos.nombre.trim()}
          onClick={guardar}
        >
          Guardar categoría
        </button>
      </PieFormulario>

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar la categoría?">
        <p className="panel-texto">Se borra «{categoria?.nombre}» de este teléfono. No se puede deshacer.</p>
        <button type="button" className="boton-peligro" onClick={eliminar}>
          Eliminar
        </button>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
