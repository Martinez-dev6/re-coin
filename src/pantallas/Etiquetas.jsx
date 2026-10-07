// Lista de etiquetas con cuántos movimientos tiene cada una (design/capturas/Etiquetas.png).
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoEtiqueta, IconoFlecha, IconoInfo, IconoMas } from '../componentes/iconos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { useFilasAnimadas } from '../utilidades/movimiento.js';
import './Cuentas.css';
import './Etiquetas.css';

export default function Etiquetas() {
  const navegar = useNavigate();
  const { etiquetas, movimientos, cargando } = useDatos();
  const nueva = () => navegar('/etiquetas/nueva');
  const lista = useRef(null);
  useFilasAnimadas(lista);

  const cuantos = new Map();
  for (const m of movimientos) for (const e of m.etiquetaIds) cuantos.set(e, (cuantos.get(e) ?? 0) + 1);

  return (
    <div>
      <CabeceraSubpagina
        titulo="Etiquetas"
        volverA="/mi-espacio"
        derecha={
          <button type="button" className="boton-banner" aria-label="Nueva etiqueta" onClick={nueva}>
            <IconoMas />
          </button>
        }
      />

      <div className="contenido cuentas-contenido">
        {etiquetas.length > 0 && (
          <div ref={lista} className="tarjeta cuentas-lista">
            {etiquetas.map((e) => {
              const n = cuantos.get(e.id) ?? 0;
              return (
                <button
                  key={e.id}
                  data-clave={e.id}
                  type="button"
                  className="cuentas-fila etiquetas-fila"
                  onClick={() => navegar('/etiquetas/' + e.id)}
                >
                  <span className="icono-circulo grande" data-tono="g">
                    <IconoEtiqueta tamano={18} />
                  </span>
                  <span className="cuentas-textos">
                    <span className="cuentas-nombre">{e.nombre}</span>
                    <span className="cuentas-detalle">{n === 1 ? '1 movimiento' : `${n} movimientos`}</span>
                  </span>
                  <span className="cuentas-flecha">
                    <IconoFlecha />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!cargando && (
          <button type="button" className="cuentas-nueva" onClick={nueva}>
            <IconoMas tamano={18} />
            Nueva etiqueta
          </button>
        )}

        <p className="etiquetas-nota">
          <IconoInfo />
          <span>Las etiquetas agrupan movimientos de distintas categorías, por ejemplo todo lo del carro.</span>
        </p>
      </div>
    </div>
  );
}
