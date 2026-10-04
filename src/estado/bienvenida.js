// Aviso de que la pantalla de bienvenida (index.html) empezó a irse: lo que quiera animarse al
// abrir la app (el saldo de Inicio) espera a esto para que se vea y no quede tapado.
let fuera = !document.getElementById('bienvenida');
const esperando = new Set();

export function terminarBienvenida() {
  fuera = true;
  esperando.forEach((avisar) => avisar());
  esperando.clear();
}

// Llama a avisar cuando la bienvenida empieza a irse (o ya, si no hay). Devuelve cómo cancelarlo.
export function alTerminarBienvenida(avisar) {
  if (fuera) {
    avisar();
    return () => {};
  }
  esperando.add(avisar);
  return () => esperando.delete(avisar);
}
