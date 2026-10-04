// Buscar movimientos (design/html/Busqueda.html): en todos los meses, por descripción,
// categoría, cuenta, tarjeta, etiqueta, observación o valor. Lo buscado se conserva al abrir un
// movimiento y volver (buscar.js).
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import FilaMovimiento from '../componentes/FilaMovimiento.jsx';
import { IconoBuscar, IconoCerrar, IconoVolver } from '../componentes/iconos.jsx';
import { agruparPorDia, buscarMovimientos, totalMovimientos, useBusqueda } from '../datos/buscar.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { detalleMovimiento, estadoMovimiento, rutaMovimiento } from '../datos/movimientos.js';
import { etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import './Busqueda.css';

// Más que esto no se dibuja de una vez (la lista se haría pesada en el teléfono).
const MAXIMO = 200;

// En el iPhone el teclado solo se abre si el campo recibe el foco dentro del toque. Quien abre
// la búsqueda llama a esto en su onClick: un campo invisible toma el foco ya y, cuando la
// pantalla existe, se lo pasa al de la búsqueda sin que el teclado se cierre.
let campoPuente = null;
export function prepararTeclado() {
  campoPuente?.remove();
  campoPuente = document.createElement('input');
  campoPuente.setAttribute('aria-hidden', 'true');
  campoPuente.tabIndex = -1;
  campoPuente.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;';
  document.body.appendChild(campoPuente);
  campoPuente.focus({ preventScroll: true });
  // Si la pantalla nunca llega a pedirlo, no queda un campo con el teclado abierto.
  setTimeout(() => {
    campoPuente?.remove();
    campoPuente = null;
  }, 1500);
}

export default function Busqueda() {
  const navegar = useNavigate();
  const datos = useDatos();
  const [consulta, setConsulta] = useBusqueda();
  const campo = useRef(null);

  // Al entrar sin nada escrito, el cursor va al campo (y el teclado sigue abierto si se preparó).
  useEffect(() => {
    if (!consulta) campo.current?.focus({ preventScroll: true });
    campoPuente?.remove();
    campoPuente = null;
    // Solo al entrar.
  }, []);

  const resultados = buscarMovimientos(datos.movimientosPorMes, consulta, datos);
  const total = totalMovimientos(resultados);
  const porDia = agruparPorDia(resultados.slice(0, MAXIMO));
  const buscando = consulta.trim() !== '';

  const borrar = () => {
    setConsulta('');
    campo.current?.focus({ preventScroll: true });
  };

  return (
    <div>
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner busqueda-banner">
          <div className="busqueda-fila">
            <button type="button" className="boton-banner" aria-label="Volver" onClick={() => volver(navegar, '/transacciones')}>
              <IconoVolver />
            </button>
            <form
              className="busqueda-campo"
              role="search"
              onSubmit={(evento) => {
                evento.preventDefault();
                campo.current?.blur(); // "Buscar" del teclado: lo cierra para ver los resultados
              }}
            >
              <IconoBuscar tamano={18} />
              <input
                ref={campo}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Buscar movimientos"
                aria-label="Buscar movimientos"
                value={consulta}
                onChange={(evento) => setConsulta(evento.target.value)}
              />
              {consulta && (
                <button type="button" className="busqueda-borrar" aria-label="Borrar búsqueda" onClick={borrar}>
                  <IconoCerrar tamano={16} grosor={2.4} />
                </button>
              )}
            </form>
          </div>
        </header>
      </div>

      <div className="busqueda-contenido">
        {!buscando && (
          <p className="busqueda-ayuda">Busca por descripción, categoría, cuenta, tarjeta, etiqueta, nota o valor.</p>
        )}

        {buscando && (
          <div className="busqueda-resumen" aria-live="polite">
            <span>{resultados.length === 1 ? '1 resultado' : `${resultados.length} resultados`}</span>
            {resultados.length > 0 && (
              <span className={'busqueda-total ' + (total < 0 ? 'gasto' : total > 0 ? 'ingreso' : '')}>
                {total < 0 ? '- ' : total > 0 ? '+ ' : ''}
                {formatearPesos(Math.abs(total))}
              </span>
            )}
          </div>
        )}

        {buscando && resultados.length === 0 && <div className="tarjeta vacio">Nada coincide con “{consulta.trim()}”.</div>}

        {porDia.map(({ fecha, movimientos }) => (
          <section key={fecha}>
            <h2 className="titulo-dia">{etiquetaDia(fecha)}</h2>
            <div className="tarjeta-lista">
              {movimientos.map((m) => (
                <FilaMovimiento
                  key={m.id}
                  movimiento={m}
                  detalle={detalleMovimiento(m, datos)}
                  estado={estadoMovimiento(m)}
                  mostrarRepetir
                  conObservacion
                  alTocar={() => navegar(rutaMovimiento(m))}
                />
              ))}
            </div>
          </section>
        ))}

        {resultados.length > MAXIMO && (
          <p className="busqueda-ayuda">Se muestran los {MAXIMO} más recientes. Escribe algo más para afinar.</p>
        )}
      </div>
    </div>
  );
}
