// Cuentas, categorías, etiquetas, tarjetas y movimientos de la base de datos, para todas las
// pantallas.
// useLiveQuery vuelve a leer solo cuando cambian, así que lo que se guarda aparece en todas
// partes al instante. Los movimientos se leen todos: para el uso de una persona son pocos
// miles y así el saldo de cada cuenta se calcula en un solo lugar.
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { db } from './db.js';
import { ahorradoPorMeta } from './metas.js';
import { ordenarMovimientos, saldosPorCuenta } from './movimientos.js';
import { registrarVencidos } from './programados.js';
import { cuotasComoGastos, resumenTarjetas } from './tarjetas.js';

const DatosContext = createContext(null);

export function DatosProvider({ children }) {
  const cuentas = useLiveQuery(() => db.cuentas.orderBy('orden').toArray());
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray());
  const etiquetas = useLiveQuery(() => db.etiquetas.orderBy('orden').toArray());
  const movimientos = useLiveQuery(() => db.movimientos.toArray());
  const tarjetas = useLiveQuery(() => db.tarjetas.orderBy('orden').toArray());
  const presupuestos = useLiveQuery(() => db.presupuestos.orderBy('orden').toArray());
  const metas = useLiveQuery(() => db.metas.orderBy('orden').toArray());
  const aportes = useLiveQuery(() => db.aportes.orderBy('fecha').reverse().toArray());
  const programados = useLiveQuery(() => db.programados.orderBy('orden').toArray());

  // Programados: al abrir la app y al volver a ella (puede ser otro día), lo que ya llegó se
  // registra como pendiente (programados.js).
  useEffect(() => {
    const registrar = () => document.visibilityState === 'visible' && registrarVencidos().catch(() => {});
    registrar();
    document.addEventListener('visibilitychange', registrar);
    return () => document.removeEventListener('visibilitychange', registrar);
  }, []);

  const valor = useMemo(() => {
    const categoriasPorId = new Map((categorias ?? []).map((c) => [c.id, c]));
    const etiquetasPorId = new Map((etiquetas ?? []).map((e) => [e.id, e]));
    const listaMovimientos = ordenarMovimientos(movimientos ?? []);
    const saldos = saldosPorCuenta(cuentas ?? [], listaMovimientos);
    const listaCuentas = (cuentas ?? []).map((c) => ({ ...c, saldo: saldos.get(c.id) }));
    const cuentasPorId = new Map(listaCuentas.map((c) => [c.id, c]));
    const resumen = resumenTarjetas(tarjetas ?? [], listaMovimientos);
    // Cada tarjeta con usado (lo que se debe) y facturas (ver resumenTarjetas).
    const listaTarjetas = (tarjetas ?? []).map((t) => ({ ...t, ...resumen.get(t.id) }));
    const tarjetasPorId = new Map(listaTarjetas.map((t) => [t.id, t]));
    const tarjeta = (id) => tarjetasPorId.get(id);
    const ahorrado = ahorradoPorMeta(metas ?? [], aportes ?? []);
    const listaMetas = (metas ?? []).map((m) => ({
      ...m,
      ahorrado: ahorrado.get(m.id),
      aportes: (aportes ?? []).filter((a) => a.metaId === m.id),
    }));
    // Como se ven mes a mes (Inicio, Transacciones, Pendientes): cada compra con tarjeta partida
    // en sus cuotas, en el día en que vence cada una (ver cuotasComoGastos).
    const porMes = ordenarMovimientos([
      ...listaMovimientos.filter((m) => m.tipo !== 'gastoTarjeta'),
      ...cuotasComoGastos(listaMovimientos, tarjeta),
    ]);
    return {
      // Mientras se lee la base de datos (unos milisegundos al abrir). Sirve para no mostrar
      // un momento "Crea tu primera cuenta" a quien ya tiene cuentas.
      cargando: [cuentas, categorias, etiquetas, movimientos, tarjetas, presupuestos, metas, aportes, programados].some(
        (tabla) => tabla === undefined,
      ),
      cuentas: listaCuentas,
      categorias: categorias ?? [],
      etiquetas: etiquetas ?? [],
      tarjetas: listaTarjetas,
      presupuestos: presupuestos ?? [],
      // Cada meta con ahorrado ("Ya tengo" + aportes) y sus aportes (más recientes primero).
      metas: listaMetas,
      programados: programados ?? [],
      // Más recientes primero.
      movimientos: listaMovimientos,
      movimientosPorMes: porMes,
      cuenta: (id) => cuentasPorId.get(id),
      categoria: (id) => categoriasPorId.get(id),
      etiqueta: (id) => etiquetasPorId.get(id),
      tarjeta,
    };
  }, [cuentas, categorias, etiquetas, movimientos, tarjetas, presupuestos, metas, aportes, programados]);

  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  return useContext(DatosContext);
}
