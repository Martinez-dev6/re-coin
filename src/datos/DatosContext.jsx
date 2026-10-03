// Cuentas y categorías de la base de datos, para todas las pantallas. useLiveQuery vuelve a
// leer solo cuando cambian, así que lo que se guarda aparece en todas partes al instante.
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo } from 'react';
import { saldoDeCuenta } from './cuentas.js';
import { db } from './db.js';

const DatosContext = createContext(null);

export function DatosProvider({ children }) {
  const cuentas = useLiveQuery(() => db.cuentas.orderBy('orden').toArray());
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray());

  const valor = useMemo(() => {
    const porId = new Map((categorias ?? []).map((c) => [c.id, c]));
    return {
      // Mientras se lee la base de datos (unos milisegundos al abrir). Sirve para no mostrar
      // un momento "Crea tu primera cuenta" a quien ya tiene cuentas.
      cargando: cuentas === undefined || categorias === undefined,
      cuentas: (cuentas ?? []).map((c) => ({ ...c, saldo: saldoDeCuenta(c) })),
      categorias: categorias ?? [],
      categoria: (id) => porId.get(id),
    };
  }, [cuentas, categorias]);

  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  return useContext(DatosContext);
}
