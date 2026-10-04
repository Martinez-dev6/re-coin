// Cuentas, categorías, etiquetas, tarjetas y movimientos de la base de datos, para todas las
// pantallas.
// useLiveQuery vuelve a leer solo cuando cambian, así que lo que se guarda aparece en todas
// partes al instante. Los movimientos se leen todos: para el uso de una persona son pocos
// miles y así el saldo de cada cuenta se calcula en un solo lugar.
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo } from 'react';
import { db } from './db.js';
import { ordenarMovimientos, saldosPorCuenta } from './movimientos.js';
import { cuotasComoGastos, resumenTarjetas } from './tarjetas.js';

const DatosContext = createContext(null);

export function DatosProvider({ children }) {
  const cuentas = useLiveQuery(() => db.cuentas.orderBy('orden').toArray());
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray());
  const etiquetas = useLiveQuery(() => db.etiquetas.orderBy('orden').toArray());
  const movimientos = useLiveQuery(() => db.movimientos.toArray());
  const tarjetas = useLiveQuery(() => db.tarjetas.orderBy('orden').toArray());
  const presupuestos = useLiveQuery(() => db.presupuestos.orderBy('orden').toArray());

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
    // Como se ven mes a mes (Inicio, Transacciones, Pendientes): cada compra con tarjeta partida
    // en sus cuotas, en el día en que vence cada una (ver cuotasComoGastos).
    const porMes = ordenarMovimientos([
      ...listaMovimientos.filter((m) => m.tipo !== 'gastoTarjeta'),
      ...cuotasComoGastos(listaMovimientos, tarjeta),
    ]);
    return {
      // Mientras se lee la base de datos (unos milisegundos al abrir). Sirve para no mostrar
      // un momento "Crea tu primera cuenta" a quien ya tiene cuentas.
      cargando: [cuentas, categorias, etiquetas, movimientos, tarjetas, presupuestos].includes(undefined),
      cuentas: listaCuentas,
      categorias: categorias ?? [],
      etiquetas: etiquetas ?? [],
      tarjetas: listaTarjetas,
      presupuestos: presupuestos ?? [],
      // Más recientes primero.
      movimientos: listaMovimientos,
      movimientosPorMes: porMes,
      cuenta: (id) => cuentasPorId.get(id),
      categoria: (id) => categoriasPorId.get(id),
      etiqueta: (id) => etiquetasPorId.get(id),
      tarjeta,
    };
  }, [cuentas, categorias, etiquetas, movimientos, tarjetas, presupuestos]);

  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  return useContext(DatosContext);
}
