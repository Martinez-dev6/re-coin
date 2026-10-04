// Pantallas con barra inferior (las cuatro pestañas y sus subpantallas). La barra la pone
// TransicionPantallas, fuera de la pantalla, para que no se mueva al cambiar de pantalla;
// también es quien lleva cada pantalla al principio (o a donde se dejó, al volver).
// Los formularios (con botón Guardar) van fuera de este contenedor y no muestran la barra.
import { Outlet } from 'react-router-dom';

export default function ConPestanas() {
  return (
    // Espacio para que lo último de la lista no quede bajo la barra.
    <div style={{ paddingBottom: 'calc(var(--barra-nav-alto) + 6px)' }}>
      <Outlet />
    </div>
  );
}
