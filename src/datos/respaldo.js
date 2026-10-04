// Copia de seguridad: todas las tablas de la base de datos en un archivo JSON.
// Las preferencias de color y modo no van (viven en localStorage y no son datos).
import { cambiarAjustes } from '../estado/ajustes.js';
import { acentoActual } from '../tema/colores.js';
import { db } from './db.js';

// Marca interna de las copias: se queda 'sendo' (nombre anterior de la app) para que las
// copias de antes y las nuevas se puedan restaurar.
const APP = 'sendo';
const PREFIJO_ARCHIVO = 're-coin';

// Comprobaciones mínimas por tabla al restaurar: un archivo dañado o de otra app no debe
// entrar a medias. Al añadir una tabla a db.js hay que añadir aquí su comprobación.
const esTexto = (v) => typeof v === 'string' && v.length > 0;
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);
const VALIDAR = {
  cuentas: (c) =>
    esTexto(c.id) && esTexto(c.nombre) && esTexto(c.tipo) && esNumero(c.saldoInicial) && esTexto(c.icono) && esNumero(c.orden),
  categorias: (c) =>
    esTexto(c.id) &&
    esTexto(c.nombre) &&
    (c.tipo === 'gasto' || c.tipo === 'ingreso') &&
    esTexto(c.icono) &&
    esNumero(c.orden),
  etiquetas: (e) => esTexto(e.id) && esTexto(e.nombre) && esNumero(e.orden),
  movimientos: (m) =>
    esTexto(m.id) &&
    ['gasto', 'ingreso', 'transferencia', 'gastoTarjeta', 'pagoTarjeta'].includes(m.tipo) &&
    esNumero(m.valor) &&
    (m.tipo === 'gastoTarjeta' ? esTexto(m.tarjetaId) && /^\d{4}-\d{2}$/.test(m.factura) : esTexto(m.cuentaId)) &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.fecha) &&
    typeof m.pagado === 'boolean' &&
    Array.isArray(m.etiquetaIds),
  presupuestos: (p) =>
    esTexto(p.id) && esTexto(p.categoriaId) && esNumero(p.limite) && /^\d{4}-\d{2}$/.test(p.desde) && esNumero(p.orden),
  metas: (m) => esTexto(m.id) && esTexto(m.nombre) && esNumero(m.objetivo) && esNumero(m.orden),
  aportes: (a) => esTexto(a.id) && esTexto(a.metaId) && esNumero(a.valor) && /^\d{4}-\d{2}-\d{2}$/.test(a.fecha),
  programados: (p) => esTexto(p.id) && esTexto(p.tipo) && esNumero(p.valor) && esTexto(p.frecuencia) && esNumero(p.orden),
  tarjetas: (t) =>
    esTexto(t.id) && esTexto(t.nombre) && esNumero(t.cupo) && esNumero(t.diaCierre) && esNumero(t.diaPago) && esNumero(t.orden),
};

// Todas las tablas. La pantalla la tiene leída de antemano (useLiveQuery) para que al tocar
// "Copia de seguridad" el menú de compartir se abra sin esperas: Safari solo lo permite
// justo después del toque.
export async function leerDatos() {
  const datos = {};
  for (const tabla of db.tables) datos[tabla.name] = await tabla.toArray();
  return datos;
}

// Nombre del archivo: re-coin-copia-2026-10-03.json (o re-coin-movimientos-2026-10-03.csv…).
export function nombreArchivo(que = 'copia', extension = 'json', fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${PREFIJO_ARCHIVO}-${que}-${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}.${extension}`;
}

// En el iPhone abre el menú de compartir ("Guardar en Archivos", AirDrop, WhatsApp…); donde no
// se puede compartir un archivo, lo descarga. Devuelve false si se canceló. Sin await antes de
// llamarla: Safari solo deja compartir justo después del toque.
export async function compartirArchivo(archivo, titulo) {
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return true;
    } catch (error) {
      if (error.name === 'AbortError') return false;
      // Si el navegador no deja compartir, se descarga.
    }
  }

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = archivo.name;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// En el iPhone se abre el menú de compartir ("Guardar en Archivos", AirDrop, WhatsApp…);
// donde no se puede compartir un archivo, se descarga. Devuelve false si se canceló.
// datos: lo que devuelve leerDatos(). Sin await antes de navigator.share (ver leerDatos).
export async function exportarCopia(datos) {
  const copia = { app: APP, version: db.verno, creada: new Date().toISOString(), datos };
  const archivo = new File([JSON.stringify(copia, null, 2)], nombreArchivo(), { type: 'application/json' });
  const lista = await compartirArchivo(archivo, 'Copia de Re-Coin');
  if (lista) marcarCopia();
  return lista;
}

const DIA_MS = 24 * 60 * 60 * 1000;
// Aviso de copia en Inicio (pedido del dueño el 2026-10-04, después de perder sus datos al
// borrar la app del iPhone para cambiarle el ícono): sale si nunca se hizo una copia y ya hay
// algunos movimientos, o si la última tiene una semana o más y desde entonces hay movimientos
// nuevos. "Ahora no" lo aplaza tres días.
const DIAS_ENTRE_COPIAS = 7;
const DIAS_AL_POSPONER = 3;
const MINIMO_SIN_COPIA = 3;

const marcarCopia = () => cambiarAjustes({ ultimaCopia: Date.now(), avisoCopiaPospuesto: null });
export const posponerAvisoCopia = () => cambiarAjustes({ avisoCopiaPospuesto: Date.now() + DIAS_AL_POSPONER * DIA_MS });

// Días completos desde la última copia, o null si nunca se hizo.
export const diasDesdeCopia = ({ ultimaCopia }, ahora = Date.now()) =>
  ultimaCopia ? Math.floor((ahora - ultimaCopia) / DIA_MS) : null;

// Devuelve { dias, nuevos } si toca avisar (dias: null si nunca hubo copia), o null.
export function avisoDeCopia(movimientos, ajustes, ahora = Date.now()) {
  if (ajustes.avisoCopiaPospuesto && ahora < ajustes.avisoCopiaPospuesto) return null;
  const dias = diasDesdeCopia(ajustes, ahora);
  const nuevos = movimientos.filter((m) => !ajustes.ultimaCopia || (m.creado ?? 0) > ajustes.ultimaCopia).length;
  if (dias === null) return nuevos >= MINIMO_SIN_COPIA ? { dias, nuevos } : null;
  return dias >= DIAS_ENTRE_COPIAS && nuevos > 0 ? { dias, nuevos } : null;
}

// Lee y comprueba un archivo de copia. Devuelve { copia, resumen } o lanza un Error con un
// mensaje para mostrar.
export async function leerCopia(archivo) {
  let copia;
  try {
    copia = JSON.parse(await archivo.text());
  } catch {
    throw new Error('El archivo no es una copia de Re-Coin.');
  }
  if (copia?.app !== APP || typeof copia.datos !== 'object' || copia.datos === null) {
    throw new Error('El archivo no es una copia de Re-Coin.');
  }
  if (!esNumero(copia.version) || copia.version > db.verno) {
    throw new Error('La copia es de una versión más nueva de Re-Coin. Actualiza la app y vuelve a intentarlo.');
  }
  for (const tabla of db.tables) {
    const filas = copia.datos[tabla.name] ?? [];
    const validar = VALIDAR[tabla.name];
    if (!Array.isArray(filas) || !validar || !filas.every(validar)) {
      throw new Error('La copia está dañada o incompleta. No se cambió nada.');
    }
  }
  return {
    copia,
    resumen: {
      creada: new Date(copia.creada),
      cuentas: copia.datos.cuentas?.length ?? 0,
      categorias: copia.datos.categorias?.length ?? 0,
      movimientos: copia.datos.movimientos?.length ?? 0,
    },
  };
}

// Reemplaza todo lo guardado por la copia, en una sola operación: si algo falla, no cambia nada.
// Una copia de antes del 2026-10-04 puede traer cuentas con un color principal que ya no existe:
// pasan al que lo reemplazó.
export function restaurarCopia(copia) {
  const datos = {
    ...copia.datos,
    cuentas: (copia.datos.cuentas ?? []).map((c) => ({ ...c, color: acentoActual(c.color) ?? null })),
  };
  // Lo restaurado ya está en una copia: cuenta como la última.
  return db
    .transaction('rw', db.tables, async () => {
      for (const tabla of db.tables) {
        await tabla.clear();
        await tabla.bulkAdd(datos[tabla.name] ?? []);
      }
    })
    .then(marcarCopia);
}
