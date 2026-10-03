// Panel que sube desde abajo sobre un fondo oscurecido (estilo de SelectorCuenta en el diseño).
// Se cierra tocando el fondo o con Escape.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './PanelInferior.css';

const DURACION_MS = 220;

export default function PanelInferior({ abierto, alCerrar, titulo, children }) {
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
      const cuadro = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(cuadro);
    }
    setVisible(false);
    const espera = setTimeout(() => setMontado(false), DURACION_MS);
    return () => clearTimeout(espera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const raiz = document.documentElement;
    raiz.dataset.panelAbierto = ''; // oscurece también la barra de estado
    document.body.style.overflow = 'hidden';
    const alPulsar = (evento) => evento.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alPulsar);
    panel.current?.focus();
    return () => {
      delete raiz.dataset.panelAbierto;
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

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
        <h2 id={idTitulo} className="panel-titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
