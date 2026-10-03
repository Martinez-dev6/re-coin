// Los 10 colores principales, en el orden del diseño. Los nombres solo se usan como
// aria-label: la interfaz nunca muestra nombres de colores.
export const ACENTOS = [
  { valor: '#2a4dff', nombre: 'Azul eléctrico' },
  { valor: '#1e3a8a', nombre: 'Azul marino' },
  { valor: '#8b2fc9', nombre: 'Púrpura' },
  { valor: '#c2185b', nombre: 'Fucsia' },
  { valor: '#d32f2f', nombre: 'Rojo' },
  { valor: '#7a1f3d', nombre: 'Vinotinto' },
  { valor: '#6d4530', nombre: 'Marrón' },
  { valor: '#0a7f77', nombre: 'Verde turquesa' },
  { valor: '#166534', nombre: 'Verde bosque' },
  { valor: '#14151c', nombre: 'Negro' },
];

export const ACENTO_PREDETERMINADO = ACENTOS[0].valor;

export const esAcento = (color) => ACENTOS.some((a) => a.valor === color);

// Círculo del ícono de una cuenta con color propio (variables de aplicarTema.js). Sin color
// propio (Predeterminado) no hace falta: .icono-circulo ya usa el color del tema.
export function estiloIconoCuenta(color) {
  const indice = ACENTOS.findIndex((a) => a.valor === color);
  return indice < 0 ? undefined : { background: `var(--acento${indice}-suave)`, color: `var(--acento${indice}-texto)` };
}

// 'claro' | 'oscuro' | 'auto' (igual que el iPhone)
export const MODOS = ['claro', 'oscuro', 'auto'];
export const MODO_PREDETERMINADO = 'claro';
