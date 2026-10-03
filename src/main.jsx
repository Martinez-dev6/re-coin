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
import { aplicarVarianteFranja, leerVarianteFranja } from './estado/pruebaFranja.js';
import App from './App.jsx';

// Service worker: guarda la app para usarla sin conexión. Cuando hay una versión
// nueva publicada, la instala y recarga la página para mostrarla de inmediato.
registerSW({ immediate: true });

// Colores del tema guardado antes del primer pintado.
const preferencias = leerPreferencias();
aplicarTema(preferencias.acento, esOscuro(preferencias.modo));
aplicarVarianteFranja(leerVarianteFranja()); // prueba temporal

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <MesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MesProvider>
    </TemaProvider>
  </StrictMode>,
);
