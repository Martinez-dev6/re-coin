// Pantallas con barra inferior (las cuatro pestañas y sus subpantallas).
// Los formularios (con botón Guardar) van fuera de este contenedor y no muestran la barra.
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BarraNavegacion from './BarraNavegacion.jsx';

export default function ConPestanas() {
  const { pathname } = useLocation();

  // Cada pantalla empieza arriba (si no, heredaría el scroll de la anterior).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {/* Espacio para que lo último de la lista no quede bajo la barra de 90 px. */}
      <div style={{ paddingBottom: 96 }}>
        <Outlet />
      </div>
      <BarraNavegacion />
    </>
  );
}
