import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Nombre de la app: si cambia, cambiarlo aquí y en index.html (apple-mobile-web-app-title y <title>).
const NOMBRE = 'Sendo';

// Fecha y hora de compilación (hora de Colombia). Sirve para saber qué versión tiene abierta el teléfono.
const COMPILACION = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date());

export default defineConfig({
  define: {
    __COMPILACION__: JSON.stringify(COMPILACION),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // El registro se hace en src/main.jsx para que la página se recargue sola
      // cuando llega una versión nueva (el script inyectado por defecto no lo hace).
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icono.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: NOMBRE,
        short_name: NOMBRE,
        description: 'Finanzas personales: cuentas, movimientos, presupuestos y metas.',
        lang: 'es-CO',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2a4dff',
        background_color: '#f3f4f8',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Con injectRegister: false el plugin no los activa solo. Sin ellos la versión
        // nueva se queda "esperando" y el teléfono sigue mostrando la anterior.
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
