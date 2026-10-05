// Ícono de una cuenta o una categoría: unos sugeridos a la vista y, en "Más íconos", el
// catálogo completo por grupos (iconosPorNombre.jsx) en un panel. Como los demás paneles de
// elección, no se cierra al elegir: se ve el cambio y se cierra con Listo o tocando fuera.
import { useCallback, useState } from 'react';
import { IconoMasOpciones } from './iconos.jsx';
import { ETIQUETAS_ICONO, GRUPOS_ICONOS, IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior from './PanelInferior.jsx';
import { variablesAcento } from '../tema/colores.js';
import './SelectorIcono.css';

// color: el del ícono elegido (tarjetas: solo el ícono lleva el color, no el formulario).
function BotonIcono({ nombre, elegido, alElegir, color }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={nombre === elegido}
      aria-label={ETIQUETAS_ICONO[nombre] ?? nombre}
      className="selector-icono-boton"
      style={nombre === elegido ? variablesAcento(color) : undefined}
      onClick={() => alElegir(nombre)}
    >
      <IconoPorNombre nombre={nombre} tamano={24} />
    </button>
  );
}

export default function SelectorIcono({ sugeridos, elegido, alElegir, etiqueta = 'Ícono', color = null }) {
  const [panel, setPanel] = useState(false);

  // Si el elegido no está entre los sugeridos (se eligió en el panel), se ve de primero.
  const visibles = sugeridos.includes(elegido) ? sugeridos : [elegido, ...sugeridos.slice(0, -1)];

  // Al abrir el panel, el ícono elegido queda a la vista (solo al abrir: si se hiciera cada
  // vez que se elige otro, la lista saltaría bajo el dedo).
  const alMontarCatalogo = useCallback((caja) => {
    const marcado = caja?.querySelector('[aria-checked="true"]');
    if (marcado) caja.scrollTop = Math.max(0, marcado.offsetTop - caja.clientHeight / 2 + marcado.offsetHeight / 2);
  }, []);

  return (
    <>
      <div className="tarjeta selector-icono" role="radiogroup" aria-label={etiqueta}>
        {visibles.map((nombre) => (
          <BotonIcono key={nombre} nombre={nombre} elegido={elegido} alElegir={alElegir} color={color} />
        ))}
        <button type="button" className="selector-icono-mas" aria-label="Más íconos" onClick={() => setPanel(true)}>
          <IconoMasOpciones />
          <span>Más</span>
        </button>
      </div>

      <PanelInferior
        abierto={panel}
        alCerrar={() => setPanel(false)}
        titulo="Elegir ícono"
        accion={{ texto: 'Listo', alTocar: () => setPanel(false) }}
      >
        <div ref={alMontarCatalogo} className="panel-desplazable">
          {GRUPOS_ICONOS.map(({ titulo, iconos }) => (
            <section key={titulo}>
              <h3 className="selector-icono-grupo">{titulo}</h3>
              <div className="selector-icono-catalogo" role="radiogroup" aria-label={titulo}>
                {iconos.map(([nombre]) => (
                  <BotonIcono key={nombre} nombre={nombre} elegido={elegido} alElegir={alElegir} color={color} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </PanelInferior>
    </>
  );
}
