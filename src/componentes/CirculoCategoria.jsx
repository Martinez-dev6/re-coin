// Círculo con el ícono y el color de una categoría (o de una meta). 44 px; talla: chico 28,
// mediano 40, grande 56.
// color: letra del par --cat-X / --cat-X-soft del tema; null = gris neutro; 'acento' = color del tema.
import { IconoPorNombre } from './iconosPorNombre.jsx';

const ICONO_POR_TALLA = { chico: 15, mediano: 20, grande: 24 };

export default function CirculoCategoria({ icono, color, tono, mediano = false, talla = mediano ? 'mediano' : undefined }) {
  const estilo =
    color === 'acento'
      ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' }
      : color
        ? { background: `var(--cat-${color}-soft)`, color: `var(--cat-${color})` }
        : { background: 'var(--track)', color: tono ?? 'var(--muted)' };

  return (
    <span className={'circulo-categoria' + (talla ? ' ' + talla : '')} style={estilo} aria-hidden="true">
      <IconoPorNombre nombre={icono} tamano={ICONO_POR_TALLA[talla]} />
    </span>
  );
}
