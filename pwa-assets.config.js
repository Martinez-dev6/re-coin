// Genera los íconos PNG a partir de public/icono.svg.  Uso: npm run iconos
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// El SVG ya trae el fondo a sangre y el símbolo dentro de la zona segura,
// así que no se añade margen extra en ningún tamaño.
const sinMargen = { padding: 0, resizeOptions: { background: '#2a4dff' } };

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...sinMargen },
    maskable: { ...minimal2023Preset.maskable, ...sinMargen },
    apple: { ...minimal2023Preset.apple, ...sinMargen },
  },
  images: ['public/icono.svg'],
});
