// Pantalla de inicio (design/html/PantallaInicio.html): qué bloques se ven en Inicio y en qué
// orden. El saldo con ingresos y gastos va siempre arriba. Para ordenar: arrastrar desde la
// manija (al instante) o mantener presionada la fila y arrastrarla. Se guarda al soltar.
import { useEffect, useRef, useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoArrastrar, IconoCandado, IconoInfo } from '../componentes/iconos.jsx';
import { alternarBloque, bloquesDeInicio, guardarBloques, useAjustes } from '../estado/ajustes.js';
import '../componentes/Formulario.css';
import './PantallaInicio.css';

const ESPERA_PRESIONAR_MS = 350; // mantener presionado para arrastrar desde la fila
const TOLERANCIA_PX = 8; // si el dedo se mueve más antes de eso, es scroll y no arrastre

export default function PantallaInicio() {
  const ajustes = useAjustes();
  const bloques = bloquesDeInicio(ajustes);
  // arrastre: { id, desde (índice), inicioY, dy, alto } mientras se arrastra.
  const [arrastre, setArrastre] = useState(null);
  const [soltando, setSoltando] = useState(false);
  const espera = useRef(null);

  // A qué lugar iría el bloque si se soltara ahora.
  const destino = arrastre
    ? Math.min(bloques.length - 1, Math.max(0, arrastre.desde + Math.round(arrastre.dy / arrastre.alto)))
    : -1;

  const empezar = (evento, indice) => {
    const fila = evento.currentTarget.closest('.pantalla-inicio-fila');
    fila.setPointerCapture?.(evento.pointerId);
    setArrastre({ id: bloques[indice].id, desde: indice, inicioY: evento.clientY, dy: 0, alto: fila.offsetHeight });
  };

  const mover = (evento) => {
    if (espera.current) {
      // Antes de que cuente como "mantener presionado": si el dedo se mueve, era scroll.
      if (Math.abs(evento.clientY - espera.current.y) > TOLERANCIA_PX) cancelarEspera();
      return;
    }
    if (!arrastre) return;
    setArrastre((a) => a && { ...a, dy: evento.clientY - a.inicioY });
  };

  const soltar = () => {
    cancelarEspera();
    if (!arrastre) return;
    if (destino !== arrastre.desde) {
      const nuevos = [...bloques];
      const [movido] = nuevos.splice(arrastre.desde, 1);
      nuevos.splice(destino, 0, movido);
      guardarBloques(nuevos);
    }
    // Un cuadro sin transición: las filas ya están en su sitio nuevo y no deben deslizarse otra vez.
    setSoltando(true);
    setArrastre(null);
  };

  const cancelarEspera = () => {
    clearTimeout(espera.current?.temporizador);
    espera.current = null;
  };

  const presionar = (evento, indice) => {
    if (evento.target.closest('[role="switch"], .pantalla-inicio-manija')) return;
    const { clientY, pointerId } = evento;
    const fila = evento.currentTarget;
    espera.current = {
      y: clientY,
      temporizador: setTimeout(() => {
        espera.current = null;
        fila.setPointerCapture?.(pointerId);
        setArrastre({ id: bloques[indice].id, desde: indice, inicioY: clientY, dy: 0, alto: fila.offsetHeight });
      }, ESPERA_PRESIONAR_MS),
    };
  };

  useEffect(() => {
    if (!soltando) return;
    const cuadro = requestAnimationFrame(() => setSoltando(false));
    return () => cancelAnimationFrame(cuadro);
  }, [soltando]);

  // Mientras se arrastra, la página no se desplaza con el dedo.
  const hayArrastre = Boolean(arrastre);
  useEffect(() => {
    if (!hayArrastre) return;
    const frenar = (evento) => evento.preventDefault();
    document.addEventListener('touchmove', frenar, { passive: false });
    return () => document.removeEventListener('touchmove', frenar);
  }, [hayArrastre]);

  useEffect(() => cancelarEspera, []);

  // Desplazamiento de cada fila mientras se arrastra: la arrastrada sigue al dedo y las que
  // quedan entre su lugar y el destino se corren una fila para hacerle espacio.
  const desplazamiento = (indice) => {
    if (!arrastre) return 0;
    if (indice === arrastre.desde) return arrastre.dy;
    if (arrastre.desde < indice && indice <= destino) return -arrastre.alto;
    if (destino <= indice && indice < arrastre.desde) return arrastre.alto;
    return 0;
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Pantalla de inicio" volverA="/mi-espacio" />

      <div className="contenido pantalla-inicio-contenido">
        <div className="tarjeta pantalla-inicio-tarjeta">
          <div className="pantalla-inicio-fila fija">
            <span className="pantalla-inicio-manija sin-arrastre">
              <IconoCandado />
            </span>
            <span className="pantalla-inicio-textos">
              <span className="pantalla-inicio-titulo">Saldo, ingresos y gastos</span>
              <span className="pantalla-inicio-detalle">Siempre visible</span>
            </span>
          </div>

          <div className={'pantalla-inicio-lista' + (arrastre ? ' arrastrando' : '') + (soltando ? ' soltando' : '')}>
            {bloques.map((b, indice) => {
              const elegida = arrastre?.id === b.id;
              return (
                <div
                  key={b.id}
                  className={'pantalla-inicio-fila' + (elegida ? ' elegida' : '')}
                  style={{ transform: `translateY(${desplazamiento(indice)}px)` }}
                  onPointerDown={(evento) => presionar(evento, indice)}
                  onPointerMove={mover}
                  onPointerUp={soltar}
                  onPointerCancel={soltar}
                  onContextMenu={(evento) => evento.preventDefault()}
                >
                  <span
                    className="pantalla-inicio-manija"
                    aria-hidden="true"
                    onPointerDown={(evento) => empezar(evento, indice)}
                  >
                    <IconoArrastrar />
                  </span>
                  <span className="pantalla-inicio-textos">
                    <span className="pantalla-inicio-titulo" id={'bloque-' + b.id}>
                      {b.titulo}
                    </span>
                    <span className="pantalla-inicio-detalle">{b.detalle}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={b.visible}
                    aria-labelledby={'bloque-' + b.id}
                    className={'interruptor' + (b.visible ? ' activo' : '')}
                    onClick={() => alternarBloque(b.id)}
                  >
                    <span />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p className="pantalla-inicio-nota">
          <IconoInfo />
          Mantén presionado un bloque y arrástralo para cambiar el orden.
        </p>
      </div>
    </div>
  );
}
