// Círculo de 44 px con el ícono y el color de una categoría (o de una meta).
// color: letra del par --cat-X / --cat-X-soft del tema; null = gris neutro.
import {
  IconoAvion,
  IconoCarrito,
  IconoCategorias,
  IconoDiana,
  IconoEscudo,
  IconoFlechaArriba,
  IconoGasolina,
  IconoLibro,
  IconoPastel,
  IconoPortatil,
  IconoRayo,
} from './iconos.jsx';

const ICONOS = {
  carrito: IconoCarrito,
  gasolina: IconoGasolina,
  libro: IconoLibro,
  rayo: IconoRayo,
  cuadricula: (p) => <IconoCategorias tamano={22} {...p} />,
  ingreso: (p) => <IconoFlechaArriba tamano={22} grosor={2} {...p} />,
  pastel: IconoPastel,
  diana: IconoDiana,
  escudo: IconoEscudo,
  portatil: IconoPortatil,
  avion: IconoAvion,
};

export default function CirculoCategoria({ icono, color, tono }) {
  const Icono = ICONOS[icono] ?? ICONOS.cuadricula;
  const estilo =
    color === 'acento'
      ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' }
      : color
        ? { background: `var(--cat-${color}-soft)`, color: `var(--cat-${color})` }
        : { background: 'var(--track)', color: tono ?? 'var(--muted)' };

  return (
    <span className="circulo-categoria" style={estilo} aria-hidden="true">
      <Icono />
    </span>
  );
}
