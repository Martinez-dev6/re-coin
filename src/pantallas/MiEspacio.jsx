import { useState } from 'react';
import { useNavigate } from 'react-router';
import Avatar from '../componentes/Avatar.jsx';
import BarraEstado from '../componentes/BarraEstado.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import {
  IconoAjustes,
  IconoAutomatico,
  IconoAyuda,
  IconoCampana,
  IconoCategorias,
  IconoCheck,
  IconoCuentas,
  IconoEtiqueta,
  IconoFlecha,
  IconoGraficos,
  IconoImportar,
  IconoLapiz,
  IconoLuna,
  IconoPaleta,
  IconoPantallaInicio,
  IconoRendimiento,
  IconoSol,
  IconoTarjeta,
} from '../componentes/iconos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { useAjustes } from '../estado/ajustes.js';
import { useTema } from '../tema/TemaContext.jsx';
import './MiEspacio.css';

// tono: color del ícono con "Color de los íconos" en Predeterminado (letra de la paleta de las
// categorías o n, gris; ver comunes.css). Con "Color del tema" todos van con el del tema.
const OPCIONES_MODO = [
  { valor: 'claro', titulo: 'Claro', detalle: 'Siempre claro', Icono: IconoSol, tono: 'd' },
  { valor: 'oscuro', titulo: 'Oscuro', detalle: 'Siempre oscuro', Icono: IconoLuna, tono: 'c' },
  { valor: 'auto', titulo: 'Automático', detalle: 'Igual que el iPhone', Icono: IconoAutomatico, tono: 'n' },
];

// Sin onClick, la fila solo informa (p. ej. "Próximamente"): no es botón ni lleva flecha.
function Fila({ Icono, tono, texto, onClick, children }) {
  const Elemento = onClick ? 'button' : 'div';
  return (
    <Elemento {...(onClick && { type: 'button', onClick })} className="fila-menu">
      <span className="icono-circulo" data-tono={tono}>
        <Icono />
      </span>
      <span className="fila-menu-texto">{texto}</span>
      {children}
      {onClick && (
        <span className="fila-menu-flecha">
          <IconoFlecha />
        </span>
      )}
    </Elemento>
  );
}

function Grupo({ titulo, children }) {
  return (
    <section>
      <h2 className="mi-espacio-grupo-titulo">{titulo}</h2>
      <div className="tarjeta mi-espacio-grupo">{children}</div>
    </section>
  );
}

export default function MiEspacio() {
  const navegar = useNavigate();
  const { acento, modo, cambiarModo } = useTema();
  const { cuentas, tarjetas } = useDatos();
  const { nombre } = useAjustes();
  const [panelModo, setPanelModo] = useState(false);
  const modoActual = OPCIONES_MODO.find((o) => o.valor === modo);

  return (
    <div className="mi-espacio">
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner mi-espacio-cabecera">
          <div className="mi-espacio-perfil">
            <Avatar tamano={46} />
            <div className="mi-espacio-nombre">
              <h1>{nombre.trim() || 'Mi espacio'}</h1>
              <p>
                {cuentas.length === 1 ? '1 cuenta' : `${cuentas.length} cuentas`} ·{' '}
                {tarjetas.length === 1 ? '1 tarjeta' : `${tarjetas.length} tarjetas`}
              </p>
            </div>
            <button type="button" className="boton-banner" aria-label="Editar perfil" onClick={() => navegar('/mi-espacio/perfil')}>
              <IconoLapiz />
            </button>
          </div>
        </header>
      </div>

      <div className="mi-espacio-contenido">
        <Grupo titulo="Personalizar">
          <Fila Icono={IconoPaleta} tono="c" texto="Apariencia" onClick={() => navegar('/mi-espacio/apariencia')}>
            <span className="fila-menu-color" style={{ background: acento }} aria-hidden="true" />
          </Fila>
          <Fila Icono={IconoLuna} tono="g" texto="Modo oscuro" onClick={() => setPanelModo(true)}>
            <span className="fila-menu-valor">{modoActual.titulo}</span>
          </Fila>
          <Fila Icono={IconoPantallaInicio} tono="b" texto="Pantalla de inicio" onClick={() => navegar('/mi-espacio/pantalla-inicio')} />
        </Grupo>

        <Grupo titulo="Gestionar">
          <Fila Icono={IconoCuentas} tono="f" texto="Cuentas" onClick={() => navegar('/mi-espacio/cuentas')} />
          <Fila Icono={IconoTarjeta} tono="a" texto="Tarjetas de crédito" onClick={() => navegar('/mi-espacio/tarjetas')} />
          <Fila Icono={IconoCategorias} tono="e" texto="Categorías" onClick={() => navegar('/mi-espacio/categorias')} />
          <Fila Icono={IconoEtiqueta} tono="g" texto="Etiquetas" onClick={() => navegar('/mi-espacio/etiquetas')} />
        </Grupo>

        <Grupo titulo="Analizar">
          <Fila Icono={IconoGraficos} tono="c" texto="Gráficos" onClick={() => navegar('/mi-espacio/graficos')} />
          <Fila Icono={IconoRendimiento} tono="f" texto="Rendimiento" onClick={() => navegar('/mi-espacio/rendimiento')} />
        </Grupo>

        <Grupo titulo="Herramientas">
          <Fila Icono={IconoImportar} tono="b" texto="Importar y exportar" onClick={() => navegar('/mi-espacio/importar-exportar')} />
          {/* Necesita avisos push con un servidor (una PWA en el iPhone no programa avisos sola).
              Decidido por el dueño (2026-10-04): queda como "Próximamente". */}
          <Fila Icono={IconoCampana} tono="d" texto="Recordatorio diario">
            <span className="fila-menu-valor">Próximamente</span>
          </Fila>
        </Grupo>

        <div className="tarjeta mi-espacio-grupo mi-espacio-grupo-suelto">
          <Fila Icono={IconoAjustes} tono="n" texto="Ajustes" onClick={() => navegar('/mi-espacio/ajustes')} />
          <Fila Icono={IconoAyuda} tono="g" texto="Ayuda y soporte" onClick={() => navegar('/mi-espacio/ayuda')} />
        </div>

        {/* Para comprobar qué versión tiene abierta el teléfono. */}
        <p className="mi-espacio-version">Re-Coin · versión {__COMPILACION__}</p>
      </div>

      {/* El panel queda abierto al elegir: así se ve el cambio en vivo. */}
      <PanelInferior
        abierto={panelModo}
        alCerrar={() => setPanelModo(false)}
        titulo="Modo oscuro"
        accion={{ texto: 'Listo', alTocar: () => setPanelModo(false) }}
      >
        <div role="radiogroup" aria-label="Modo oscuro">
          {OPCIONES_MODO.map(({ valor, titulo, detalle, Icono, tono }) => {
            const marcado = valor === modo;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion"
                onClick={() => cambiarModo(valor)}
              >
                <span className="icono-circulo grande" data-tono={tono}>
                  <Icono />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{titulo}</span>
                  <span className="panel-opcion-detalle">{detalle}</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>
                  {marcado && <IconoCheck tamano={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </PanelInferior>
    </div>
  );
}
