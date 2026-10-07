// Círculo con el ícono y el color de una categoría (o de una meta). 44 px; talla: chico 28,
// mediano 40, grande 56.
// color: letra de --cat-X-solido del tema; null = gris (o tono, un color sólido); 'acento' = color del
// tema. Fondo sólido y dibujo en blanco, como los íconos de iOS 27 (Sesión 13).
import { IconoPorNombre } from './iconosPorNombre.jsx';

const ICONO_POR_TALLA = { chico: 15, mediano: 20, grande: 24 };

export default function CirculoCategoria({ icono, color, tono, mediano = false, talla = mediano ? 'mediano' : undefined }) {
  const estilo =
    color === 'acento'
      ? { backgroundColor: 'var(--icono-fondo)', color: 'var(--icono-texto)' }
      : color
        ? { backgroundColor: `var(--cat-${color}-solido)`, color: '#ffffff' }
        : { backgroundColor: tono ?? 'var(--icono-gris)', color: '#ffffff' };

  return (
    <span className={'circulo-categoria' + (talla ? ' ' + talla : '')} style={estilo} aria-hidden="true">
      <IconoPorNombre nombre={icono} tamano={ICONO_POR_TALLA[talla]} />
    </span>
  );
}
