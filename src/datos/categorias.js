// Categorías: colores elegibles y guardado.
import { db, nuevoId, ordenAlFinal } from './db.js';

// Letras del par --cat-X del tema (valores en COLORES_CATEGORIA_TEMA de aplicarTema.js). Sin la
// 'n': es el gris de los íconos de las opciones (data-tono en comunes.css). Sesión 9 (pedido del
// dueño): 18 colores muy distintos entre sí, en tres filas de seis, ordenados para que ningún vecino
// (al lado, arriba o abajo) se parezca: con CIEDE2000, el par de vecinos más parecido queda en 32.
// aria-label con el nombre: en pantalla solo se ven los círculos.
export const COLORES_CATEGORIA = [
  { valor: 'o', nombre: 'Gris' },
  { valor: 'a', nombre: 'Naranja' },
  { valor: 'b', nombre: 'Cian' },
  { valor: 'r', nombre: 'Vino' },
  { valor: 'v', nombre: 'Oliva' },
  { valor: 'e', nombre: 'Rosa' },
  { valor: 'h', nombre: 'Rojo' },
  { valor: 'u', nombre: 'Esmeralda' },
  { valor: 'm', nombre: 'Fucsia' },
  { valor: 'd', nombre: 'Arena' },
  { valor: 'l', nombre: 'Índigo' },
  { valor: 'f', nombre: 'Verde bosque' },
  { valor: 't', nombre: 'Grafito' },
  { valor: 'g', nombre: 'Azul' },
  { valor: 'p', nombre: 'Dorado' },
  { valor: 'c', nombre: 'Violeta' },
  { valor: 'j', nombre: 'Lima' },
  { valor: 'i', nombre: 'Marrón' },
];

// Letras que ya no se ofrecen (Sesión 9) y la que las reemplaza: Dexie versión 9 y restaurarCopia.
export const COLOR_CATEGORIA_NUEVO = { k: 'u', q: 'b', s: 'l' };
export const colorCategoriaActual = (color) => COLOR_CATEGORIA_NUEVO[color] ?? color;

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
