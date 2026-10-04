// Saldo grande de Inicio: al abrir la app sube rápido desde cero hasta el valor, como los números
// de un surtidor de gasolina (pedido del dueño, 2026-10-04). Solo la primera vez que se ve Inicio
// después de abrir la app; volver a Inicio no lo repite. Quieto con "Reducir movimiento". Con los
// saldos ocultos Inicio no lo usa.
import { useEffect, useState } from 'react';
import { alTerminarBienvenida } from '../estado/bienvenida.js';
import { formatearPesos } from '../utilidades/formato.js';

const DURACION_MS = 750;
// Empieza un poco después de que la bienvenida empieza a desvanecerse: así se ve desde el principio.
const RETRASO_MS = 120;
// Arranca rápido y frena suave al final (sin rebote): se lee como un conteo, no como un salto.
const frenar = (t) => 1 - Math.pow(1 - t, 4);

let yaConto = false;

export default function ConteoSaldo({ valor }) {
  // null = el valor real; un número = el conteo va por ahí.
  const [conteo, setConteo] = useState(() => (yaConto ? null : 0));

  useEffect(() => {
    if (yaConto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      yaConto = true;
      setConteo(null);
      return;
    }
    let cuadro;
    let espera;
    let respaldo;
    const cancelar = alTerminarBienvenida(() => {
      espera = setTimeout(() => {
        yaConto = true;
        const inicio = performance.now();
        const paso = (ahora) => {
          const t = Math.min(1, (ahora - inicio) / DURACION_MS);
          setConteo(t < 1 ? Math.round(valor * frenar(t)) : null);
          if (t < 1) cuadro = requestAnimationFrame(paso);
        };
        cuadro = requestAnimationFrame(paso);
        // Si no llegan cuadros (pestaña oculta), el valor real sale igual: nunca se queda en $ 0.
        respaldo = setTimeout(() => {
          cancelAnimationFrame(cuadro);
          setConteo(null);
        }, DURACION_MS + 300);
      }, RETRASO_MS);
    });
    return () => {
      cancelar();
      clearTimeout(espera);
      clearTimeout(respaldo);
      cancelAnimationFrame(cuadro);
      // Si se corta a medias (cambió el saldo), queda el valor real de una vez.
      if (yaConto) setConteo(null);
    };
  }, [valor]);

  return formatearPesos(conteo ?? valor);
}
