// Cifra que, al cambiar, cuenta desde el valor de antes hasta el nuevo, con el mismo ritmo del
// saldo de Inicio al abrir (ConteoSaldo: rápido al principio y frenando suave). La primera vez se
// muestra quieta. Se usa al aportar a una meta (pedido del dueño, Sesión 9). Quieta con "Reducir
// movimiento". formato: cómo se escribe cada paso (de entrada, en pesos).
import { useEffect, useRef, useState } from 'react';
import { formatearPesos } from '../utilidades/formato.js';
import { sinMovimiento } from '../utilidades/movimiento.js';

const DURACION_MS = 750;
const frenar = (t) => 1 - Math.pow(1 - t, 4);

export default function CifraAnimada({ valor, formato = formatearPesos }) {
  const [mostrado, setMostrado] = useState(valor);
  const ultimo = useRef(valor); // lo que se ve ahora (de ahí parte el siguiente conteo)

  useEffect(() => {
    const desde = ultimo.current;
    if (desde === valor) return undefined;
    if (sinMovimiento()) {
      ultimo.current = valor;
      setMostrado(valor);
      return undefined;
    }
    const inicio = performance.now();
    let cuadro;
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / DURACION_MS);
      const actual = t < 1 ? Math.round(desde + (valor - desde) * frenar(t)) : valor;
      ultimo.current = actual;
      setMostrado(actual);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    // Si no llegan cuadros (pantalla oculta), el valor real sale igual.
    const respaldo = setTimeout(() => {
      cancelAnimationFrame(cuadro);
      ultimo.current = valor;
      setMostrado(valor);
    }, DURACION_MS + 300);
    return () => {
      cancelAnimationFrame(cuadro);
      clearTimeout(respaldo);
    };
  }, [valor]);

  return formato(mostrado);
}
