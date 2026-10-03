// Panel que sube desde abajo sobre un fondo oscurecido (estilo de SelectorCuenta en el diseño).
// Se cierra tocando el fondo, con Escape o con el botón opcional de la derecha del título
// (accion: { texto, alTocar }, en la posición del "+ Nueva" del diseño).
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOscurecido } from '../estado/useOscurecido.js';
import './PanelInferior.css';

// Lo que tarda en bajar al cerrarse. Quien navega después de cerrar un panel espera esto,
// para que no desaparezca de golpe con la pantalla.
export const DURACION_PANEL_MS = 220;

export default function PanelInferior({ abierto, alCerrar, titulo, accion, children }) {
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);
  const panel = useRef(null);
  const idTitulo = useId();
  const alCerrarRef = useRef(alCerrar);
  alCerrarRef.current = alCerrar;

  // Montar, animar la entrada; animar la salida y desmontar.
  useEffect(() => {
    if (abierto) {
      setMontado(true);
      // Dos cuadros, para que el navegador pinte el estado inicial antes de animar. Se
      // cancela el que esté pendiente: si se cerrara entre los dos, "visible" quedaría encendido.
      let cuadro = requestAnimationFrame(() => {
        cuadro = requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(cuadro);
    }
    setVisible(false);
    const espera = setTimeout(() => setMontado(false), DURACION_PANEL_MS);
    return () => clearTimeout(espera);
  }, [abierto]);

  useOscurecido(montado, visible); // la franja de la barra de estado acompaña al oscurecido

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = 'hidden';
    const alPulsar = (evento) => evento.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

  // Al abrir, el foco pasa al panel: el campo que lo tenía lo suelta y en el iPhone se
  // cierra el teclado (si no, quedaría encima del panel). Espera a que el panel exista.
  useEffect(() => {
    if (!montado || !abierto) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    panel.current?.focus({ preventScroll: true });
  }, [montado, abierto]);

  if (!montado) return null;

  return createPortal(
    <div className={'panel-capa' + (visible ? ' visible' : '')}>
      <div className="panel-fondo" onClick={() => alCerrarRef.current()} />
      <div
        ref={panel}
        className="panel-inferior"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
      >
        <div className="panel-asa" />
        <div className="panel-cabecera">
          <h2 id={idTitulo} className="panel-titulo">
            {titulo}
          </h2>
          {accion && (
            <button type="button" className="boton-texto panel-accion" onClick={accion.alTocar}>
              {accion.texto}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
