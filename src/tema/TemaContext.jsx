import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { aplicarTema } from './aplicarTema.js';
import { ACENTO_PREDETERMINADO, ACENTOS } from './colores.js';
import { CONSULTA_OSCURO, guardarPreferencias, leerPreferencias } from './preferencias.js';

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [preferencias, setPreferencias] = useState(leerPreferencias);
  const [sistemaOscuro, setSistemaOscuro] = useState(() => window.matchMedia(CONSULTA_OSCURO).matches);

  // En modo Automático, seguir los cambios del iPhone mientras la app está abierta.
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_OSCURO);
    const alCambiar = (evento) => setSistemaOscuro(evento.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  const oscuro = preferencias.modo === 'oscuro' || (preferencias.modo === 'auto' && sistemaOscuro);

  // main.jsx ya aplicó el tema al arrancar: aquí solo se aplican (con fundido) los cambios.
  const primeraVez = useRef(true);
  useLayoutEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    aplicarTema(preferencias.acento, oscuro, { animar: true });
  }, [preferencias.acento, oscuro]);

  useEffect(() => {
    guardarPreferencias(preferencias);
  }, [preferencias]);

  const valor = useMemo(
    () => ({
      acento: preferencias.acento,
      modo: preferencias.modo,
      oscuro,
      cambiarAcento: (acento) => {
        if (ACENTOS.some((a) => a.valor === acento)) setPreferencias((p) => ({ ...p, acento }));
      },
      cambiarModo: (modo) => setPreferencias((p) => ({ ...p, modo })),
      restablecerAcento: () => setPreferencias((p) => ({ ...p, acento: ACENTO_PREDETERMINADO })),
    }),
    [preferencias, oscuro],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
