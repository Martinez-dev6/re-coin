// Botón de guardar o confirmar con animación de "listo" (pedido del dueño, 2026-10-04): al tocarlo,
// el botón se encoge hasta un círculo de su mismo color, se dibuja un chulo y el teléfono vibra
// suave. Rápido y sin rebotes; los tiempos están en comunes.css (.boton-exito).
// - alTocar: hace las comprobaciones. Devuelve false si falta algo (no hay animación ni vibración;
//   el formulario avisa); si no, devuelve la promesa de lo que guarda (o nada).
// - alTerminar: cuando terminan la animación y el guardado (volver, cerrar el panel…).
// El estado final queda en clases y estilos del botón, no en una animación de JavaScript: así la
// copia de la pantalla que se usa al volver (TransicionPantallas) lo muestra ya con el chulo.
import { useEffect, useRef, useState } from 'react';
import { sinMovimiento } from '../utilidades/movimiento.js';
import { vibrar } from '../utilidades/vibrar.js';

// Encoger (280 ms), dibujar el chulo (desde los 200 ms, 220 ms) y un instante para verlo.
const DURACION_MS = 540;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export default function BotonExito({ alTocar, alTerminar, className = '', disabled, children, ...resto }) {
  const boton = useRef(null);
  const [recorte, setRecorte] = useState(null); // px que se recortan de cada lado; null = en reposo
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const tocar = async () => {
    if (recorte !== null) return;
    const resultado = alTocar();
    if (resultado === false) return;
    vibrar();
    const animar = !sinMovimiento();
    if (animar) {
      const { width, height } = boton.current.getBoundingClientRect();
      setRecorte(Math.max(0, (width - height) / 2 - 1));
    }
    try {
      await Promise.all([resultado, animar && esperar(DURACION_MS)]);
    } catch (error) {
      if (montado.current) setRecorte(null);
      throw error;
    }
    // Si ya se salió (atrás, tocar fuera del panel), no se vuelve a navegar ni a cerrar nada.
    if (montado.current) alTerminar?.();
  };

  const enExito = recorte !== null;
  return (
    <button
      ref={boton}
      type="button"
      {...resto}
      className={'boton-exito ' + className + (enExito ? ' exito' : '')}
      style={enExito ? { ...resto.style, '--recorte': `${recorte}px` } : resto.style}
      // Mientras anima no se ve "apagado" aunque lo que guardó ya cambió los datos.
      disabled={enExito ? false : disabled}
      aria-busy={enExito || undefined}
      onClick={tocar}
    >
      <span className="boton-exito-texto">{children}</span>
      <svg className="boton-exito-chulo" width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
