// Círculo de 44 px con el ícono y el color de una categoría (o de una meta).
// color: letra del par --cat-X / --cat-X-soft del tema; null = gris neutro; 'acento' = color del tema.
import { IconoPorNombre } from './iconosPorNombre.jsx';

export default function CirculoCategoria({ icono, color, tono, mediano = false }) {
  const estilo =
    color === 'acento'
      ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' }
      : color
        ? { background: `var(--cat-${color}-soft)`, color: `var(--cat-${color})` }
        : { background: 'var(--track)', color: tono ?? 'var(--muted)' };

  return (
    <span className={'circulo-categoria' + (mediano ? ' mediano' : '')} style={estilo} aria-hidden="true">
      <IconoPorNombre nombre={icono} tamano={mediano ? 20 : undefined} />
    </span>
  );
}
