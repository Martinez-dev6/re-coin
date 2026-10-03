import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useTema } from '../tema/TemaContext.jsx';
import { CURVAS, DURACIONES, RETRASOS, aplicarRitmo, leerRitmo } from '../estado/pruebaRitmo.js';
import './MiEspacio.css';

// Mientras no exista la pantalla Perfil (y la base de datos), el encabezado es fijo.
const PERFIL = { nombre: 'José Martínez', iniciales: 'JM' };

const OPCIONES_MODO = [
  { valor: 'claro', titulo: 'Claro', detalle: 'Siempre claro', Icono: IconoSol },
  { valor: 'oscuro', titulo: 'Oscuro', detalle: 'Siempre oscuro', Icono: IconoLuna },
  { valor: 'auto', titulo: 'Automático', detalle: 'Igual que el iPhone', Icono: IconoAutomatico },
];

function Fila({ Icono, texto, onClick, children }) {
  return (
    <button type="button" className="fila-menu" onClick={onClick}>
      <span className="icono-circulo">
        <Icono />
      </span>
      <span className="fila-menu-texto">{texto}</span>
      {children}
      <span className="fila-menu-flecha">
        <IconoFlecha />
      </span>
    </button>
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
  const [panelModo, setPanelModo] = useState(false);
  // PRUEBA TEMPORAL: ajuste del ritmo del oscurecido.
  const [panelRitmo, setPanelRitmo] = useState(false);
  const [ritmo, setRitmo] = useState(leerRitmo);
  const cambiarRitmo = (cambio) =>
    setRitmo((anterior) => {
      const nuevo = { ...anterior, ...cambio };
      aplicarRitmo(nuevo); // sin efectos aparte: aplicarlo dos veces da lo mismo
      return nuevo;
    });
  const conSigno = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
  const pendiente = (clave) => () => navegar('/pendiente/' + clave);
  const modoActual = OPCIONES_MODO.find((o) => o.valor === modo);

  return (
    <div className="mi-espacio">
      <div className="encabezado-fijo">
        <BarraEstado />
        <header className="banner mi-espacio-cabecera">
          <div className="mi-espacio-perfil">
            <div className="mi-espacio-avatar" aria-hidden="true">
              {PERFIL.iniciales}
            </div>
            <div className="mi-espacio-nombre">
              <h1>{PERFIL.nombre}</h1>
              <p>0 cuentas · 0 tarjetas</p>
            </div>
            <button type="button" className="boton-banner" aria-label="Editar perfil" onClick={pendiente('perfil')}>
              <IconoLapiz />
            </button>
          </div>
        </header>
      </div>

      <div className="mi-espacio-contenido">
        <Grupo titulo="Personalizar">
          <Fila Icono={IconoPaleta} texto="Apariencia" onClick={() => navegar('/mi-espacio/apariencia')}>
            <span className="fila-menu-color" style={{ background: acento }} aria-hidden="true" />
          </Fila>
          <Fila Icono={IconoLuna} texto="Modo oscuro" onClick={() => setPanelModo(true)}>
            <span className="fila-menu-valor">{modoActual.titulo}</span>
          </Fila>
          <Fila Icono={IconoPantallaInicio} texto="Pantalla de inicio" onClick={pendiente('pantalla-inicio')} />
        </Grupo>

        <Grupo titulo="Gestionar">
          <Fila Icono={IconoCuentas} texto="Cuentas" onClick={pendiente('cuentas')} />
          <Fila Icono={IconoTarjeta} texto="Tarjetas de crédito" onClick={pendiente('tarjetas')} />
          <Fila Icono={IconoCategorias} texto="Categorías" onClick={pendiente('categorias')} />
          <Fila Icono={IconoEtiqueta} texto="Etiquetas" onClick={pendiente('etiquetas')} />
        </Grupo>

        <Grupo titulo="Analizar">
          <Fila Icono={IconoGraficos} texto="Gráficos" onClick={pendiente('graficos')} />
          <Fila Icono={IconoRendimiento} texto="Rendimiento" onClick={pendiente('rendimiento')} />
        </Grupo>

        <Grupo titulo="Herramientas">
          <Fila Icono={IconoImportar} texto="Importar y exportar" onClick={pendiente('importar-exportar')} />
          <Fila Icono={IconoCampana} texto="Recordatorio diario" onClick={pendiente('recordatorio')} />
        </Grupo>

        {/* PRUEBA TEMPORAL: quitar cuando se elija el ritmo. */}
        <Grupo titulo="Pruebas (temporal)">
          <Fila Icono={IconoAjustes} texto="Ritmo del oscurecido" onClick={() => setPanelRitmo(true)}>
            <span className="fila-menu-valor">
              {conSigno(ritmo.retraso)} · {ritmo.duracion} · {CURVAS.find((c) => c.valor === ritmo.curva).texto}
            </span>
          </Fila>
        </Grupo>

        <div className="tarjeta mi-espacio-grupo mi-espacio-grupo-suelto">
          <Fila Icono={IconoAjustes} texto="Ajustes" onClick={pendiente('ajustes')} />
          <Fila Icono={IconoAyuda} texto="Ayuda y soporte" onClick={pendiente('ayuda')} />
        </div>

        {/* Para comprobar qué versión tiene abierta el teléfono. */}
        <p className="mi-espacio-version">Sendo · versión {__COMPILACION__}</p>
      </div>

      {/* El panel queda abierto al elegir: así se ve el cambio en vivo. */}
      <PanelInferior
        abierto={panelModo}
        alCerrar={() => setPanelModo(false)}
        titulo="Modo oscuro"
        accion={{ texto: 'Listo', alTocar: () => setPanelModo(false) }}
      >
        <div role="radiogroup" aria-label="Modo oscuro">
          {OPCIONES_MODO.map(({ valor, titulo, detalle, Icono }) => {
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
                <span className="icono-circulo grande">
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

      {/* PRUEBA TEMPORAL. Este mismo panel oscurece: se prueba cerrándolo y abriéndolo. */}
      <PanelInferior
        abierto={panelRitmo}
        alCerrar={() => setPanelRitmo(false)}
        titulo="Ritmo del oscurecido"
        accion={{ texto: 'Listo', alTocar: () => setPanelRitmo(false) }}
      >
        <p className="panel-opcion-detalle" style={{ margin: '0 0 4px' }}>
          Elige, cierra y abre este panel o el menú del "+", sin grabar la pantalla. Más negativo: la pantalla
          arranca antes; más positivo: arranca después.
        </p>
        <h3 className="titulo-seccion">Arranque de la pantalla (ms)</h3>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {RETRASOS.map((valor) => (
            <button
              key={valor}
              type="button"
              className="chip"
              aria-pressed={ritmo.retraso === valor}
              onClick={() => cambiarRitmo({ retraso: valor })}
            >
              <span>{conSigno(valor)}</span>
            </button>
          ))}
        </div>
        <h3 className="titulo-seccion">Duración (ms)</h3>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {DURACIONES.map((valor) => (
            <button
              key={valor}
              type="button"
              className="chip"
              aria-pressed={ritmo.duracion === valor}
              onClick={() => cambiarRitmo({ duracion: valor })}
            >
              <span>{valor}</span>
            </button>
          ))}
        </div>
        <h3 className="titulo-seccion">Curva</h3>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {CURVAS.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              className="chip"
              aria-pressed={ritmo.curva === valor}
              onClick={() => cambiarRitmo({ curva: valor })}
            >
              <span>{texto}</span>
            </button>
          ))}
        </div>
      </PanelInferior>
    </div>
  );
}
