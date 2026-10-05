// Categorías: colores elegibles y guardado.
import { db, nuevoId, ordenAlFinal } from './db.js';

// Letras del par --cat-X del tema (a–g en tema.js; las demás en COLORES_EXTRA de aplicarTema.js).
// Sin la 'n': es el gris de los íconos de las opciones (data-tono en comunes.css). Las letras no
// cambian nunca (las categorías guardadas y las copias las usan); solo el orden.
// Orden (Sesión 9, pedido del dueño): tres filas de siete en las que ningún color se parece a sus
// vecinos, ni al lado ni arriba o abajo, y un neutro (piedra, gris, grafito) por fila. Se buscó
// con la diferencia de color CIELAB entre vecinos (la menor de todas queda alta).
// aria-label con el nombre: en pantalla solo se ven los círculos.
export const COLORES_CATEGORIA = [
  { valor: 'h', nombre: 'Rojo' },
  { valor: 'k', nombre: 'Turquesa' },
  { valor: 'e', nombre: 'Rosa' },
  { valor: 'q', nombre: 'Celeste' },
  { valor: 'j', nombre: 'Lima' },
  { valor: 'l', nombre: 'Índigo' },
  { valor: 'v', nombre: 'Piedra' },
  { valor: 'o', nombre: 'Gris azulado' },
  { valor: 'a', nombre: 'Naranja' },
  { valor: 'u', nombre: 'Esmeralda' },
  { valor: 'd', nombre: 'Ámbar' },
  { valor: 's', nombre: 'Azul marino' },
  { valor: 'i', nombre: 'Marrón' },
  { valor: 'm', nombre: 'Fucsia' },
  { valor: 'c', nombre: 'Morado' },
  { valor: 'f', nombre: 'Verde' },
  { valor: 'r', nombre: 'Vino' },
  { valor: 'b', nombre: 'Verde azulado' },
  { valor: 'p', nombre: 'Mostaza' },
  { valor: 'g', nombre: 'Azul' },
  { valor: 't', nombre: 'Grafito' },
];

// datos: { nombre, tipo, color, icono }. Sin id = categoría nueva. El tipo no cambia al
// editar: los movimientos ya registrados con ella son de ese tipo.
export async function guardarCategoria(id, datos) {
  const campos = { nombre: datos.nombre.trim(), color: datos.color ?? null, icono: datos.icono };
  if (!campos.nombre) throw new Error('La categoría necesita un nombre.');
  if (id) {
    await db.categorias.update(id, campos);
    return id;
  }
  const nueva = { ...campos, tipo: datos.tipo, id: nuevoId(), orden: ordenAlFinal() };
  await db.categorias.add(nueva);
  return nueva.id;
}

// Sus presupuestos se borran con ella; sus movimientos quedan "Sin categoría".
export function eliminarCategoria(id) {
  return db.transaction('rw', db.categorias, db.presupuestos, async () => {
    await db.presupuestos.where('categoriaId').equals(id).delete();
    await db.categorias.delete(id);
  });
}
