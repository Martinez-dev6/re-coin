// Ventana flotante sobre un fondo oscurecido, como el menú del "+" (pedido del dueño, Sesión 9, para
// editar un movimiento sin salir del detalle). Una tarjeta separada de los bordes que sube un poco
// y crece al entrar (300 ms, curva "entrar") y se va bajando y desvaneciéndose (240 ms, "suave").
// Se cierra tocando el fondo, con Escape o con la X. arriba: lo que va arriba, junto al título (p. ej.
// el valor); children: el resto. tono ('gasto' | 'ingreso' | 'transferencia'): el color sutil de la
// ventana (el valor); sin franja del color del tema, que la cargaba demasiado
// (pedido del dueño, Sesión 9). estilo: variables CSS propias (el color de una cuenta o tarjeta,
// variablesDeColor). pie: lo que va fijo abajo, fuera de lo que se desplaza (p. ej. Guardar).
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOscurecido } from '../estado/useOscurecido.js';
import { bloquearScroll } from '../utilidades/bloquearScroll.js';
import { IconoCerrar } from './iconos.jsx';
import { DURACION_PANEL_MS } from './PanelInferior.jsx';
import './VentanaFlotante.css';

export default function VentanaFlotante({ abierto, alCerrar, titulo, tono, estilo, arriba, pie, children }) {
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);
  const ventana = useRef(null);
  const idTitulo = useId();
  const alCerrarRef = useRef(alCerrar);
  alCerrarRef.current = alCerrar;

  // Como PanelInferior: montar y animar la entrada; animar la salida y desmontar.
  useEffect(() => {
    if (abierto) {
      setMontado(true);
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
    const soltarScroll = bloquearScroll();
    const alPulsar = (evento) => evento.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alPulsar);
    return () => {
      soltarScroll();
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

  useEffect(() => {
    if (!montado || !abierto) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    ventana.current?.focus({ preventScroll: true });
  }, [montado, abierto]);

  if (!montado) return null;

  return createPortal(
    <div className={'ventana-capa' + (visible ? ' visible' : '')}>
      <div className="ventana-fondo" onClick={() => alCerrarRef.current()} />
      <div
        ref={ventana}
        className={'ventana-flotante' + (tono ? ' ' + tono : '')}
        style={estilo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
      >
        <div className="ventana-arriba">
          <div className="ventana-cabecera">
            <h2 id={idTitulo} className="ventana-titulo">
              {titulo}
            </h2>
            <button type="button" className="ventana-cerrar" aria-label="Cerrar" onClick={() => alCerrarRef.current()}>
              <IconoCerrar tamano={20} />
            </button>
          </div>
          {arriba}
        </div>
        <div className="ventana-cuerpo">{children}</div>
        {pie && <div className="ventana-pie">{pie}</div>}
      </div>
    </div>,
    document.body,
  );
}
