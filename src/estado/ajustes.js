// Perfil (nombre y foto) y ajustes generales, guardados en el teléfono (localStorage), como el
// tema. No van en la copia de seguridad: no son movimientos ni cuentas, y la foto la haría pesada.
// Cada pantalla que los usa se entera al instante de los cambios (useSyncExternalStore).
import { useSyncExternalStore } from 'react';

const CLAVE = 'sendo.ajustes';

// nombre: '' = sin nombre. foto: imagen pequeña como data URL, o null.
// semanaEmpieza: 'lunes' | 'domingo' (calendario de Programados).
const PREDETERMINADOS = { nombre: '', foto: null, semanaEmpieza: 'lunes' };

function leer() {
  try {
    return { ...PREDETERMINADOS, ...JSON.parse(localStorage.getItem(CLAVE)) };
  } catch {
    return PREDETERMINADOS;
  }
}

let actual = leer();
const oyentes = new Set();

// Devuelve false si no se pudo guardar (p. ej. sin espacio): el cambio se ve, pero no se recuerda.
export function cambiarAjustes(cambios) {
  actual = { ...actual, ...cambios };
  oyentes.forEach((oyente) => oyente());
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual));
    return true;
  } catch {
    return false;
  }
}

const suscribir = (oyente) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

export const useAjustes = () => useSyncExternalStore(suscribir, () => actual);

// "José Martínez" → "JM"; "Ana" → "A".
export function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
}

// Reduce la foto elegida a un cuadrado de 256 px (recortada al centro) en JPEG: unos 20 KB,
// para que quepa sin problema en localStorage.
export async function prepararFoto(archivo, lado = 256) {
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode(); // falla si no es una imagen que el navegador sepa leer
    const ancho = imagen.naturalWidth;
    const alto = imagen.naturalHeight;
    const corte = Math.min(ancho, alto);
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = lado;
    lienzo.getContext('2d').drawImage(imagen, (ancho - corte) / 2, (alto - corte) / 2, corte, corte, 0, 0, lado, lado);
    return lienzo.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
