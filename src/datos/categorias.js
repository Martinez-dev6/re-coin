// Categorías: colores elegibles y guardado.
import { db, nuevoId, ordenAlFinal } from './db.js';

// Letras del par --cat-X del tema, en el orden del diseño (design/html/NuevaCategoria.html).
// aria-label con el nombre: en pantalla solo se ven los círculos.
export const COLORES_CATEGORIA = [
  { valor: 'a', nombre: 'Naranja' },
  { valor: 'b', nombre: 'Verde azulado' },
  { valor: 'c', nombre: 'Morado' },
  { valor: 'd', nombre: 'Ámbar' },
  { valor: 'e', nombre: 'Rosa' },
  { valor: 'f', nombre: 'Verde' },
  { valor: 'g', nombre: 'Azul' },
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

export const eliminarCategoria = (id) => db.categorias.delete(id);
