// Menú → Apariencia (rehecha en la Sesión 13, pedido del dueño): arriba una vista previa pegada bajo la
// cabecera; debajo el color principal y los íconos: estilo (realista o plano), forma (cuadrada o
// redonda) y color (variado o del tema). Lo elegido es un borrador: solo cambia esta pantalla (la
// vista previa y las muestras). "Aplicar" hace la animación, vuelve al Menú y ahí cambia la app.
// Salir sin aplicar no cambia nada. El modo oscuro no va aquí: está en su fila del Menú.
import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import { PieFormulario } from '../componentes/Formulario.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import {
  IconoBanco,
  IconoCheck,
  IconoCuentas,
  IconoFlecha,
  IconoMas,
  IconoPaleta,
  IconoTarjeta,
} from '../componentes/iconos.jsx';
import { cambiarAjustes, estiloIconosDe, useAjustes } from '../estado/ajustes.js';
import { ACENTO_PREDETERMINADO, ACENTOS, estiloIconoTono } from '../tema/colores.js';
import { variablesMas } from '../tema/aplicarTema.js';
import { tema } from '../tema/tema.js';
import { useTema } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import '../componentes/Formulario.css';
import './Apariencia.css';

// Lo de entrada (decidido por el dueño, Sesión 13): azul eléctrico plano, íconos planos, redondos y
// de color variado. Igual que PREDETERMINADOS en estado/ajustes.js.
const PREDETERMINADA = {
  acento: ACENTO_PREDETERMINADO,
  tema: 'plano',
  estilo: 'plano',
  forma: 'redonda',
  color: 'predeterminado',
  mas: null,
  masEstilo: 'plano',
};

// Dos filas con los mismos colores: el tema liso o con brillo (prueba del dueño, Sesión 13).
const FILAS_DE_COLOR = [
  { tema: 'plano', titulo: 'Plano' },
  { tema: 'realista', titulo: 'Realista' },
];

// Tres íconos de muestra con el tono que llevan en el Menú (Apariencia, Cuentas, Tarjetas).
const TRES = [
  { Icono: IconoPaleta, tono: 'c' },
  { Icono: IconoCuentas, tono: 'f' },
  { Icono: IconoTarjeta, tono: 'a' },
];

// Las muestras de cada opción se pintan como quedaría esa opción; las otras filas siguen lo elegido.
const ESTILOS = [
  { valor: 'realista', titulo: 'Realista' },
  { valor: 'plano', titulo: 'Plano' },
];
const FORMAS = [
  { valor: 'cuadrada', titulo: 'Cuadrada' },
  { valor: 'redonda', titulo: 'Redonda' },
];
const COLORES = [
  { valor: 'predeterminado', titulo: 'Variado' },
  { valor: 'tema', titulo: 'Del tema' },
];

// Colores del tema que usa esta pantalla, con el color elegido en el borrador: solo para ella (la
// cabecera y el resto de la app siguen con el color aplicado).
function variablesDelBorrador(acento, oscuro) {
  const t = tema(acento, oscuro ? 'dark' : 'light');
  return {
    '--banner-bg': t.bannerBg,
    '--on-banner': t.onBanner,
    '--on-banner-muted': t.onBannerMuted,
    '--banner-ring': t.bannerRing,
    '--accent-text': t.accentText,
    '--accent-soft': t.accentSoft,
    '--icono-fondo': t.bannerBg,
    '--icono-texto': t.onBanner,
  };
}

// Variables del "+" del borrador. Con "Igual al tema" se ponen igual (del color del borrador), para no
// heredar en la vista previa el color propio que la app ya tenga aplicado.
const masDelBorrador = (b, oscuro) =>
  b.mas
    ? variablesMas(b.mas, b.masEstilo, oscuro)
    : {
        '--mas-fondo': 'var(--banner-bg)',
        '--mas-dibujo': 'var(--on-banner)',
        '--mas-anillo': 'var(--banner-ring)',
        '--mas-resplandor': 'transparent',
        '--mas-brillo': 'none',
      };

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
  const navegar = useNavigate();
  const { acento, oscuro, cambiarAcento } = useTema();
  const ajustes = useAjustes();
  const aplicada = {
    acento,
    tema: ajustes.estiloTema === 'realista' ? 'realista' : 'plano',
    estilo: estiloIconosDe(ajustes.estiloIconos),
    forma: ajustes.formaIconos === 'cuadrada' ? 'cuadrada' : 'redonda',
    color: ajustes.colorIconos === 'tema' ? 'tema' : 'predeterminado',
    mas: ACENTOS.some((a) => a.valor === ajustes.colorMas) ? ajustes.colorMas : null,
    masEstilo: ajustes.estiloMas === 'realista' ? 'realista' : 'plano',
  };
  const [borrador, setBorrador] = useState(aplicada);
  const [confirmar, setConfirmar] = useState(false);
  const elegir = (cambio) => setBorrador((b) => ({ ...b, ...cambio }));
  const igual = (a, b) =>
    a.acento === b.acento &&
    a.tema === b.tema &&
    a.estilo === b.estilo &&
    a.forma === b.forma &&
    a.color === b.color &&
    a.mas === b.mas &&
    (a.mas === null || a.masEstilo === b.masEstilo);
  const hayCambios = !igual(borrador, aplicada);

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

  // Al terminar la animación del botón: se vuelve al Menú y se aplica a la vez (el color cambia con
  // su fundido mientras la pantalla se va).
  // Aplicar va en verde, como Guardar ingreso; al tocarlo, el círculo del chulo pasa al color elegido
  // (pedido del dueño). Apariencia.css anima el cambio a la vez que el botón se encoge.
  const colorElegido = tema(borrador.acento, oscuro ? 'dark' : 'light');

  const aplicar = () => {
    volver(navegar, '/mi-espacio');
    if (borrador.acento !== acento) cambiarAcento(borrador.acento);
    cambiarAjustes({
      estiloTema: borrador.tema,
      estiloIconos: borrador.estilo,
      formaIconos: borrador.forma,
      colorIconos: borrador.color,
      colorMas: borrador.mas,
      estiloMas: borrador.masEstilo,
    });
  };

  return (
    <div>
      <CabeceraSubpagina titulo="Apariencia" volverA="/mi-espacio" />

      <div
        className="contenido apariencia"
        data-estilo-tema={borrador.tema}
        data-estilo-iconos={borrador.estilo}
        data-forma-iconos={borrador.forma}
        style={{ ...variablesDelBorrador(borrador.acento, oscuro), ...masDelBorrador(borrador, oscuro) }}
      >
        <div ref={pegada} className="apariencia-pegada" style={{ top: altoCabecera }}>
          <h2 className="titulo-seccion">Vista previa</h2>
          <div className="tarjeta apariencia-vista" data-iconos={borrador.color} aria-hidden="true">
            <div className="apariencia-vista-banner">
              <div className="apariencia-vista-etiqueta">Saldo disponible</div>
              <div className="apariencia-vista-saldo">{formatearPesos(1284300)}</div>
              {/* El "+" de la barra, con su color (sección Botón +). */}
              <span className="boton-mas apariencia-vista-mas">
                <IconoMas tamano={22} grosor={2.6} />
              </span>
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
          {FILAS_DE_COLOR.map((fila) => [
            <span key={fila.tema} className="apariencia-colores-fila" aria-hidden="true">
              {fila.titulo}
            </span>,
            ...ACENTOS.map(({ valor, nombre }) => {
              const elegido = valor === borrador.acento && fila.tema === borrador.tema;
              return (
                <button
                  key={fila.tema + valor}
                  type="button"
                  role="radio"
                  aria-checked={elegido}
                  aria-label={`${nombre}, ${fila.titulo.toLowerCase()}`}
                  className={'apariencia-color' + (fila.tema === 'realista' ? ' realista' : '') + (elegido ? ' elegido' : '')}
                  style={{ backgroundColor: valor }}
                  onClick={() => elegir({ acento: valor, tema: fila.tema })}
                >
                  {elegido && <IconoCheck />}
                </button>
              );
            }),
          ])}
        </div>

        {/* Color propio del "+" de la barra (pedido del dueño): igual al tema o uno de los 10, plano o
            realista. Solo el "+". */}
        <h2 className="titulo-seccion">Botón +</h2>
        <div className="tarjeta apariencia-colores" role="radiogroup" aria-label="Color del botón +">
          <button
            type="button"
            role="radio"
            aria-checked={borrador.mas === null}
            className="selector-color-predeterminado apariencia-mas-tema"
            onClick={() => elegir({ mas: null, masEstilo: 'plano' })}
          >
            <span className="selector-color-tema" style={{ backgroundColor: borrador.acento }} aria-hidden="true" />
            <span className="panel-opcion-textos">
              <span className="panel-opcion-titulo">Igual al tema</span>
              <span className="panel-opcion-detalle">Del color principal</span>
            </span>
            <span className={'radio' + (borrador.mas === null ? ' marcado' : '')}>
              {borrador.mas === null && <IconoCheck tamano={14} />}
            </span>
          </button>
          {FILAS_DE_COLOR.map((fila) => [
            <span key={fila.tema} className="apariencia-colores-fila" aria-hidden="true">
              {fila.titulo}
            </span>,
            ...ACENTOS.map(({ valor, nombre }) => {
              const elegido = valor === borrador.mas && fila.tema === borrador.masEstilo;
              return (
                <button
                  key={'mas' + fila.tema + valor}
                  type="button"
                  role="radio"
                  aria-checked={elegido}
                  aria-label={`${nombre}, ${fila.titulo.toLowerCase()}`}
                  className={'apariencia-color' + (fila.tema === 'realista' ? ' realista' : '') + (elegido ? ' elegido' : '')}
                  style={{ backgroundColor: valor }}
                  onClick={() => elegir({ mas: valor, masEstilo: fila.tema })}
                >
                  {elegido && <IconoCheck />}
                </button>
              );
            }),
          ])}
        </div>

        <h2 className="titulo-seccion">Íconos</h2>
        <div className="tarjeta apariencia-grupo">
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Estilo</span>
            <Segmentado etiqueta="Estilo de los íconos" opciones={ESTILOS} valor={borrador.estilo} alElegir={(v) => elegir({ estilo: v })}>
              {(opcion) => (
                <span className="icono-muestra" data-estilo-iconos={opcion.valor} aria-hidden="true">
                  <IconoPaleta tamano={13} />
                </span>
              )}
            </Segmentado>
          </div>
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Forma</span>
            <Segmentado etiqueta="Forma de los íconos" opciones={FORMAS} valor={borrador.forma} alElegir={(v) => elegir({ forma: v })}>
              {(opcion) => (
                <span className="icono-muestra" data-forma-iconos={opcion.valor} aria-hidden="true">
                  <IconoPaleta tamano={13} />
                </span>
              )}
            </Segmentado>
          </div>
          <div className="apariencia-opcion">
            <span className="apariencia-opcion-titulo">Color</span>
            <Segmentado etiqueta="Color de los íconos" opciones={COLORES} valor={borrador.color} alElegir={(v) => elegir({ color: v })}>
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

        {!igual(borrador, PREDETERMINADA) && (
          <button type="button" className="boton-texto apariencia-restablecer" onClick={() => setConfirmar(true)}>
            Restablecer apariencia
          </button>
        )}
      </div>

      {/* Restablecer pide confirmación (pedido del dueño). Cambia el borrador; la app, al Aplicar. */}
      <PanelInferior abierto={confirmar} alCerrar={() => setConfirmar(false)} titulo="¿Restablecer la apariencia?">
        <p className="panel-texto">
          La apariencia vuelve a como viene de entrada. Lo verás en la vista previa; para que cambie la app, toca{' '}
          <strong>Aplicar</strong>.
        </p>
        <button
          type="button"
          className="boton-principal"
          onClick={() => {
            setBorrador(PREDETERMINADA);
            setConfirmar(false);
          }}
        >
          Restablecer
        </button>
        <button type="button" className="boton-secundario" onClick={() => setConfirmar(false)}>
          Cancelar
        </button>
      </PanelInferior>

      <PieFormulario>
        <BotonExito
          className="boton-principal apariencia-aplicar"
          style={{ '--color-elegido': colorElegido.bannerBg, '--texto-elegido': colorElegido.onBanner }}
          disabled={!hayCambios}
          alTerminar={aplicar}
        >
          Aplicar
        </BotonExito>
      </PieFormulario>
    </div>
  );
}
