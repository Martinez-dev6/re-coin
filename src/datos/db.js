// Base de datos local (IndexedDB, con Dexie). Vive solo en este teléfono: si se borra la
// app de la pantalla de inicio, se borra con ella. Para no perder datos: Mi espacio →
// Importar y exportar → Copia de seguridad (src/datos/respaldo.js).
import Dexie from 'dexie';
import { acentoActual } from '../tema/colores.js';
import { sumarMeses } from '../utilidades/fechas.js';
import { CATEGORIAS_INICIALES } from './categoriasIniciales.js';

export const db = new Dexie('sendo');

// Solo se indexan los campos por los que se busca u ordena. Para añadir tablas o índices
// se declara una versión nueva (db.version(2)…) y no se toca esta.
//   cuentas:    id, nombre, tipo, saldoInicial, icono, color (null = el del tema), incluirEnSaldo, orden,
//               ajuste (2026-10-04, opcional: lo que se corrigió con Reajustar saldo; ver cuentas.js)
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

// La factura pasa a nombrarse por el mes en que se paga, no por el mes en que cierra (2026-10-03).
// Solo cambia en las tarjetas que se pagan el mes siguiente al cierre (día de pago ≤ día de cierre).
db.version(4)
  .stores({})
  .upgrade(async (tx) => {
    const tarjetas = await tx.table('tarjetas').toArray();
    const alMesSiguiente = tarjetas.filter((t) => t.diaPago <= t.diaCierre).map((t) => t.id);
    if (alMesSiguiente.length === 0) return;
    await tx
      .table('movimientos')
      .where('tarjetaId')
      .anyOf(alMesSiguiente)
      .modify((m) => {
        if (m.factura) m.factura = sumarMeses(m.factura, 1);
      });
  });

// Paso 7b: Planes (2026-10-03). Ver presupuestos.js, metas.js y programados.js.
//   presupuestos: id, categoriaId, limite, desde ('AAAA-MM'), repetir (true = todos los meses
//                 desde 'desde'; false = solo ese mes), avisarAl (porcentaje: 50–100), orden
//   metas:        id, nombre, objetivo, fechaLimite ('AAAA-MM-DD'), ahorradoInicial ("Ya tengo"),
//                 cuentaId (dónde se guarda; solo informativo), icono, orden,
//                 frecuencia (2026-10-04, opcional: 'dia' | 'semana' | 'quincena' | 'mes'; sin ella, 'mes')
//   aportes:      id, metaId, valor, fecha. Solo suman a la meta: no mueven dinero.
//   programados:  id, plantilla del movimiento (tipo, valor, descripcion, categoriaId, cuentaId,
//                 cuentaDestinoId, etiquetaIds, observacion), frecuencia ('dia' | 'semana' |
//                 'quincena' | 'mes' | 'anio'), empieza y termina ('AAAA-MM-DD'; termina null =
//                 nunca), hasta (última fecha ya registrada como movimiento, o null), orden
//                 omitidas (Sesión 9, opcional: fechas quitadas una por una, ver eliminarFecha)
//   movimientos:  programadoId (el programado que lo creó, o null).
// Sin índices nuevos (2026-10-04): movimientos.ajuste (true en un faltante o sobrante de
// Reajustar saldo) y cuentas.ajuste (ver cuentas.js).
db.version(5).stores({
  presupuestos: 'id, categoriaId, orden',
  metas: 'id, orden',
  aportes: 'id, metaId, fecha',
  programados: 'id, orden',
  movimientos: 'id, fecha, cuentaId, cuentaDestinoId, categoriaId, *etiquetaIds, tarjetaId, programadoId',
});

// Versión 6 (2026-10-04): el dueño cambió ocho de los colores principales. Las cuentas con uno de
// los de antes pasan al que lo reemplazó (colores.js). Las copias viejas se pasan al restaurar.
db.version(6)
  .stores({})
  .upgrade((tx) =>
    tx
      .table('cuentas')
      .toCollection()
      .modify((cuenta) => {
        cuenta.color = acentoActual(cuenta.color) ?? null;
      }),
  );

// Versión 7 (2026-10-04): movimientos favoritos (el corazón junto a la descripción; favoritos.js).
//   favoritos: id, tipo, descripcion, categoriaId, cuentaId, cuentaDestinoId, tarjetaId, cuotas,
//              etiquetaIds [], observacion, usado (Date.now() de la última vez que se guardó o eligió)
db.version(7).stores({
  favoritos: 'id, tipo',
});

// Versión 8 (2026-10-04): los reajustes de saldo ya no llevan observación automática (pedido del
// dueño). Se quita la que pusieron los de antes ("Reajuste de saldo…: la app tenía $ X y en la
// cuenta había $ Y."), solo si sigue tal cual.
const OBSERVACION_REAJUSTE = /^Reajuste de saldo( de .+)?: la app tenía .+ y en la cuenta había .+.$/;
db.version(8)
  .stores({})
  .upgrade((tx) =>
    tx
      .table('movimientos')
      .filter((m) => m.ajuste === true && OBSERVACION_REAJUSTE.test(m.observacion ?? ''))
      .modify((m) => {
        m.observacion = '';
      }),
  );

// Versión 9 (Sesión 9): la paleta de categorías pasó a 18 colores muy distintos; las letras k, q y s
// ya no se ofrecen y sus categorías pasan a u, b y l (los colores más parecidos de la paleta nueva).
db.version(9)
  .stores({})
  .upgrade((tx) =>
    tx
      .table('categorias')
      .toCollection()
      .modify((c) => {
        const nuevo = { k: 'u', q: 'b', s: 'l' }[c.color];
        if (nuevo) c.color = nuevo;
      }),
  );

// Solo la primera vez que se crea la base de datos. Las nuevas toman orden = Date.now()
// (ordenAlFinal), así que "Otros" lleva un orden mayor para seguir de último.
const ORDEN_ULTIMAS = 9e15;
const categoriasIniciales = () =>
  CATEGORIAS_INICIALES.map(({ alFinal, ...c }, i) => ({
    ...c,
    id: nuevoId(),
    orden: (alFinal ? ORDEN_ULTIMAS : 0) + i + 1,
  }));
db.on('populate', (tx) => tx.table('categorias').bulkAdd(categoriasIniciales()));

// Ajustes → Borrar todos los datos: deja la base como recién instalada (sin cuentas ni
// movimientos y con las categorías de siempre), en una sola operación.
export function borrarTodo() {
  return db.transaction('rw', db.tables, async () => {
    for (const tabla of db.tables) await tabla.clear();
    await db.categorias.bulkAdd(categoriasIniciales());
  });
}

// Identificadores de texto únicos: sirven igual cuando haya sincronización (Supabase).
export const nuevoId = () => crypto.randomUUID();

// Lo nuevo va al final de su lista (en categorías, antes de "Otros").
export const ordenAlFinal = () => Date.now();

// Pide al navegador que no borre los datos por falta de espacio. En el iPhone las apps
// añadidas a la pantalla de inicio ya se tratan así; en otros navegadores ayuda.
export function pedirAlmacenamientoPersistente() {
  navigator.storage?.persist?.().catch(() => {});
}
