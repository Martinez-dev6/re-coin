// Mes que se está viendo. Es compartido: si cambias a noviembre en Transacciones,
// Inicio y Planes también muestran noviembre. Al abrir la app empieza en el mes actual.
import { createContext, useContext, useMemo, useState } from 'react';

const MesContext = createContext(null);

const mesActual = () => {
  const hoy = new Date();
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() };
};

export function MesProvider({ children }) {
  const [valor, setValor] = useState(mesActual);

  const contexto = useMemo(() => {
    const mover = (pasos) =>
      setValor(({ anio, mes }) => {
        const total = anio * 12 + mes + pasos;
        return { anio: Math.floor(total / 12), mes: total % 12 };
      });
    return {
      ...valor,
      anterior: () => mover(-1),
      siguiente: () => mover(1),
      elegir: (anio, mes) => setValor({ anio, mes }),
      volverAlActual: () => setValor(mesActual()),
    };
  }, [valor]);

  return <MesContext.Provider value={contexto}>{children}</MesContext.Provider>;
}

export function useMes() {
  return useContext(MesContext);
}
