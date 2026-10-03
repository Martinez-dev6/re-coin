// Categorías con las que arranca la app (las de design/capturas/Categorias*.png).
// Se pueden editar y borrar; solo se crean la primera vez que se abre la base de datos.
// color: letra del par --cat-X del tema (a naranja, b verde azulado, c morado, d ámbar,
// e rosa, f verde, g azul); null = gris neutro. alFinal: queda último aunque se creen otras.

export const CATEGORIAS_INICIALES = [
  { tipo: 'gasto', nombre: 'Alimentos', icono: 'carrito', color: 'b' },
  { tipo: 'gasto', nombre: 'Transporte', icono: 'gasolina', color: 'a' },
  { tipo: 'gasto', nombre: 'Servicios', icono: 'rayo', color: 'd' },
  { tipo: 'gasto', nombre: 'Educación', icono: 'libro', color: 'c' },
  { tipo: 'gasto', nombre: 'Salud', icono: 'corazon', color: 'e' },
  { tipo: 'gasto', nombre: 'Ocio', icono: 'estrella', color: 'f' },
  { tipo: 'gasto', nombre: 'Hogar', icono: 'casa', color: 'g' },
  { tipo: 'gasto', nombre: 'Otros', icono: 'cuadricula', color: null, alFinal: true },
  { tipo: 'ingreso', nombre: 'Trabajo', icono: 'maletin', color: 'b' },
  { tipo: 'ingreso', nombre: 'Freelance', icono: 'portatil', color: 'c' },
  { tipo: 'ingreso', nombre: 'Ventas', icono: 'bolsa', color: 'a' },
  { tipo: 'ingreso', nombre: 'Regalos', icono: 'regalo', color: 'e' },
  { tipo: 'ingreso', nombre: 'Inversiones', icono: 'tendencia', color: 'f' },
  { tipo: 'ingreso', nombre: 'Otros', icono: 'cuadricula', color: null, alFinal: true },
];
