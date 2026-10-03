// Copia de seguridad: todas las tablas de la base de datos en un archivo JSON.
// Las preferencias de color y modo no van (viven en localStorage y no son datos).
import { db } from './db.js';

const APP = 'sendo';

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
};

// Todas las tablas. La pantalla la tiene leída de antemano (useLiveQuery) para que al tocar
// "Copia de seguridad" el menú de compartir se abra sin esperas: Safari solo lo permite
// justo después del toque.
export async function leerDatos() {
  const datos = {};
  for (const tabla of db.tables) datos[tabla.name] = await tabla.toArray();
  return datos;
}

// Nombre del archivo: sendo-copia-2026-10-03.json
export function nombreArchivo(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${APP}-copia-${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}.json`;
}

// En el iPhone se abre el menú de compartir ("Guardar en Archivos", AirDrop, WhatsApp…);
// donde no se puede compartir un archivo, se descarga. Devuelve false si se canceló.
// datos: lo que devuelve leerDatos(). Sin await antes de navigator.share (ver leerDatos).
export async function exportarCopia(datos) {
  const copia = { app: APP, version: db.verno, creada: new Date().toISOString(), datos };
  const archivo = new File([JSON.stringify(copia, null, 2)], nombreArchivo(), { type: 'application/json' });

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: 'Copia de Sendo' });
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

// Lee y comprueba un archivo de copia. Devuelve { copia, resumen } o lanza un Error con un
// mensaje para mostrar.
export async function leerCopia(archivo) {
  let copia;
  try {
    copia = JSON.parse(await archivo.text());
  } catch {
    throw new Error('El archivo no es una copia de Sendo.');
  }
  if (copia?.app !== APP || typeof copia.datos !== 'object' || copia.datos === null) {
    throw new Error('El archivo no es una copia de Sendo.');
  }
  if (!esNumero(copia.version) || copia.version > db.verno) {
    throw new Error('La copia es de una versión más nueva de Sendo. Actualiza la app y vuelve a intentarlo.');
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
    },
  };
}

// Reemplaza todo lo guardado por la copia, en una sola operación: si algo falla, no cambia nada.
export function restaurarCopia(copia) {
  return db.transaction('rw', db.tables, async () => {
    for (const tabla of db.tables) {
      await tabla.clear();
      await tabla.bulkAdd(copia.datos[tabla.name] ?? []);
    }
  });
}
