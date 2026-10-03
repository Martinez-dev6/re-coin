// Barra inferior fija de 90 px con la curva alrededor del "+" (design/html, data-nav2)
// y el menú en arco que abre el "+": Ingreso, Gasto, Gasto con tarjeta, Transferencia.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  IconoCategorias,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoInicio,
  IconoLista,
  IconoMas,
  IconoPlanes,
  IconoTarjeta,
  IconoTransferencia,
} from './iconos.jsx';
import { useOscurecido } from '../estado/useOscurecido.js';
import './BarraNavegacion.css';

const PESTANAS = [
  { ruta: '/', texto: 'Inicio', Icono: IconoInicio, clase: 'inicio', exacta: true },
  { ruta: '/transacciones', texto: 'Transacciones', Icono: IconoLista, clase: 'transacciones' },
  { ruta: '/planes', texto: 'Planes', Icono: IconoPlanes, clase: 'planes' },
  { ruta: '/mi-espacio', texto: 'Mi espacio', Icono: (p) => <IconoCategorias tamano={22} {...p} />, clase: 'mi-espacio' },
];

// Posición de cada círculo respecto al centro del "+" (medidas de design/html/MenuMas.html).
const OPCIONES = [
  { texto: 'Ingreso', ruta: '/nuevo/ingreso', Icono: IconoIngresoDiagonal, color: 'var(--income)', dx: -127, dy: -46 },
  { texto: 'Gasto', ruta: '/nuevo/gasto', Icono: IconoGastoDiagonal, color: 'var(--expense)', dx: -57, dy: -122 },
  { texto: 'Gasto con tarjeta', ruta: '/nuevo/gasto-tarjeta', Icono: (p) => <IconoTarjeta tamano={26} grosor={2.2} {...p} />, color: 'var(--accent-text)', dx: 57, dy: -122 },
  { texto: 'Transferencia', ruta: '/nuevo/transferencia', Icono: IconoTransferencia, color: 'var(--accent-text)', dx: 127, dy: -46 },
];

const DURACION_MS = 220;

function MenuNuevo({ abierto, alCerrar }) {
  const navegar = useNavigate();
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);
  const alCerrarRef = useRef(alCerrar);
  alCerrarRef.current = alCerrar;

  useEffect(() => {
    if (abierto) {
      setMontado(true);
      // Dos cuadros, para que el navegador pinte el estado inicial antes de animar. Se
      // cancela el que esté pendiente: si se cerrara entre los dos, "visible" quedaría encendido.
      let cuadro = requestAnimationFrame(() => {
        cuadro = requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(cuadro);
    }
    setVisible(false);
    const espera = setTimeout(() => setMontado(false), DURACION_MS);
    return () => clearTimeout(espera);
  }, [abierto]);

  useOscurecido(montado, visible); // la franja de la barra de estado acompaña al oscurecido

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento) => evento.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alPulsar);
    return () => {
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

  if (!montado) return null;

  return createPortal(
    <div className={'menu-nuevo' + (visible ? ' visible' : '')} role="dialog" aria-modal="true" aria-label="Nuevo movimiento">
      <div className="menu-nuevo-fondo" onClick={() => alCerrarRef.current()} />
      {/* PRUEBA TEMPORAL (variante D de pruebaFranja.js): cierra al tocar fuera sin cubrir el borde superior. */}
      <div className="menu-nuevo-toque" onClick={() => alCerrarRef.current()} />
      <div className="menu-nuevo-titulo">Nuevo movimiento</div>
      {OPCIONES.map(({ texto, ruta, Icono, color, dx, dy }, indice) => (
        <div
          key={texto}
          className="menu-nuevo-opcion"
          style={{
            '--dx': `${dx}px`,
            '--dy': `${dy}px`,
            '--retraso': `${indice * 25}ms`,
            '--retraso-cierre': `${(OPCIONES.length - 1 - indice) * 15}ms`,
          }}
        >
          <button
            type="button"
            className="menu-nuevo-circulo"
            style={{ color }}
            aria-label={texto}
            onClick={() => {
              alCerrarRef.current();
              navegar(ruta);
            }}
          >
            <Icono />
          </button>
          <span className="menu-nuevo-texto" aria-hidden="true">
            {texto}
          </span>
        </div>
      ))}
      {/* Encima del "+" de la barra: al abrir gira 45° y se convierte en X. */}
      <button type="button" className="boton-mas menu-nuevo-cerrar" aria-label="Cerrar" onClick={() => alCerrarRef.current()}>
        <IconoMas tamano={28} grosor={2.6} />
      </button>
    </div>,
    document.body,
  );
}

export default function BarraNavegacion() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  // Cerrar el menú si cambia la pantalla.
  useEffect(() => setMenuAbierto(false), [pathname]);

  return (
    <>
      <nav className="barra-nav" aria-label="Navegación principal">
        <div className="barra-nav-desvanecido" />
        <div className="barra-nav-fondo" aria-hidden="true">
          <span className="barra-nav-lado" />
          <svg width="136" height="90" viewBox="0 0 136 90" fill="none">
            <path d="M0 0H1C29 0 33 54 68 54S107 0 135 0H136V90H0Z" fill="var(--nav-bg)" />
            <path d="M0 0H1C29 0 33 54 68 54S107 0 135 0H136" transform="translate(0 .5)" stroke="var(--line)" strokeWidth="1" />
          </svg>
          <span className="barra-nav-lado" />
        </div>

        {PESTANAS.map(({ ruta, texto, Icono, clase, exacta }) => (
          <NavLink key={ruta} to={ruta} end={exacta} className={'barra-nav-pestana ' + clase}>
            <span className="barra-nav-punto" aria-hidden="true" />
            <Icono />
            {texto}
          </NavLink>
        ))}

        <button
          type="button"
          className="boton-mas"
          aria-label="Nuevo movimiento"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(true)}
        >
          <IconoMas tamano={28} grosor={2.6} />
        </button>
      </nav>

      <MenuNuevo abierto={menuAbierto} alCerrar={() => setMenuAbierto(false)} />
    </>
  );
}
