// Avisa cuando la pantalla terminó de entrar deslizándose (TransicionPantallas). Lo que no debe
// pasar a mitad del deslizamiento espera a esto: el cursor de un campo con el foco, en el iPhone,
// iba dando saltos mientras la pantalla se movía.
let enMovimiento = false;
const esperando = new Set();

export function marcarMovimiento(moviendose) {
  enMovimiento = moviendose;
  if (moviendose) return;
  esperando.forEach((avisar) => avisar());
  esperando.clear();
}

// Llama a avisar cuando la pantalla está quieta (ya, si no se está moviendo). Devuelve cómo cancelarlo.
export function cuandoQuieta(avisar) {
  if (!enMovimiento) {
    avisar();
    return () => {};
  }
  esperando.add(avisar);
  return () => esperando.delete(avisar);
}
