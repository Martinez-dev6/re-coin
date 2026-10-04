// Genera los íconos PNG a partir de public/icono.svg.  Uso: npm run iconos
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// El SVG ya trae el fondo a sangre y el mapache centrado, así que no se añade margen
// extra salvo en el "maskable" (Android lo recorta en círculo: las orejas quedarían fuera).
const fondo = { resizeOptions: { background: '#1e49f0' } };

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0, ...fondo },
    maskable: { ...minimal2023Preset.maskable, padding: 0.18, ...fondo },
    apple: { ...minimal2023Preset.apple, padding: 0, ...fondo },
  },
  images: ['public/icono.svg'],
});
