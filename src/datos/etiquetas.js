// Etiquetas: agrupan movimientos de distintas categorías (por ejemplo, todo lo del carro).
import { db, nuevoId, ordenAlFinal } from './db.js';

// Sin id = etiqueta nueva. Devuelve el id. Si ya hay una con ese nombre (sin importar
// mayúsculas), devuelve esa en vez de crear otra igual.
export async function guardarEtiqueta(id, nombre) {
  const limpio = nombre.trim();
  if (!limpio) throw new Error('La etiqueta necesita un nombre.');
  const igual = (await db.etiquetas.toArray()).find(
    (e) => e.id !== id && e.nombre.toLocaleLowerCase('es') === limpio.toLocaleLowerCase('es'),
  );
  if (igual) {
    if (!id) return igual.id;
    throw new Error(`Ya existe la etiqueta «${igual.nombre}».`);
  }
  if (id) {
    await db.etiquetas.update(id, { nombre: limpio });
    return id;
  }
  const nueva = { id: nuevoId(), nombre: limpio, orden: ordenAlFinal() };
  await db.etiquetas.add(nueva);
  return nueva.id;
}

// Se quita también de los movimientos que la tenían, en una sola operación.
export function eliminarEtiqueta(id) {
  return db.transaction('rw', db.etiquetas, db.movimientos, async () => {
    await db.movimientos
      .where('etiquetaIds')
      .equals(id)
      .modify((m) => {
        m.etiquetaIds = m.etiquetaIds.filter((e) => e !== id);
      });
    await db.etiquetas.delete(id);
  });
}
