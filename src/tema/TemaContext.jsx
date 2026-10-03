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

  // Color de la pantalla abierta (useAcentoPantalla), si tiene uno propio; si no, el del tema.
  const [acentoPantalla, setAcentoPantalla] = useState(null);
  const acentoAplicado = acentoPantalla ?? preferencias.acento;

  // main.jsx ya aplicó el tema al arrancar: aquí solo se aplican (con fundido) los cambios.
  const primeraVez = useRef(true);
  useLayoutEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    aplicarTema(acentoAplicado, oscuro, { animar: true });
  }, [acentoAplicado, oscuro]);

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
      fijarAcentoPantalla: setAcentoPantalla,
    }),
    [preferencias, oscuro],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}

// Una pantalla puede pedir su propio color principal mientras está abierta (la de una cuenta
// con color propio): toda la interfaz pasa a ese color con el fundido del tema, a la vez que
// la pantalla entra, y vuelve al color del tema al salir de ella. null = el color del tema.
export function useAcentoPantalla(color) {
  const { fijarAcentoPantalla } = useContext(TemaContext);
  useLayoutEffect(() => {
    fijarAcentoPantalla(ACENTOS.some((a) => a.valor === color) ? color : null);
    return () => fijarAcentoPantalla(null);
  }, [color, fijarAcentoPantalla]);
}
