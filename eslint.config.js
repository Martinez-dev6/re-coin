// Reglas de calidad: las recomendadas de JavaScript y las de los hooks de React. Nada de estilo
// (espacios, comillas): de eso no se encarga el linter.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'design', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, __COMPILACION__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // Estas dos reglas preparan el código para React Compiler, que este proyecto no usa. Marcan
      // dos patrones intencionales: guardar en una ref lo último que mostraba una ventana para que
      // se siga viendo mientras se cierra, y reiniciar un formulario en un efecto al abrirlo (la
      // ventana aún es invisible en ese cuadro). Revisarlas si algún día se activa el compilador.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Configuración y pruebas corren en Node.
    files: ['*.config.js', 'src/**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
]);
