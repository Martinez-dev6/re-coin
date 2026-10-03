// Piezas de los formularios (pantallas con botón Guardar y sin barra inferior).
// Medidas de design/html/NuevaCuenta.html y NuevaCategoria.html.
import { useNavigate } from 'react-router-dom';
import { ACENTOS } from '../tema/colores.js';
import { useTema } from '../tema/TemaContext.jsx';
import { etiquetaDia } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import BarraEstado from './BarraEstado.jsx';
import { IconoCerrar, IconoCheck, IconoFlecha } from './iconos.jsx';
import './CabeceraSubpagina.css';
import './Formulario.css';

// Banner con la X para cerrar sin guardar, el título y contenido opcional debajo.
export function CabeceraFormulario({ titulo, volverA, children }) {
  const navegar = useNavigate();
  return (
    <div className="encabezado-fijo">
      <BarraEstado />
      <header className="banner formulario-cabecera">
        <div className="cabecera-subpagina-fila">
          <button type="button" className="boton-banner" aria-label="Cerrar" onClick={() => volver(navegar, volverA)}>
            <IconoCerrar tamano={20} grosor={2.2} />
          </button>
          <h1 className="cabecera-subpagina-titulo">{titulo}</h1>
          <span className="cabecera-subpagina-hueco" />
        </div>
        {children}
      </header>
    </div>
  );
}

// El cursor siempre al final de la cifra: el monto se escribe de izquierda a derecha.
// Se hace un cuadro después porque el iPhone pone el cursor donde cayó el dedo.
const cursorAlFinal = (evento) => {
  const campo = evento.currentTarget;
  requestAnimationFrame(() => {
    if (document.activeElement === campo) campo.setSelectionRange(campo.value.length, campo.value.length);
  });
};

// Monto grande del banner. Usa el teclado numérico del iPhone (solo cifras, sin decimales).
// En cero el campo queda vacío y "$ 0" es solo el texto de ejemplo: antes, al tocar justo
// sobre el 0 el cursor quedaba antes de él, lo escrito quedaba delante ("50" en vez de "5")
// y había que borrar el cero.
export function MontoEditable({ etiqueta, valor, alCambiar, ref }) {
  return (
    <label className="cabecera-cifra">
      <span className="cabecera-cifra-etiqueta">{etiqueta}</span>
      <input
        ref={ref}
        className="cabecera-cifra-valor formulario-monto"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        autoComplete="off"
        placeholder={formatearPesos(0)}
        value={valor ? formatearPesos(valor) : ''}
        onFocus={cursorAlFinal}
        onClick={cursorAlFinal}
        onChange={(evento) => alCambiar(Number(evento.target.value.replace(/\D/g, '').slice(0, 12)) || 0)}
        onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
      />
    </label>
  );
}

// Fila de 54 px: ícono, etiqueta y valor. Con alTocar es un botón con flecha.
// conFlecha: la flecha sin alTocar (cuando lo que se toca es un campo encima, como la fecha).
export function Campo({ Icono, etiqueta, alTocar, conFlecha = Boolean(alTocar), children }) {
  const contenido = (
    <>
      <span className="campo-icono">
        <Icono />
      </span>
      <span className="campo-etiqueta">{etiqueta}</span>
      <span className="campo-valor">{children}</span>
      {conFlecha && (
        <span className="campo-flecha">
          <IconoFlecha />
        </span>
      )}
    </>
  );
  return alTocar ? (
    <button type="button" className="campo" onClick={alTocar}>
      {contenido}
    </button>
  ) : (
    <label className="campo">{contenido}</label>
  );
}

// Texto dentro de un Campo. 16 px: con menos, el iPhone hace zoom al escribir.
export function EntradaTexto({ valor, alCambiar, ejemplo, maximo = 40 }) {
  return (
    <input
      className="campo-entrada"
      type="text"
      enterKeyHint="done"
      autoComplete="off"
      maxLength={maximo}
      placeholder={ejemplo}
      value={valor}
      onChange={(evento) => alCambiar(evento.target.value)}
      onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
    />
  );
}

// Fecha dentro de un Campo (con conFlecha): se ve el texto ("Hoy · 2 de octubre") y encima hay
// un campo de fecha invisible que ocupa toda la fila; al tocarlo, el iPhone abre su selector.
// valor: 'AAAA-MM-DD'.
export function EntradaFecha({ valor, alCambiar }) {
  const anio = Number(valor.slice(0, 4));
  const abrir = (evento) => {
    try {
      evento.currentTarget.showPicker?.();
    } catch {
      // Ya estaba abierto o el navegador no lo permite: el toque lo abre igual.
    }
  };
  return (
    <>
      {etiquetaDia(valor) + (anio !== new Date().getFullYear() ? ` de ${anio}` : '')}
      <input
        className="campo-fecha"
        type="date"
        required
        aria-label="Fecha"
        value={valor}
        onClick={abrir}
        onChange={(evento) => evento.target.value && alCambiar(evento.target.value)}
      />
    </>
  );
}

export function Interruptor({ activo, alCambiar, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      className={'interruptor' + (activo ? ' activo' : '')}
      onClick={() => alCambiar(!activo)}
    >
      <span />
    </button>
  );
}

// Dos opciones dentro del banner (Gasto | Ingreso). La píldora blanca se desliza a la elegida.
export function Segmentado({ opciones, valor, alCambiar, etiqueta, bloqueado = false }) {
  const elegida = opciones.findIndex((opcion) => opcion.valor === valor);
  return (
    <div className="segmentado" role="radiogroup" aria-label={etiqueta}>
      <span className="selector-pildora" style={{ '--n': opciones.length, '--i': elegida }} aria-hidden="true" />
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role="radio"
          aria-checked={opcion.valor === valor}
          disabled={bloqueado && opcion.valor !== valor}
          onClick={() => alCambiar(opcion.valor)}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  );
}

// colores: [{ valor, nombre }] con valor = letra del par --cat-X del tema.
export function RejillaColores({ colores, elegido, alElegir }) {
  return (
    <div className="tarjeta rejilla-colores" role="radiogroup" aria-label="Color">
      {colores.map(({ valor, nombre }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={valor === elegido}
          aria-label={nombre}
          style={{ background: `var(--cat-${valor})` }}
          onClick={() => alElegir(valor)}
        >
          {valor === elegido && <IconoCheck />}
        </button>
      ))}
    </div>
  );
}

// Color de una cuenta: Predeterminado (null: sigue el color del tema, aunque después cambie)
// o uno de los 10 colores. Solo círculos: la interfaz no muestra nombres de colores (van como
// aria-label). El círculo de Predeterminado muestra el color del tema elegido en Apariencia.
export function SelectorColorCuenta({ valor, alCambiar }) {
  const { acento } = useTema();
  const predeterminado = !valor;
  return (
    <div className="tarjeta selector-color" role="radiogroup" aria-label="Color de la cuenta">
      <button
        type="button"
        role="radio"
        aria-checked={predeterminado}
        className="selector-color-predeterminado"
        onClick={() => alCambiar(null)}
      >
        <span className="selector-color-tema" style={{ background: acento }} aria-hidden="true" />
        <span className="panel-opcion-textos">
          <span className="panel-opcion-titulo">Predeterminado</span>
          <span className="panel-opcion-detalle">Usa el color del tema</span>
        </span>
        <span className={'radio' + (predeterminado ? ' marcado' : '')}>{predeterminado && <IconoCheck tamano={14} />}</span>
      </button>
      <div className="selector-color-circulos">
        {ACENTOS.map(({ valor: color, nombre }) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={color === valor}
            aria-label={nombre}
            className="selector-color-circulo"
            style={{ background: color }}
            onClick={() => alCambiar(color)}
          >
            {color === valor && <IconoCheck tamano={20} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Botón Guardar fijo abajo.
export function PieFormulario({ children }) {
  return <div className="formulario-pie">{children}</div>;
}
