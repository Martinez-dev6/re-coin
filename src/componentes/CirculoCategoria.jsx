// Círculo con el ícono y el color de una categoría (o de una meta). 44 px; talla: chico 28,
// mediano 40, grande 56.
// color: letra de la paleta (--cat-X); null = gris; 'acento' = color del tema. tono 'ingreso': sin
// categoría, de verde. Sigue el estilo y la forma de los íconos de Apariencia (comunes.css).
import { estiloIcono, estiloIconoTono } from '../tema/colores.js';
import { IconoPorNombre } from './iconosPorNombre.jsx';

const ICONO_POR_TALLA = { chico: 15, mediano: 20, grande: 24 };

export default function CirculoCategoria({ icono, color, tono, mediano = false, talla = mediano ? 'mediano' : undefined }) {
  const estilo =
    color === 'acento'
      ? undefined
      : color
        ? estiloIconoTono(color)
        : tono === 'ingreso'
          ? estiloIcono('var(--income-on-white)', 'var(--track)', 'var(--income)')
          : estiloIcono('var(--icono-gris)', 'var(--track)', 'var(--muted)');

  return (
    <span className={'circulo-categoria' + (talla ? ' ' + talla : '')} style={estilo} aria-hidden="true">
      <IconoPorNombre nombre={icono} tamano={ICONO_POR_TALLA[talla]} />
    </span>
  );
}
