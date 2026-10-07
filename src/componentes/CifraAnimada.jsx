// Cifra que, al cambiar, cuenta desde el valor de antes hasta el nuevo, con el mismo ritmo del
// saldo de Inicio al abrir (ConteoSaldo: rápido al principio y frenando suave). La primera vez se
// muestra quieta. Se usa al aportar a una meta (pedido del dueño, Sesión 9). Quieta con "Reducir
// movimiento". formato: cómo se escribe cada paso (de entrada, en pesos). desde: la cifra con la que
// aparece (de entrada, valor): si es otra, cuenta hasta valor apenas la pantalla está quieta (el saldo
// de Inicio al volver después de un movimiento, Sesión 13).
import { useEffect, useRef, useState } from 'react';
import { formatearPesos } from '../utilidades/formato.js';
import { sinMovimiento } from '../utilidades/movimiento.js';
import { cuandoQuieta } from '../utilidades/pantallaQuieta.js';

const DURACION_MS = 750;
const frenar = (t) => 1 - Math.pow(1 - t, 4);

export default function CifraAnimada({ valor, desde = valor, formato = formatearPesos }) {
  const [mostrado, setMostrado] = useState(desde);
  const ultimo = useRef(desde); // lo que se ve ahora (de ahí parte el siguiente conteo)

  useEffect(() => {
    const partida = ultimo.current;
    if (partida === valor) return undefined;
    if (sinMovimiento()) {
      ultimo.current = valor;
      setMostrado(valor);
      return undefined;
    }
    let cuadro;
    let respaldo;
    // Mientras la pantalla entra deslizándose no se cuenta: se vería a medias.
    const cancelarEspera = cuandoQuieta(() => {
      const inicio = performance.now();
      const paso = (ahora) => {
        const t = Math.min(1, (ahora - inicio) / DURACION_MS);
        const actual = t < 1 ? Math.round(partida + (valor - partida) * frenar(t)) : valor;
        ultimo.current = actual;
        setMostrado(actual);
        if (t < 1) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
      // Si no llegan cuadros (pantalla oculta), el valor real sale igual.
      respaldo = setTimeout(() => {
        cancelAnimationFrame(cuadro);
        ultimo.current = valor;
        setMostrado(valor);
      }, DURACION_MS + 300);
    });
    return () => {
      cancelarEspera();
      cancelAnimationFrame(cuadro);
      clearTimeout(respaldo);
    };
  }, [valor]);

  return formato(mostrado);
}
