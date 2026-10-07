// Menú → Apariencia (rehecha en la Sesión 13, pedido del dueño): arriba una vista previa que cambia en
// vivo con todo lo de abajo (es la app misma pintada con sus clases, no una imagen); debajo el color
// principal, el modo y los íconos: estilo (sólido o suave), forma (cuadrada o redonda) y color
// (variado o del tema).
import { useLayoutEffect, useRef, useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import {
  IconoBanco,
  IconoCheck,
  IconoCuentas,
  IconoFlecha,
  IconoMas,
  IconoPaleta,
  IconoTarjeta,
} from '../componentes/iconos.jsx';
import { cambiarAjustes, useAjustes } from '../estado/ajustes.js';
import { ACENTO_PREDETERMINADO, ACENTOS, estiloIconoTono } from '../tema/colores.js';
import { useTema } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import './Apariencia.css';

const MODOS = [
  { valor: 'claro', titulo: 'Claro' },
  { valor: 'oscuro', titulo: 'Oscuro' },
  { valor: 'auto', titulo: 'Automático' },
];

// Tres íconos de muestra con el tono que llevan en el Menú (Apariencia, Cuentas, Tarjetas).
const TRES = [
  { Icono: IconoPaleta, tono: 'c' },
  { Icono: IconoCuentas, tono: 'f' },
  { Icono: IconoTarjeta, tono: 'a' },
];

const BRILLO = 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0) 70%)';

// Las muestras de cada opción se pintan como quedaría esa opción, sin importar lo elegido en las
// otras filas: solo cambia lo que esa fila decide.
const ESTILOS = [
  {
    valor: 'solido',
    titulo: 'Sólido',
    muestra: { backgroundColor: 'var(--icono-fondo)', backgroundImage: BRILLO, color: 'var(--icono-texto)' },
  },
  {
    valor: 'suave',
    titulo: 'Suave',
    muestra: { backgroundColor: 'var(--accent-soft)', backgroundImage: 'none', color: 'var(--accent-text)' },
  },
];
const FORMAS = [
  { valor: 'cuadrada', titulo: 'Cuadrada', muestra: { borderRadius: '28%' } },
  { valor: 'redonda', titulo: 'Redonda', muestra: { borderRadius: '50%' } },
];
const COLORES = [
  { valor: 'predeterminado', titulo: 'Variado' },
  { valor: 'tema', titulo: 'Del tema' },
];

// Valores de muestra solo para la vista previa (no son datos reales).
const MUESTRA = { saldo: 1284300 };

// Control de opciones sobre la tarjeta, con la píldora que se desliza hasta la elegida.
function Segmentado({ etiqueta, opciones, valor, alElegir, children }) {
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor),
  );
  return (
    <div className="apariencia-segmentado" role="radiogroup" aria-label={etiqueta} style={{ '--n': opciones.length, '--i': indice }}>
      <span className="apariencia-segmentado-pildora" aria-hidden="true" />
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role="radio"
          aria-checked={opcion.valor === valor}
          onClick={() => alElegir(opcion.valor)}
        >
          {children?.(opcion)}
          {opcion.titulo}
        </button>
      ))}
    </div>
  );
}

export default function Apariencia() {
  const { acento, modo, cambiarAcento, cambiarModo, restablecerAcento } = useTema();
  const { colorIconos, estiloIconos, formaIconos } = useAjustes();
  const color = colorIconos === 'tema' ? 'tema' : 'predeterminado';
  const estilo = estiloIconos === 'suave' ? 'suave' : 'solido';
  const forma = formaIconos === 'redonda' ? 'redonda' : 'cuadrada';
  const cambiado = acento !== ACENTO_PREDETERMINADO || color !== 'predeterminado' || estilo !== 'solido' || forma !== 'cuadrada';

  // La vista previa queda pegada bajo la cabecera mientras se baja a las opciones, así se ve cada
  // cambio sin subir. Su top es el alto de la cabecera (cambia con la zona segura del iPhone).
  const pegada = useRef(null);
  const [altoCabecera, setAltoCabecera] = useState(0);
  useLayoutEffect(() => {
    const cabecera = pegada.current?.parentElement?.previousElementSibling;
    if (!cabecera) return;
    const medir = () => setAltoCabecera(cabecera.offsetHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(cabecera);
    return () => observador.disconnect();
  }, []);

  const restablecer = () => {
    restablecerAcento();
    cambiarAjustes({ colorIconos: 'predeterminado', estiloIconos: 'solido', formaIconos: 'cuadrada' });
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Apariencia" volverA="/mi-espacio" />

      <div className="contenido apariencia">
        <div ref={pegada} className="apariencia-pegada" style={{ top: altoCabecera }}>
          <h2 className="titulo-seccion">Vista previa</h2>
          <div className="tarjeta apariencia-vista" aria-hidden="true">
            <div className="apariencia-vista-banner">
              <div className="apariencia-vista-etiqueta">Saldo disponible</div>
              <div className="apariencia-vista-saldo">{formatearPesos(MUESTRA.saldo)}</div>
            </div>
            <div className="apariencia-vista-fila">
              <span className="icono-circulo grande">
                <IconoBanco />
              </span>
              <span className="apariencia-vista-textos">
                <span className="apariencia-vista-nombre">Cuenta bancaria</span>
                <span className="apariencia-vista-detalle ingreso">{formatearPesos(912400)}</span>
              </span>
              <span className="apariencia-vista-accion">
                <IconoMas />
              </span>
            </div>
            <div className="apariencia-vista-fila">
              <CirculoCategoria icono="carrito" color="b" talla="mediano" />
              <span className="apariencia-vista-textos">
                <span className="apariencia-vista-nombre">Mercado</span>
                <span className="apariencia-vista-detalle">Alimentos · Cuenta bancaria</span>
              </span>
              <span className="apariencia-vista-valor">−{formatearPesos(85000)}</span>
            </div>
            <div className="apariencia-vista-fila">
              <span className="icono-circulo grande" data-tono="c">
                <IconoPaleta />
              </span>
              <span className="apariencia-vista-textos">
                <span className="apariencia-vista-nombre">Apariencia</span>
              </span>
              <span className="apariencia-vista-flecha">
                <IconoFlecha />
              </span>
            </div>
          </div>
        </div>

        <h2 className="titulo-seccion">Color principal</h2>
        <div className="tarjeta apariencia-colores" role="radiogroup" aria-label="Color principal">
          {ACENTOS.map(({ valor, nombre }) => {
            const elegido = valor === acento;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={elegido}
                aria-label={nombre}
                className={'apariencia-color' + (elegido ? ' elegido' : '')}
                style={{ background: valor }}
                onClick={() => cambiarAcento(valor)}
              >
                {elegido && <IconoCheck />}
              </button>
            );
          })}
        </div>

        <h2 className="titulo-seccion">Modo</h2>
        <div className="tarjeta apariencia-grupo">
          <Segmentado etiqueta="Modo" opciones={MODOS} valor={modo} alElegir={cambiarModo} />
        </div>

        <h2 className="titulo-seccion">Íconos</h2>
        <div className="tarjeta apariencia-grupo">
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Estilo</span>
            <Segmentado etiqueta="Estilo de los íconos" opciones={ESTILOS} valor={estilo} alElegir={(v) => cambiarAjustes({ estiloIconos: v })}>
              {(opcion) => (
                <span className="icono-muestra" style={opcion.muestra} aria-hidden="true">
                  <IconoPaleta tamano={13} />
                </span>
              )}
            </Segmentado>
          </div>
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Forma</span>
            <Segmentado etiqueta="Forma de los íconos" opciones={FORMAS} valor={forma} alElegir={(v) => cambiarAjustes({ formaIconos: v })}>
              {(opcion) => (
                <span className="icono-muestra" style={opcion.muestra} aria-hidden="true">
                  <IconoPaleta tamano={13} />
                </span>
              )}
            </Segmentado>
          </div>
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Color</span>
            <Segmentado etiqueta="Color de los íconos" opciones={COLORES} valor={color} alElegir={(v) => cambiarAjustes({ colorIconos: v })}>
              {(opcion) => (
                <span className="apariencia-muestras" aria-hidden="true">
                  {TRES.map(({ Icono, tono }) => (
                    <span key={tono} className="icono-muestra" style={opcion.valor === 'tema' ? undefined : estiloIconoTono(tono)}>
                      <Icono tamano={11} />
                    </span>
                  ))}
                </span>
              )}
            </Segmentado>
          </div>
        </div>

        {cambiado && (
          <button type="button" className="boton-texto apariencia-restablecer" onClick={restablecer}>
            Restablecer apariencia
          </button>
        )}
      </div>
    </div>
  );
}
