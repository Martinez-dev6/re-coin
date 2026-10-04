// Perfil (nombre y foto) y ajustes generales, guardados en el teléfono (localStorage), como el
// tema. No van en la copia de seguridad: no son movimientos ni cuentas, y la foto la haría pesada.
// Cada pantalla que los usa se entera al instante de los cambios (useSyncExternalStore).
import { useSyncExternalStore } from 'react';

const CLAVE = 'sendo.ajustes';

// nombre: '' = sin nombre. foto: imagen pequeña como data URL, o null.
// semanaEmpieza: 'lunes' | 'domingo' (calendario de Programados).
// bloquesInicio: [{ id, visible }] en el orden en que se ven en Inicio (ver bloquesDeInicio).
// colorIconos: 'predeterminado' (cada opción con su color suave) | 'tema' (todos con el color del
// tema). Mi espacio → Apariencia (pedido del dueño, 2026-10-04).
const PREDETERMINADOS = { nombre: '', foto: null, semanaEmpieza: 'lunes', bloquesInicio: [], colorIconos: 'predeterminado' };

// Bloques de Inicio que se pueden mostrar, ocultar y ordenar (Mi espacio → Pantalla de inicio).
// El saldo con ingresos y gastos (el banner) va siempre arriba. visible: cómo vienen de entrada.
// Para agregar uno: añadirlo aquí y pintarlo en Inicio.jsx; a quien ya ordenó los suyos le
// aparece al final.
export const BLOQUES_INICIO = [
  { id: 'pendientes', titulo: 'Pendientes y alertas', detalle: 'Solo si hay algo por pagar o recibir', visible: true },
  { id: 'balance', titulo: 'Balance del mes', detalle: 'Ingresos contra gastos', visible: true },
  { id: 'cuentas', titulo: 'Cuentas', detalle: 'Saldo de cada cuenta', visible: true },
  { id: 'presupuestos', titulo: 'Presupuestos', detalle: 'Cuánto llevas gastado', visible: false },
  { id: 'metas', titulo: 'Metas', detalle: 'Avance de tus ahorros', visible: false },
  { id: 'grafico', titulo: 'Gráfico del mes', detalle: 'Gastos por categoría', visible: false },
  { id: 'tarjetas', titulo: 'Tarjetas de crédito', detalle: 'Cuánto pagar y cuándo vence', visible: false },
];

// Los bloques en el orden elegido, cada uno con titulo, detalle y visible.
export function bloquesDeInicio({ bloquesInicio }) {
  const guardados = Array.isArray(bloquesInicio) ? bloquesInicio : [];
  const conocidos = guardados.filter((g) => BLOQUES_INICIO.some((b) => b.id === g.id));
  const nuevos = BLOQUES_INICIO.filter((b) => !conocidos.some((g) => g.id === b.id));
  return [
    ...conocidos.map((g) => ({ ...BLOQUES_INICIO.find((b) => b.id === g.id), visible: Boolean(g.visible) })),
    ...nuevos,
  ];
}

// Muestra u oculta un bloque. Lee lo guardado en ese momento (no lo de la última pintura), así
// dos toques seguidos no se pisan.
export const alternarBloque = (id) =>
  guardarBloques(bloquesDeInicio(actual).map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));

export const guardarBloques = (bloques) => cambiarAjustes({ bloquesInicio: bloques.map(({ id, visible }) => ({ id, visible })) });

function leer() {
  try {
    return { ...PREDETERMINADOS, ...JSON.parse(localStorage.getItem(CLAVE)) };
  } catch {
    return PREDETERMINADOS;
  }
}

// El color de los íconos lo aplica el CSS según data-iconos en <html> (comunes.css): así cambia
// en todas las pantallas a la vez, y desde antes de pintar la primera.
const aplicarColorIconos = ({ colorIconos }) => {
  document.documentElement.dataset.iconos = colorIconos === 'tema' ? 'tema' : 'predeterminado';
};

let actual = leer();
aplicarColorIconos(actual);
const oyentes = new Set();

// Devuelve false si no se pudo guardar (p. ej. sin espacio): el cambio se ve, pero no se recuerda.
export function cambiarAjustes(cambios) {
  actual = { ...actual, ...cambios };
  aplicarColorIconos(actual);
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
