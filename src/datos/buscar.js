// Filtros de Transacciones y búsqueda de movimientos.
// Los filtros y lo buscado se guardan aquí (en memoria) para que sigan iguales al abrir un
// movimiento y volver; al cerrar la app vuelven a empezar.
import { useState } from 'react';
import { formatearPesos } from '../utilidades/formato.js';
import { tituloMovimiento } from './movimientos.js';

// Qué tipo del filtro es cada movimiento: los gastos con tarjeta van con los gastos y los pagos
// de tarjeta con las transferencias (solo mueven dinero entre lo propio).
export const FILTRO_DE_TIPO = {
  gasto: 'gasto',
  gastoTarjeta: 'gasto',
  ingreso: 'ingreso',
  transferencia: 'transferencia',
  pagoTarjeta: 'transferencia',
};

// tipo: 'todo' | 'gasto' | 'ingreso' | 'transferencia'. estado: 'todos' | 'pagado' | 'pendiente'.
// cuentas (cuentas y tarjetas), categorias y etiquetas: ids elegidos; vacío = todas.
export const FILTROS_VACIOS = { tipo: 'todo', estado: 'todos', cuentas: [], categorias: [], etiquetas: [] };

const guardado = { filtros: FILTROS_VACIOS, busqueda: '' };

// Como useState, pero lo elegido sobrevive a salir de la pantalla y volver.
function usarGuardado(clave) {
  const [valor, setValor] = useState(guardado[clave]);
  const cambiar = (nuevo) =>
    setValor((anterior) => {
      const siguiente = typeof nuevo === 'function' ? nuevo(anterior) : nuevo;
      guardado[clave] = siguiente;
      return siguiente;
    });
  return [valor, cambiar];
}

export const useFiltrosTransacciones = () => usarGuardado('filtros');
export const useBusqueda = () => usarGuardado('busqueda');

// Cuántos filtros hay aparte del tipo (el tipo ya se ve en los chips de la pantalla).
export const filtrosExtra = (f) =>
  (f.estado !== 'todos') + (f.cuentas.length > 0) + (f.categorias.length > 0) + (f.etiquetas.length > 0);

export function cumpleFiltros(m, f) {
  if (f.tipo !== 'todo' && FILTRO_DE_TIPO[m.tipo] !== f.tipo) return false;
  if (f.estado === 'pagado' && !m.pagado) return false;
  if (f.estado === 'pendiente' && m.pagado) return false;
  if (f.cuentas.length && ![m.cuentaId, m.cuentaDestinoId, m.tarjetaId].some((id) => id && f.cuentas.includes(id))) {
    return false;
  }
  if (f.categorias.length && !f.categorias.includes(m.categoriaId)) return false;
  if (f.etiquetas.length && !(m.etiquetaIds ?? []).some((id) => f.etiquetas.includes(id))) return false;
  return true;
}

// Minúsculas y sin tildes: "Café" se encuentra con "cafe".
export const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Todo lo que se puede buscar de un movimiento: título, categoría, cuentas, tarjeta, etiquetas,
// observación y el valor (con y sin puntos: "50000" y "50.000").
function textoDe(m, datos) {
  const partes = [
    tituloMovimiento(m, datos.categoria),
    datos.categoria(m.categoriaId)?.nombre,
    datos.cuenta(m.cuentaId)?.nombre,
    datos.cuenta(m.cuentaDestinoId)?.nombre,
    datos.tarjeta(m.tarjetaId)?.nombre,
    ...(m.etiquetaIds ?? []).map((id) => datos.etiqueta(id)?.nombre),
    m.observacion,
    String(m.valor),
    formatearPesos(m.valor),
  ];
  return normalizar(partes.filter(Boolean).join(' '));
}

// Movimientos que tienen todas las palabras buscadas (en cualquier orden y campo).
export function buscarMovimientos(lista, consulta, datos) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  return lista.filter((m) => {
    const texto = textoDe(m, datos);
    return palabras.every((p) => texto.includes(p));
  });
}

// En "Todo" el neto (ingresos − gastos, sin transferencias); en los demás, la suma del tipo.
export function totalMovimientos(lista, tipo = 'todo') {
  if (tipo !== 'todo') return lista.reduce((t, m) => t + m.valor, 0);
  const signo = { ingreso: 1, gasto: -1 };
  return lista.reduce((t, m) => t + (signo[FILTRO_DE_TIPO[m.tipo]] ?? 0) * m.valor, 0);
}

// Agrupa por día una lista ya ordenada por fecha.
export function agruparPorDia(lista) {
  const grupos = [];
  for (const m of lista) {
    const grupo = grupos.at(-1);
    if (grupo?.fecha === m.fecha) grupo.movimientos.push(m);
    else grupos.push({ fecha: m.fecha, movimientos: [m] });
  }
  return grupos;
}
