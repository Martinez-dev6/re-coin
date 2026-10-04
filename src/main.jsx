import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

// Plus Jakarta Sans servida desde la propia app (funciona sin conexión).
// Solo el subconjunto latino: cubre tildes, ñ, ¿ y ¡.
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';

import './estilos/base.css';
import './estilos/comunes.css';
import { aplicarTema } from './tema/aplicarTema.js';
import { esOscuro, leerPreferencias } from './tema/preferencias.js';
import { TemaProvider } from './tema/TemaContext.jsx';
import { MesProvider } from './estado/MesContext.jsx';
import { DatosProvider } from './datos/DatosContext.jsx';
import { pedirAlmacenamientoPersistente } from './datos/db.js';
import { terminarBienvenida } from './estado/bienvenida.js';
import App from './App.jsx';

// Service worker: guarda la app para usarla sin conexión. Cuando hay una versión
// nueva publicada, la instala y recarga la página para mostrarla de inmediato.
registerSW({ immediate: true });

// Colores del tema guardado antes del primer pintado.
const preferencias = leerPreferencias();
aplicarTema(preferencias.acento, esOscuro(preferencias.modo));

pedirAlmacenamientoPersistente();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <DatosProvider>
        <MesProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MesProvider>
      </DatosProvider>
    </TemaProvider>
  </StrictMode>,
);

// Pantalla de bienvenida (index.html): se ve al menos 900 ms desde que se abrió la app y se
// desvanece cuando la app ya está dibujada debajo (dos cuadros después de montarla).
const bienvenida = document.getElementById('bienvenida');
if (bienvenida) {
  let salio = false;
  const salir = () => {
    if (salio) return;
    salio = true;
    terminarBienvenida();
    bienvenida.classList.add('bienvenida-saliendo');
    // Respaldo por si no llega transitionend (navegador en segundo plano, Reducir movimiento).
    const quitar = () => bienvenida.remove();
    bienvenida.addEventListener('transitionend', quitar, { once: true });
    setTimeout(quitar, 700);
  };
  setTimeout(() => {
    requestAnimationFrame(() => requestAnimationFrame(salir));
    // Si no llegan cuadros (pestaña oculta), sale igual: nunca se queda pegada.
    setTimeout(salir, 150);
  }, Math.max(0, 900 - performance.now()));
}
