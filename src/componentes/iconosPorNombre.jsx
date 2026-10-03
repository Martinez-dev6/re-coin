// Íconos que se guardan por nombre en la base de datos (categorías, cuentas, metas).
// Los nombres no se pueden cambiar: los datos ya guardados y las copias de seguridad los usan.
import {
  IconoAlcancia,
  IconoAvion,
  IconoBanco,
  IconoBilletera,
  IconoBolsa,
  IconoCarrito,
  IconoCasa,
  IconoCategorias,
  IconoCorazon,
  IconoDiana,
  IconoEfectivo,
  IconoEscudo,
  IconoEstrella,
  IconoGasolina,
  IconoLibro,
  IconoMaletin,
  IconoMoneda,
  IconoPastel,
  IconoPortatil,
  IconoRayo,
  IconoRegalo,
  IconoTarjeta,
  IconoTendencia,
} from './iconos.jsx';

export const ICONOS = {
  // Categorías
  carrito: IconoCarrito,
  gasolina: IconoGasolina,
  rayo: IconoRayo,
  libro: IconoLibro,
  corazon: IconoCorazon,
  estrella: IconoEstrella,
  casa: IconoCasa,
  regalo: IconoRegalo,
  maletin: IconoMaletin,
  portatil: IconoPortatil,
  bolsa: IconoBolsa,
  tendencia: IconoTendencia,
  avion: IconoAvion,
  escudo: IconoEscudo,
  cuadricula: (p) => <IconoCategorias tamano={22} {...p} />,
  // Cuentas
  banco: IconoBanco,
  billetera: IconoBilletera,
  efectivo: IconoEfectivo,
  alcancia: IconoAlcancia,
  tarjeta: IconoTarjeta,
  moneda: IconoMoneda,
  // Filas "General" de Planes
  pastel: IconoPastel,
  diana: IconoDiana,
};

// Para elegir en los formularios, en este orden.
export const ICONOS_CATEGORIA = [
  'carrito',
  'gasolina',
  'rayo',
  'libro',
  'corazon',
  'estrella',
  'casa',
  'regalo',
  'maletin',
  'portatil',
  'bolsa',
  'tendencia',
  'avion',
  'escudo',
  'moneda',
  'cuadricula',
];

export const ICONOS_CUENTA = ['banco', 'billetera', 'efectivo', 'alcancia', 'tarjeta', 'moneda', 'maletin', 'tendencia'];

// Para lectores de pantalla.
export const ETIQUETAS_ICONO = {
  carrito: 'Carrito',
  gasolina: 'Gasolina',
  rayo: 'Rayo',
  libro: 'Libro',
  corazon: 'Corazón',
  estrella: 'Estrella',
  casa: 'Casa',
  regalo: 'Regalo',
  maletin: 'Maletín',
  portatil: 'Portátil',
  bolsa: 'Bolsa',
  tendencia: 'Tendencia',
  avion: 'Avión',
  escudo: 'Escudo',
  cuadricula: 'Cuadrícula',
  banco: 'Banco',
  billetera: 'Billetera',
  efectivo: 'Billete',
  alcancia: 'Alcancía',
  tarjeta: 'Tarjeta',
  moneda: 'Moneda',
  pastel: 'Gráfico',
  diana: 'Diana',
};

// Sin tamano, cada ícono usa el suyo (pasar tamano={undefined} pisaría el de cuadricula).
export function IconoPorNombre({ nombre, tamano }) {
  const Icono = ICONOS[nombre] ?? ICONOS.cuadricula;
  return tamano ? <Icono tamano={tamano} /> : <Icono />;
}
