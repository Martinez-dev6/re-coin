// Barra inferior fija (alto en --barra-nav-alto) con la curva alrededor del "+" (design/html, data-nav2)
// y el menú en arco que abre el "+": Gasto con tarjeta, Ingreso, Transferencia, Gasto.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  IconoCategorias,
  IconoGasto,
  IconoIngreso,
  IconoInicio,
  IconoLista,
  IconoMas,
  IconoPlanes,
  IconoTarjeta,
  IconoTransferencia,
} from './iconos.jsx';
import { useOscurecido } from '../estado/useOscurecido.js';
import { diaYMes, hoyTexto } from '../utilidades/fechas.js';
import { prepararTeclado } from '../utilidades/teclado.js';
import ToqueHaptico from './ToqueHaptico.jsx';
import './BarraNavegacion.css';

const PESTANAS = [
  { ruta: '/', texto: 'Inicio', Icono: IconoInicio, clase: 'inicio', exacta: true },
  { ruta: '/transacciones', texto: 'Transacciones', Icono: IconoLista, clase: 'transacciones' },
  { ruta: '/planes', texto: 'Planes', Icono: IconoPlanes, clase: 'planes' },
  { ruta: '/mi-espacio', texto: 'Menú', Icono: (p) => <IconoCategorias tamano={22} {...p} />, clase: 'mi-espacio' },
];

// Posición de cada círculo respecto al centro del "+" (medidas de design/html/MenuMas.html).
// De izquierda a derecha. El gasto, el que más se usa, va último: abajo a la derecha, donde
// llega el pulgar (pedido del dueño, 2026-10-04). Cada ícono con su color fijo, sin importar el
// color del tema: tarjeta amarilla, ingreso verde, transferencia azul, gasto rojo.
const OPCIONES = [
  { texto: 'Gasto con tarjeta', ruta: '/nuevo/gasto-tarjeta', Icono: (p) => <IconoTarjeta tamano={26} grosor={2.2} {...p} />, color: 'var(--menu-tarjeta)', dx: -127, dy: -46 },
  { texto: 'Ingreso', ruta: '/nuevo/ingreso', Icono: IconoIngreso, color: 'var(--income)', dx: -57, dy: -122 },
  { texto: 'Transferencia', ruta: '/nuevo/transferencia', Icono: IconoTransferencia, color: 'var(--menu-transferencia)', dx: 57, dy: -122 },
  { texto: 'Gasto', ruta: '/nuevo/gasto', Icono: IconoGasto, color: 'var(--expense)', dx: 127, dy: -46 },
];

const DURACION_MS = 220;

// El menú también se abre desde fuera de la barra (Sesión 9, pedido del dueño): "+ Agregar" de un día
// del calendario de Planes. Con una fecha que no es hoy, el título dice "Movimiento para el 22 de
// octubre" y cada opción abre su formulario con esa fecha (?fecha=, sin el selector de tipo); con
// hoy (o sin fecha), es el menú de siempre.
let pedido = { abierto: false, fecha: null };
const oyentes = new Set();
const avisar = () => oyentes.forEach((oyente) => oyente());
export function abrirMenuNuevo(fecha = null) {
  pedido = { abierto: true, fecha: fecha && fecha !== hoyTexto() ? fecha : null };
  avisar();
}
function cerrarMenuNuevo() {
  pedido = { ...pedido, abierto: false };
  avisar();
}
const useMenuNuevo = () =>
  useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    () => pedido,
  );

function MenuNuevo({ abierto, fecha, alCerrar }) {
  const navegar = useNavigate();
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);
  // Al elegir una opción, el formulario entra por encima del menú mientras este se cierra. Si
  // el menú quedara encima, su botón "+" se veía flotando sobre el formulario y desaparecía
  // de golpe (video del iPhone, 2026-10-03).
  const [bajoFormulario, setBajoFormulario] = useState(false);
  const alCerrarRef = useRef(alCerrar);
  alCerrarRef.current = alCerrar;

  useEffect(() => {
    if (abierto) {
      setBajoFormulario(false);
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

  // Con el menú abierto la página no se desplaza, y si se intenta (arrastrar el dedo o la rueda del
  // ratón), el menú se cierra (pedido del dueño, 2026-10-04: antes se podía hacer scroll detrás).
  // Se cierra pasados 10 px de recorrido: un toque con un leve temblor sigue eligiendo la opción.
  useEffect(() => {
    if (!abierto) return;
    let inicio = null;
    const alTocar = (evento) => {
      const toque = evento.touches[0];
      inicio = { x: toque.clientX, y: toque.clientY };
    };
    const alArrastrar = (evento) => {
      evento.preventDefault(); // lo de abajo no se mueve
      const toque = evento.touches[0];
      if (inicio && Math.hypot(toque.clientX - inicio.x, toque.clientY - inicio.y) > 10) alCerrarRef.current();
    };
    const alRodar = (evento) => {
      evento.preventDefault();
      alCerrarRef.current();
    };
    document.addEventListener('touchstart', alTocar, { passive: true });
    document.addEventListener('touchmove', alArrastrar, { passive: false });
    document.addEventListener('wheel', alRodar, { passive: false });
    return () => {
      document.removeEventListener('touchstart', alTocar);
      document.removeEventListener('touchmove', alArrastrar);
      document.removeEventListener('wheel', alRodar);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento) => evento.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alPulsar);
    return () => {
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto]);

  if (!montado) return null;
  const titulo = fecha ? `Movimiento para el ${diaYMes(fecha)}` : 'Nuevo movimiento';

  return createPortal(
    <div
      className={'menu-nuevo' + (visible ? ' visible' : '') + (bajoFormulario ? ' bajo-formulario' : '')}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="menu-nuevo-fondo" onClick={() => alCerrarRef.current()} />
      <div className="menu-nuevo-titulo">{titulo}</div>
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
              // El formulario abre con el teclado listo para el valor (sube al terminar de entrar).
              prepararTeclado();
              setBajoFormulario(true);
              alCerrarRef.current();
              navegar(fecha ? `${ruta}?fecha=${fecha}` : ruta);
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
  const { abierto: menuAbierto, fecha } = useMenuNuevo();
  const { pathname } = useLocation();

  // Cerrar el menú si cambia la pantalla.
  useEffect(() => cerrarMenuNuevo(), [pathname]);

  return (
    <>
      <nav className="barra-nav" aria-label="Navegación principal">
        <div className="barra-nav-desvanecido" />
        <div className="barra-nav-fondo" aria-hidden="true">
          <span className="barra-nav-lado" />
          <svg width="136" height="200" viewBox="0 0 136 200" fill="none">
            <path d="M0 0H1C29 0 33 54 68 54S107 0 135 0H136V200H0Z" fill="var(--nav-bg)" />
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
          onClick={() => abrirMenuNuevo()}
        >
          <IconoMas tamano={28} grosor={2.6} />
          {/* Vibración suave al abrir (pedido del dueño, 2026-10-04). */}
          <ToqueHaptico />
        </button>
      </nav>

      <MenuNuevo abierto={menuAbierto} fecha={fecha} alCerrar={cerrarMenuNuevo} />
    </>
  );
}
