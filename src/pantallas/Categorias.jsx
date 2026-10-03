// Categorías de gastos e ingresos (design/capturas/Categorias.png y CategoriasIngresos.png).
// La pestaña va en la dirección (?tipo=ingreso) para volver a ella al cerrar un formulario.
import { useNavigate, useSearchParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import { Segmentado } from '../componentes/Formulario.jsx';
import { IconoFlecha, IconoMas } from '../componentes/iconos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import './Categorias.css';

const PESTANAS = [
  { valor: 'gasto', texto: 'Gastos' },
  { valor: 'ingreso', texto: 'Ingresos' },
];

export default function Categorias() {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const tipo = parametros.get('tipo') === 'ingreso' ? 'ingreso' : 'gasto';
  const { categorias, cargando } = useDatos();
  const lista = categorias.filter((c) => c.tipo === tipo);

  return (
    <div>
      <CabeceraSubpagina
        titulo="Categorías"
        volverA="/mi-espacio"
        derecha={
          <button
            type="button"
            className="boton-banner"
            aria-label="Nueva categoría"
            onClick={() => navegar('/categorias/nueva?tipo=' + tipo)}
          >
            <IconoMas />
          </button>
        }
      >
        <Segmentado
          opciones={PESTANAS}
          valor={tipo}
          etiqueta="Tipo de categoría"
          alCambiar={(valor) => setParametros(valor === 'ingreso' ? { tipo: valor } : {}, { replace: true })}
        />
      </CabeceraSubpagina>

      <div className="contenido categorias-contenido">
        {!cargando && lista.length === 0 && (
          <div className="tarjeta vacio">No tienes categorías de {tipo === 'gasto' ? 'gastos' : 'ingresos'}.</div>
        )}
        {lista.length > 0 && (
          <div className="tarjeta categorias-lista">
            {lista.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                className="categorias-fila"
                onClick={() => navegar('/categorias/' + categoria.id)}
              >
                <CirculoCategoria icono={categoria.icono} color={categoria.color} mediano />
                <span className="categorias-nombre">{categoria.nombre}</span>
                <span className="categorias-flecha">
                  <IconoFlecha />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
