// Ventanas flotantes de crear o editar una cuenta o una tarjeta (Sesión 9, pedido del dueño: antes
// eran pantallas). Se abren desde cualquier parte con abrirVentana y las muestra VentanasGlobales
// (montado una vez en App), encima de la pantalla en que se esté.
//   abrirVentana('cuenta')             → Nueva cuenta
//   abrirVentana('cuenta', id)         → Editar esa cuenta
//   abrirVentana('tarjeta' [, id])     → Nueva / Editar tarjeta
// Pueden estar las dos a la vez (desde Nueva tarjeta, "Crear una cuenta").
import { useSyncExternalStore } from 'react';

// { cuenta: { abierta, id }, tarjeta: { abierta, id } }. id se queda al cerrar (la ventana se va
// con lo que mostraba).
let estado = { cuenta: { abierta: false, id: null }, tarjeta: { abierta: false, id: null } };
const oyentes = new Set();
const avisar = () => oyentes.forEach((oyente) => oyente());

export function abrirVentana(tipo, id = null) {
  estado = { ...estado, [tipo]: { abierta: true, id } };
  avisar();
}

export function cerrarVentana(tipo) {
  estado = { ...estado, [tipo]: { ...estado[tipo], abierta: false } };
  avisar();
}

export function useVentanas() {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    () => estado,
  );
}
