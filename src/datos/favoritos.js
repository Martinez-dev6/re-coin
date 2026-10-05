// Movimientos favoritos (pedido del dueño, 2026-10-04): el corazón junto a la descripción guarda
// cómo se registró un movimiento (descripción, categoría, cuenta o tarjeta, etiquetas,
// observación), sin el valor ni la fecha. Al escribir la descripción de otro movimiento del mismo
// tipo, los favoritos que coinciden salen debajo y tocar uno llena el formulario con lo guardado.
// Uno por tipo y descripción (sin importar tildes ni mayúsculas).
import { normalizar } from './buscar.js';
import { db, nuevoId } from './db.js';

// Lo que se guarda del movimiento (el resto lo pone cada vez quien lo registra).
const CAMPOS = ['tipo', 'descripcion', 'categoriaId', 'cuentaId', 'cuentaDestinoId', 'tarjetaId', 'cuotas', 'etiquetaIds', 'observacion'];

const clave = (texto) => normalizar((texto ?? '').trim());

// El favorito de ese tipo con esa descripción, o undefined.
export const favoritoDe = (favoritos, tipo, descripcion) =>
  clave(descripcion) ? favoritos.find((f) => f.tipo === tipo && clave(f.descripcion) === clave(descripcion)) : undefined;

// Los que coinciden con lo escrito (empiezan por eso o alguna palabra empieza por eso), los
// usados más recientemente primero. No sale el que ya es igual a lo escrito.
export function sugerirFavoritos(favoritos, tipo, texto, maximo = 3) {
  const buscado = clave(texto);
  if (!buscado) return [];
  return favoritos
    .filter((f) => f.tipo === tipo && clave(f.descripcion) !== buscado)
    .filter((f) => {
      const descripcion = clave(f.descripcion);
      return descripcion.startsWith(buscado) || descripcion.includes(' ' + buscado);
    })
    .sort((a, b) => (b.usado ?? 0) - (a.usado ?? 0))
    .slice(0, maximo);
}

// Al guardar el movimiento: con el corazón marcado, crea o actualiza su favorito; sin marcar,
// quita el que hubiera con esa descripción.
export async function guardarFavorito(datos, marcado) {
  const todos = await db.favoritos.where('tipo').equals(datos.tipo).toArray();
  const existente = favoritoDe(todos, datos.tipo, datos.descripcion);
  if (!marcado) {
    if (existente) await db.favoritos.delete(existente.id);
    return;
  }
  if (!clave(datos.descripcion)) return;
  const campos = Object.fromEntries(CAMPOS.map((campo) => [campo, datos[campo] ?? null]));
  campos.descripcion = datos.descripcion.trim();
  campos.etiquetaIds = datos.etiquetaIds ?? [];
  campos.usado = Date.now();
  await db.favoritos.put({ ...campos, id: existente?.id ?? nuevoId() });
}

// Al elegir una sugerencia: queda como la usada más recientemente.
export const usarFavorito = (id) => db.favoritos.update(id, { usado: Date.now() });
