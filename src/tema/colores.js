// Los 10 colores principales, en el orden del diseño. Los nombres solo se usan como
// aria-label: la interfaz nunca muestra nombres de colores. Ocho los ajustó el dueño con un
// mezclador (2026-10-04); azul marino y negro siguen como en el diseño.
export const ACENTOS = [
  { valor: '#203fe3', nombre: 'Azul eléctrico' },
  { valor: '#1e3a8a', nombre: 'Azul marino' },
  { valor: '#5c2382', nombre: 'Púrpura' },
  { valor: '#99033b', nombre: 'Fucsia' },
  { valor: '#ab0000', nombre: 'Rojo' },
  { valor: '#5c031a', nombre: 'Vinotinto' },
  { valor: '#522915', nombre: 'Marrón' },
  { valor: '#006660', nombre: 'Verde turquesa' },
  { valor: '#045921', nombre: 'Verde bosque' },
  { valor: '#14151c', nombre: 'Negro' },
];

export const ACENTO_PREDETERMINADO = ACENTOS[0].valor;

// Colores de antes del 2026-10-04 → el que los reemplazó. Lo guardado con un color viejo (el
// color elegido en Apariencia, el de cada cuenta, copias de seguridad) pasa al nuevo al leerlo.
const ANTERIORES = {
  '#2a4dff': '#203fe3',
  '#8b2fc9': '#5c2382',
  '#c2185b': '#99033b',
  '#d32f2f': '#ab0000',
  '#7a1f3d': '#5c031a',
  '#6d4530': '#522915',
  '#0a7f77': '#006660',
  '#166534': '#045921',
};
export const acentoActual = (color) => (typeof color === 'string' ? (ANTERIORES[color.toLowerCase()] ?? color) : color);

export const esAcento = (color) => ACENTOS.some((a) => a.valor === color);

// Variables del color de un ícono (comunes.css): el fondo y el dibujo. El estilo (con brillo o plano)
// y la forma los pone Apariencia para todos.
export const estiloIcono = (fondo, dibujo = '#ffffff') => ({ '--ic-fondo': fondo, '--ic-dibujo': dibujo });

// Ícono con una letra de la paleta de las categorías (--cat-X…).
export const estiloIconoTono = (letra) => estiloIcono(`var(--cat-${letra}-solido)`);

// Ícono de una cuenta con color propio (variables de aplicarTema.js). Sin color propio
// (Predeterminado) no hace falta: los íconos ya usan el color del tema.
export function estiloIconoCuenta(color) {
  const indice = ACENTOS.findIndex((a) => a.valor === color);
  return indice < 0
    ? undefined
    : estiloIcono(`var(--acento${indice}-solido)`, `var(--acento${indice}-sobre)`);
}

// Lo mismo como variables del tema (--accent-soft y --accent-text) para un solo elemento: lo que
// dentro use el color del tema toma el de la cuenta o tarjeta. Sin color, undefined (el del tema).
export function variablesAcento(color) {
  const indice = ACENTOS.findIndex((a) => a.valor === color);
  return indice < 0
    ? undefined
    : {
        '--accent-soft': `var(--acento${indice}-suave)`,
        '--accent-text': `var(--acento${indice}-texto)`,
        ...estiloIconoCuenta(color),
      };
}

// 'claro' | 'oscuro' | 'auto' (igual que el iPhone)
export const MODOS = ['claro', 'oscuro', 'auto'];
export const MODO_PREDETERMINADO = 'claro';
