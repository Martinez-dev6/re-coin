// Ocultar saldos (botón del ojo en Inicio). Se recuerda en el teléfono.
import { useEffect, useState } from 'react';

const CLAVE = 'sendo.ocultarSaldos';

function leer() {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function useSaldosOcultos() {
  const [ocultos, setOcultos] = useState(leer);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, ocultos ? '1' : '0');
    } catch {
      // Sin almacenamiento: funciona igual, solo no se recuerda.
    }
  }, [ocultos]);

  return [ocultos, () => setOcultos((o) => !o)];
}
