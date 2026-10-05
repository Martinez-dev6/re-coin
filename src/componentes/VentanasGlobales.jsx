// Las ventanas flotantes que se abren desde cualquier pantalla (estado/ventanas.js): crear o editar
// una cuenta y una tarjeta. Va una sola vez en App, fuera de las pantallas, así no se va con la
// pantalla al navegar. La de cuenta va después: si se abre desde la de tarjeta, queda encima.
import { useRef } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { cerrarVentana, useVentanas } from '../estado/ventanas.js';
import VentanaCuenta from './VentanaCuenta.jsx';
import VentanaTarjeta from './VentanaTarjeta.jsx';

export default function VentanasGlobales() {
  const { cuenta: v1, tarjeta: v2 } = useVentanas();
  const { cuenta, tarjeta } = useDatos();
  // Lo editado se queda mientras la ventana se va (aunque se haya eliminado).
  const ultimaCuenta = useRef(null);
  const ultimaTarjeta = useRef(null);
  if (v1.id && cuenta(v1.id)) ultimaCuenta.current = cuenta(v1.id);
  if (v2.id && tarjeta(v2.id)) ultimaTarjeta.current = tarjeta(v2.id);
  return (
    <>
      <VentanaTarjeta
        tarjeta={v2.id ? ultimaTarjeta.current : undefined}
        abierto={v2.abierta}
        alCerrar={() => cerrarVentana('tarjeta')}
      />
      <VentanaCuenta
        cuenta={v1.id ? ultimaCuenta.current : undefined}
        abierto={v1.abierta}
        alCerrar={() => cerrarVentana('cuenta')}
      />
    </>
  );
}
