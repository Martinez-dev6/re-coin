// Base de datos local (IndexedDB, con Dexie). Vive solo en este teléfono: si se borra la
// app de la pantalla de inicio, se borra con ella. Para no perder datos: Mi espacio →
// Importar y exportar → Copia de seguridad (src/datos/respaldo.js).
import Dexie from 'dexie';
import { CATEGORIAS_INICIALES } from './categoriasIniciales.js';

export const db = new Dexie('sendo');

// Solo se indexan los campos por los que se busca u ordena. Para añadir tablas o índices
// se declara una versión nueva (db.version(2)…) y no se toca esta.
//   cuentas:    id, nombre, tipo, saldoInicial, icono, color (null = el del tema), incluirEnSaldo, orden
//   categorias: id, nombre, tipo ('gasto' | 'ingreso'), color, icono, orden
db.version(1).stores({
  cuentas: 'id, orden',
  categorias: 'id, tipo, orden',
});

// Paso 5 (2026-10-03).
//   movimientos: id, tipo ('gasto' | 'ingreso' | 'transferencia'), valor (pesos, entero > 0),
//                descripcion, categoriaId (null en transferencias), cuentaId (en transferencias,
//                la de origen), cuentaDestinoId (solo transferencias), fecha ('AAAA-MM-DD'),
//                pagado (las transferencias siempre true), etiquetaIds [], observacion, creado
//                (Date.now(), para ordenar los del mismo día)
//   etiquetas:   id, nombre, orden
db.version(2).stores({
  movimientos: 'id, fecha, cuentaId, cuentaDestinoId, categoriaId, *etiquetaIds',
  etiquetas: 'id, orden',
});

// Paso 7a: tarjetas de crédito (2026-10-03). Ver tarjetas.js.
//   tarjetas:    id, nombre, cupo, diaCierre, diaPago, cuentaPagoId (null = sin elegir), icono, orden
//   movimientos, dos tipos más:
//     'gastoTarjeta': compra con tarjeta. tarjetaId, cuotas (1 o más), factura ('AAAA-MM' de la
//                     primera cuota). cuentaId null: no toca las cuentas. pagado siempre true.
//     'pagoTarjeta':  pago de una factura. cuentaId (de dónde sale), tarjetaId, factura.
db.version(3).stores({
  movimientos: 'id, fecha, cuentaId, cuentaDestinoId, categoriaId, *etiquetaIds, tarjetaId',
  tarjetas: 'id, orden',
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
