// Base de datos local (IndexedDB, con Dexie). Vive solo en este teléfono: si se borra la
// app de la pantalla de inicio, se borra con ella. Para no perder datos: Mi espacio →
// Importar y exportar → Copia de seguridad (src/datos/respaldo.js).
import Dexie from 'dexie';
import { CATEGORIAS_INICIALES } from './categoriasIniciales.js';

export const db = new Dexie('sendo');

// Solo se indexan los campos por los que se busca u ordena. Para añadir tablas o índices
// se declara una versión nueva (db.version(2)…) y no se toca esta.
//   cuentas:    id, nombre, tipo, saldoInicial, icono, incluirEnSaldo, orden
//   categorias: id, nombre, tipo ('gasto' | 'ingreso'), color, icono, orden
db.version(1).stores({
  cuentas: 'id, orden',
  categorias: 'id, tipo, orden',
});

// Solo la primera vez que se crea la base de datos. Las nuevas toman orden = Date.now()
// (ordenAlFinal), así que "Otros" lleva un orden mayor para seguir de último.
const ORDEN_ULTIMAS = 9e15;
db.on('populate', (tx) =>
  tx.table('categorias').bulkAdd(
    CATEGORIAS_INICIALES.map(({ alFinal, ...c }, i) => ({
      ...c,
      id: nuevoId(),
      orden: (alFinal ? ORDEN_ULTIMAS : 0) + i + 1,
    })),
  ),
);

// Identificadores de texto únicos: sirven igual cuando haya sincronización (Supabase).
export const nuevoId = () => crypto.randomUUID();

// Lo nuevo va al final de su lista (en categorías, antes de "Otros").
export const ordenAlFinal = () => Date.now();

// Pide al navegador que no borre los datos por falta de espacio. En el iPhone las apps
// añadidas a la pantalla de inicio ya se tratan así; en otros navegadores ayuda.
export function pedirAlmacenamientoPersistente() {
  navigator.storage?.persist?.().catch(() => {});
}
