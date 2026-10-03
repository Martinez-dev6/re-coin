// "< Octubre 2026 >" en el banner (Transacciones y Planes) y el panel "Elegir mes" (Inicio).
import { useEffect, useState } from 'react';
import { useMes } from '../estado/MesContext.jsx';
import { nombreMes } from '../utilidades/fechas.js';
import Deslizar from './Deslizar.jsx';
import { IconoAnterior, IconoSiguiente } from './iconos.jsx';
import PanelInferior from './PanelInferior.jsx';
import './SelectorMes.css';

export function MesConFlechas() {
  const { anio, mes, anterior, siguiente } = useMes();
  return (
    <div className="mes-flechas">
      <button type="button" className="mes-flecha" aria-label="Mes anterior" onClick={anterior}>
        <IconoAnterior />
      </button>
      <Deslizar posicion={anio * 12 + mes} distancia={16} className="mes-flechas-texto" aria-live="polite">
        {nombreMes(mes)} {anio}
      </Deslizar>
      <button type="button" className="mes-flecha" aria-label="Mes siguiente" onClick={siguiente}>
        <IconoSiguiente />
      </button>
    </div>
  );
}

const CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function PanelElegirMes({ abierto, alCerrar }) {
  const { anio, mes, elegir } = useMes();
  const [anioVista, setAnioVista] = useState(anio);
  const [mesElegido, setMesElegido] = useState({ anio, mes });

  // Cada vez que se abre, parte del mes que se está viendo.
  useEffect(() => {
    if (abierto) {
      setAnioVista(anio);
      setMesElegido({ anio, mes });
    }
  }, [abierto, anio, mes]);

  const irAlActual = () => {
    const hoy = new Date();
    setAnioVista(hoy.getFullYear());
    setMesElegido({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  };

  const confirmar = () => {
    elegir(mesElegido.anio, mesElegido.mes);
    alCerrar();
  };

  return (
    <PanelInferior
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Elegir mes"
      accion={{ texto: 'Mes actual', alTocar: irAlActual }}
    >
      <div className="elegir-mes-anio">
        <button type="button" className="mes-flecha" aria-label="Año anterior" onClick={() => setAnioVista((a) => a - 1)}>
          <IconoAnterior />
        </button>
        <span>{anioVista}</span>
        <button type="button" className="mes-flecha" aria-label="Año siguiente" onClick={() => setAnioVista((a) => a + 1)}>
          <IconoSiguiente />
        </button>
      </div>
      <div className="elegir-mes-rejilla">
        {CORTOS.map((corto, indice) => {
          const elegido = mesElegido.anio === anioVista && mesElegido.mes === indice;
          return (
            <button
              key={corto}
              type="button"
              aria-pressed={elegido}
              aria-label={`${nombreMes(indice)} ${anioVista}`}
              className={'elegir-mes-boton' + (elegido ? ' elegido' : '')}
              onClick={() => setMesElegido({ anio: anioVista, mes: indice })}
            >
              {corto}
            </button>
          );
        })}
      </div>
      <button type="button" className="boton-principal" onClick={confirmar}>
        Ver {nombreMes(mesElegido.mes, false)} {mesElegido.anio}
      </button>
    </PanelInferior>
  );
}
