// Saldo grande de Inicio: al abrir la app sube rápido desde cero hasta el valor, como los números
// de un surtidor de gasolina (pedido del dueño, 2026-10-04). Solo la primera vez que se ve Inicio
// después de abrir la app; volver a Inicio no lo repite. Después, al cambiar el valor (otro mes:
// el saldo estimado, Sesión 10), cuenta desde el de antes hasta el nuevo (CifraAnimada). Quieto con
// "Reducir movimiento". Con los saldos ocultos Inicio no lo usa.
// Al volver a Inicio después de un movimiento que cambió el saldo (un gasto, un ingreso, marcar algo
// como pagado, una transferencia a una cuenta que no suma), cuenta desde el saldo que se vio la
// última vez hasta el nuevo, una sola vez (pedido del dueño, Sesión 13). clave: el mes que se mira;
// si al volver es otro mes, no cuenta desde el de antes.
import { useEffect, useState } from 'react';
import { alTerminarBienvenida } from '../estado/bienvenida.js';
import CifraAnimada from './CifraAnimada.jsx';
import { formatearPesos } from '../utilidades/formato.js';

const DURACION_MS = 750;
// Empieza un poco después de que la bienvenida empieza a desvanecerse: así se ve desde el principio.
const RETRASO_MS = 120;
// Arranca rápido y frena suave al final (sin rebote): se lee como un conteo, no como un salto.
const frenar = (t) => 1 - Math.pow(1 - t, 4);

let yaConto = false;
// El último saldo que se vio en Inicio, y de qué mes.
let visto = null;

export default function ConteoSaldo({ valor, clave }) {
  // null = el valor real; un número = el conteo va por ahí.
  const [conteo, setConteo] = useState(() => (yaConto ? null : 0));
  // Con qué cifra aparece: la que se vio la última vez en este mes (luego cuenta hasta valor).
  const [desde] = useState(() => (visto && visto.clave === clave ? visto.valor : valor));
  useEffect(() => {
    visto = { clave, valor };
  }, [clave, valor]);

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

  return conteo === null ? <CifraAnimada valor={valor} desde={desde} /> : formatearPesos(conteo);
}
