// Pantallas con barra inferior (las cuatro pestañas y sus subpantallas). La barra la pone
// TransicionPantallas, fuera de la pantalla, para que no se mueva al cambiar de pantalla;
// también es quien lleva cada pantalla al principio (o a donde se dejó, al volver).
// Los formularios (con botón Guardar) van fuera de este contenedor y no muestran la barra.
import { Outlet } from 'react-router';

export default function ConPestanas() {
  return (
    // Espacio al final para que, con el scroll hasta abajo, lo último se vea entero: por encima
    // de la barra, del "+" (sobresale 22 px) y de casi todo el desvanecido, con 18 px de aire.
    // Antes quedaba 6 px sobre la barra y el "+" tapaba la última fila (captura del dueño,
    // 2026-10-04, en Inicio con Metas al final).
    <div style={{ paddingBottom: 'calc(var(--barra-nav-alto) + 40px)' }}>
      <Outlet />
    </div>
  );
}
