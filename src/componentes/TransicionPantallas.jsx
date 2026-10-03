// Anima el paso de una pantalla a otra, al estilo de las apps del iPhone:
// - Subpantalla (Mi espacio → Cuentas): la nueva llega desde la derecha y la anterior se corre
//   un poco a la izquierda. Al volver, al revés.
// - Formulario (pantallas con Guardar): sube desde abajo y pasa por encima de la barra
//   inferior. Al cerrarlo, baja.
// - Cambio de pestaña: la nueva aparece con un fundido corto y un leve deslizamiento desde el
//   lado de la pestaña tocada.
// La pantalla que se va ya no existe en React: justo antes del cambio se copia su HTML (sin
// eventos) y lo que se anima es esa copia, así no vuelve a dibujarse ni ejecuta nada al salir.
// Durante la animación las dos pantallas quedan fijas y cada una guarda su scroll; al terminar,
// la nueva vuelve al scroll normal de la página.
// La barra inferior va fuera de las pantallas para que no se mueva con ellas.
import { Component, createRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { CURVA_DESLIZAR, sinMovimiento } from '../utilidades/movimiento.js';
import './TransicionPantallas.css';

// El scroll al ir y volver lo maneja este componente, no el navegador.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

// Si el navegador ya animó el regreso (gesto de deslizar desde el borde en Safari), la página
// no lo anima otra vez. Se escucha antes que React Router para tener el dato a tiempo.
let navegadorYaAnimo = false;
window.addEventListener('popstate', (evento) => {
  navegadorYaAnimo = Boolean(evento.hasUAVisualTransition);
});

// Pestañas de la barra inferior, en orden, y formularios (sin barra; ver App.jsx).
const PESTANAS = ['/', '/transacciones', '/planes', '/mi-espacio'];
const FORMULARIOS = ['/nuevo/', '/cuentas/', '/categorias/'];

// pestana: índice en PESTANAS (−1 si no es de ninguna). raiz: la pantalla principal de la
// pestaña (las secciones de Planes también lo son).
function describir(ruta) {
  if (FORMULARIOS.some((inicio) => ruta.startsWith(inicio))) return { formulario: true, pestana: -1, raiz: false };
  const pestana = PESTANAS.findIndex((p) => ruta === p || (p !== '/' && ruta.startsWith(p + '/')));
  return { formulario: false, pestana, raiz: ruta === PESTANAS[pestana] || ruta.startsWith('/planes/') };
}

// arriba: cuál va encima (la que se mueve). sobreBarra: también por encima de la barra inferior.
const RECETAS = {
  entrar: {
    duracion: 400,
    arriba: 'nueva',
    sombra: 'lado',
    nueva: [{ transform: 'translateX(100%)' }, { transform: 'none' }],
    anterior: [{ transform: 'none' }, { transform: 'translateX(-30%)' }],
  },
  volver: {
    duracion: 400,
    arriba: 'anterior',
    sombra: 'lado',
    nueva: [{ transform: 'translateX(-30%)' }, { transform: 'none' }],
    anterior: [{ transform: 'none' }, { transform: 'translateX(100%)' }],
  },
  presentar: {
    duracion: 420,
    arriba: 'nueva',
    sombra: 'arriba',
    sobreBarra: true,
    nueva: [{ transform: 'translateY(100%)' }, { transform: 'none' }],
  },
  cerrar: {
    duracion: 360,
    arriba: 'anterior',
    sombra: 'arriba',
    sobreBarra: true,
    anterior: [{ transform: 'none' }, { transform: 'translateY(100%)' }],
  },
};

// lado: 1 si la pestaña nueva está a la derecha de la anterior, −1 a la izquierda, 0 sin saberlo.
const cambioDePestana = (lado) => ({
  duracion: 260,
  arriba: 'nueva',
  nueva: [{ transform: `translateX(${lado * 24}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
});

function elegirTransicion(desde, hacia, accion) {
  const a = describir(desde.pathname);
  const b = describir(hacia.pathname);
  if (a.formulario !== b.formulario) return b.formulario ? RECETAS.presentar : RECETAS.cerrar;
  if (a.raiz && b.raiz) return a.pestana === b.pestana ? null : cambioDePestana(Math.sign(b.pestana - a.pestana));
  // POP: atrás en el historial. REPLACE: volver() cuando no hay historial propio.
  if (accion !== 'PUSH') return RECETAS.volver;
  // Tocar una pestaña de la barra desde una subpantalla: la misma pestaña vuelve a su pantalla
  // principal; otra pestaña es un cambio de pestaña.
  if (b.raiz) {
    if (a.pestana === b.pestana) return RECETAS.volver;
    return cambioDePestana(a.pestana < 0 ? 0 : Math.sign(b.pestana - a.pestana));
  }
  return RECETAS.entrar;
}

// Copia la pantalla tal como se ve, sin eventos ni foco.
function copiar(pantalla) {
  const copia = pantalla.cloneNode(true);
  // Lo escrito en un campo no es un atributo y cloneNode no lo copia.
  const campos = pantalla.querySelectorAll('input, textarea, select');
  copia.querySelectorAll('input, textarea, select').forEach((campo, indice) => {
    if (campo.type !== 'file') campo.value = campos[indice].value;
  });
  copia.classList.add('pantalla-copia');
  copia.setAttribute('aria-hidden', 'true');
  copia.inert = true;
  return copia;
}

class Pila extends Component {
  pantalla = createRef();
  contenido = createRef();
  // Scroll de cada pantalla del historial (por su key), para dejarla igual al volver a ella.
  posiciones = new Map();
  transicion = null;

  state = {
    clave: this.props.ubicacion.key,
    ruta: this.props.ubicacion.pathname,
    retenerBarra: false,
  };

  // Al abrir un formulario, la barra inferior se queda hasta que el formulario termina de subir
  // por encima de ella. Si se quitara antes, desaparecería de golpe.
  static getDerivedStateFromProps({ ubicacion }, estado) {
    if (ubicacion.key === estado.clave) return null;
    const retenerBarra = !describir(estado.ruta).formulario && describir(ubicacion.pathname).formulario;
    return { clave: ubicacion.key, ruta: ubicacion.pathname, retenerBarra };
  }

  // Corre justo antes de que React cambie el HTML: la pantalla anterior todavía está.
  getSnapshotBeforeUpdate({ ubicacion: desde }) {
    const { ubicacion: hacia, accion } = this.props;
    if (desde.key === hacia.key) return null;
    this.terminar(); // si se cambia otra vez a mitad de una animación, esa salta al final
    this.posiciones.set(desde.key, window.scrollY);
    if (desde.pathname === hacia.pathname) return { mismaPantalla: true, mismaDireccion: desde.search === hacia.search };
    const animar = !sinMovimiento() && !(accion === 'POP' && navegadorYaAnimo);
    const receta = animar ? elegirTransicion(desde, hacia, accion) : null;
    return { receta, copia: receta && copiar(this.pantalla.current), scrollAnterior: window.scrollY };
  }

  componentDidUpdate(_props, _estado, foto) {
    if (!foto) return;
    const { ubicacion, accion } = this.props;
    if (foto.mismaPantalla) {
      // Tocar la pestaña en la que ya se está: sube al principio.
      if (foto.mismaDireccion) window.scrollTo({ top: 0, behavior: sinMovimiento() ? 'auto' : 'smooth' });
      return;
    }
    // Una pantalla nueva empieza arriba; al volver a una anterior, donde se dejó.
    const scroll = accion === 'POP' ? (this.posiciones.get(ubicacion.key) ?? 0) : 0;
    if (foto.receta) {
      this.animar(foto, scroll);
      return;
    }
    window.scrollTo(0, scroll);
    if (this.state.retenerBarra) this.setState({ retenerBarra: false });
  }

  animar({ receta, copia, scrollAnterior }, scroll) {
    const nueva = this.pantalla.current;
    const arriba = receta.arriba === 'nueva' ? nueva : copia;
    arriba.dataset.capa = receta.sobreBarra ? 'sobre-barra' : 'arriba';
    if (receta.sombra) arriba.dataset.sombra = receta.sombra;
    nueva.dataset.transicion = '';
    copia.dataset.transicion = '';
    document.body.append(copia);
    copia.firstElementChild.scrollTop = scrollAnterior;
    this.contenido.current.scrollTop = scroll;

    const opciones = { duration: receta.duracion, easing: CURVA_DESLIZAR, fill: 'both' };
    const animaciones = [];
    if (receta.nueva) animaciones.push(nueva.animate(receta.nueva, opciones));
    if (receta.anterior) animaciones.push(copia.animate(receta.anterior, opciones));

    const transicion = { copia, scroll, animaciones };
    this.transicion = transicion;
    const alTerminar = () => this.transicion === transicion && this.terminar(true);
    Promise.all(animaciones.map((animacion) => animacion.finished)).then(alTerminar, () => {});
    // Por si el navegador congela las animaciones (por ejemplo, con la app en segundo plano).
    transicion.espera = setTimeout(alTerminar, receta.duracion + 200);
  }

  // Quita la copia y devuelve la pantalla nueva al scroll normal, en el mismo cuadro.
  terminar(soltarBarra = false) {
    const transicion = this.transicion;
    if (!transicion) return;
    this.transicion = null;
    clearTimeout(transicion.espera);
    transicion.animaciones.forEach((animacion) => animacion.cancel());
    transicion.copia.remove();
    const pantalla = this.pantalla.current;
    delete pantalla.dataset.transicion;
    delete pantalla.dataset.capa;
    delete pantalla.dataset.sombra;
    window.scrollTo(0, transicion.scroll);
    if (soltarBarra && this.state.retenerBarra) this.setState({ retenerBarra: false });
  }

  render() {
    const { ubicacion, barra, children } = this.props;
    const conBarra = !describir(ubicacion.pathname).formulario || this.state.retenerBarra;
    return (
      <>
        <div ref={this.pantalla} className="pantalla">
          <div ref={this.contenido} className="pantalla-contenido">
            {children}
          </div>
        </div>
        {conBarra && barra}
      </>
    );
  }
}

export default function TransicionPantallas({ barra, children }) {
  const ubicacion = useLocation();
  const accion = useNavigationType();
  return (
    <Pila ubicacion={ubicacion} accion={accion} barra={barra}>
      {children}
    </Pila>
  );
}
