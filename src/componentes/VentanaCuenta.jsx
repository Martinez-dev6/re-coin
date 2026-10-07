// Nueva cuenta y Editar cuenta en una ventana flotante (Sesión 9, pedido del dueño; antes era la
// pantalla /cuentas/nueva y /cuentas/:id/editar). design/capturas/NuevaCuenta.png
// Se abre con abrirVentana('cuenta' [, id]) (estado/ventanas.js). Toda la ventana va con el color
// elegido para la cuenta, y se ve en vivo al elegirlo; el resto de la app no cambia.
// cuenta: la que se edita (undefined = nueva); se queda mientras la ventana se va.
import { useEffect, useRef, useState } from 'react';
import { eliminarCuenta, guardarCuenta, TIPOS_CUENTA, tipoCuenta } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import { mismosDatos } from '../utilidades/sinCambios.js';
import { esAdelantado } from '../datos/programados.js';
import { variablesDeColor } from '../tema/aplicarTema.js';
import { useTema } from '../tema/TemaContext.jsx';
import BotonExito from './BotonExito.jsx';
import { Campo, EntradaTexto, Interruptor, MontoEditable, SelectorColorCuenta } from './Formulario.jsx';
import { IconoBanco, IconoBasura, IconoCheck, IconoOjo, IconoTexto } from './iconos.jsx';
import { ICONOS_CUENTA, IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from './PanelInferior.jsx';
import SelectorIcono from './SelectorIcono.jsx';
import VentanaFlotante from './VentanaFlotante.jsx';

const nueva = () => ({ nombre: '', tipo: 'banco', saldoInicial: 0, icono: tipoCuenta('banco').icono, color: null, incluirEnSaldo: true });

export default function VentanaCuenta({ cuenta, abierto, alCerrar }) {
  const { movimientos, programados } = useDatos();
  const { oscuro, acento } = useTema();
  const [datos, setDatos] = useState(() => cuenta ?? nueva());
  // Mientras no se elija un ícono a mano, sigue al tipo (Efectivo → billete…).
  const [iconoAMano, setIconoAMano] = useState(Boolean(cuenta));
  const [panel, setPanel] = useState(null); // 'tipo' | 'eliminar'
  const eliminando = useRef(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));

  // Cada vez que se abre, parte de la cuenta como está guardada (o vacía).
  useEffect(() => {
    if (!abierto) return;
    setDatos(cuenta ?? nueva());
    setIconoAMano(Boolean(cuenta));
    setPanel(null);
    eliminando.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo al abrir.
  }, [abierto]);

  const programadosDeLaCuenta = new Set(
    cuenta ? programados.filter((p) => p.cuentaId === cuenta.id || p.cuentaDestinoId === cuenta.id).map((p) => p.id) : [],
  );
  // Los movimientos que se quedan al eliminarla: todos menos los pendientes de sus programados
  // registrados por adelantado, que se borran con ellos (eliminarCuenta).
  const usos = cuenta
    ? movimientos.filter(
        (m) =>
          (m.cuentaId === cuenta.id || m.cuentaDestinoId === cuenta.id) &&
          !(programadosDeLaCuenta.has(m.programadoId) && esAdelantado(m)),
      ).length
    : 0;

  const elegirTipo = (tipo) => cambiar(iconoAMano ? { tipo } : { tipo, icono: tipoCuenta(tipo).icono });

  // Primero baja el panel de confirmar y se va la ventana; después se borra.
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanel(null);
    alCerrar();
    setTimeout(() => eliminarCuenta(cuenta.id), DURACION_PANEL_MS + 30);
  };

  return (
    <>
      <VentanaFlotante
        abierto={abierto}
        alCerrar={alCerrar}
        titulo={cuenta ? 'Editar cuenta' : 'Nueva cuenta'}
        estilo={variablesDeColor(datos.color, oscuro, acento)}
        // Al editar, arriba va el saldo que tiene la cuenta, sin poder cambiarlo aquí (pedido del dueño,
        // Sesión 13): el saldo inicial solo se pone al crearla; después se corrige con Reajustar.
        arriba={
          cuenta ? (
            <div className="cabecera-cifra">
              <span className="cabecera-cifra-etiqueta">Saldo actual</span>
              <span className="cabecera-cifra-valor">{formatearPesos(cuenta.saldo ?? 0)}</span>
            </div>
          ) : (
            <MontoEditable etiqueta="Saldo inicial" valor={datos.saldoInicial} alCambiar={(saldoInicial) => cambiar({ saldoInicial })} />
          )
        }
        pie={
          <BotonExito
            className="boton-principal"
            disabled={Boolean(cuenta) && mismosDatos(datos, cuenta)}
            alTocar={() => guardarCuenta(cuenta?.id, datos)}
            alTerminar={alCerrar}
          >
            {cuenta ? 'Guardar' : 'Guardar cuenta'}
          </BotonExito>
        }
      >
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Nombre" tono="g">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Cuenta de ahorros" />
          </Campo>
          <Campo Icono={IconoBanco} etiqueta="Tipo" tono="c" alTocar={() => setPanel('tipo')}>
            {tipoCuenta(datos.tipo).texto}
          </Campo>
          <Campo Icono={IconoOjo} etiqueta="En el saldo" tono="f">
            <Interruptor
              activo={datos.incluirEnSaldo}
              alCambiar={(incluirEnSaldo) => cambiar({ incluirEnSaldo })}
              etiqueta="Incluir en el saldo total"
            />
          </Campo>
        </div>

        <h2 className="titulo-seccion">Ícono</h2>
        <SelectorIcono
          sugeridos={ICONOS_CUENTA}
          elegido={datos.icono}
          color={datos.color}
          alElegir={(icono) => {
            setIconoAMano(true);
            cambiar({ icono });
          }}
        />

        <h2 className="titulo-seccion">Color</h2>
        <SelectorColorCuenta valor={datos.color} alCambiar={(color) => cambiar({ color })} />

        {cuenta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar cuenta
          </button>
        )}
      </VentanaFlotante>

      {/* Como los demás paneles de elección: no se cierra al elegir (Listo o tocar fuera). */}
      <PanelInferior
        abierto={panel === 'tipo'}
        alCerrar={() => setPanel(null)}
        titulo="Tipo de cuenta"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div role="radiogroup" aria-label="Tipo de cuenta">
          {TIPOS_CUENTA.map((tipo) => {
            const marcado = tipo.valor === datos.tipo;
            return (
              <button
                key={tipo.valor}
                type="button"
                role="radio"
                aria-checked={marcado}
                className="panel-opcion"
                onClick={() => elegirTipo(tipo.valor)}
              >
                <span className="icono-circulo grande" data-tono="c">
                  <IconoPorNombre nombre={tipo.icono} tamano={20} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{tipo.texto}</span>
                </span>
                <span className={'radio' + (marcado ? ' marcado' : '')}>{marcado && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'eliminar'} alCerrar={() => setPanel(null)} titulo="¿Eliminar la cuenta?">
        <p className="panel-texto">
          Se borra <strong>{cuenta?.nombre}</strong> de este teléfono.
          {usos > 0 && (
            <>
              {usos === 1 ? ' Su movimiento se queda' : ` Sus ${usos} movimientos se quedan`}, con{' '}
              <strong>Cuenta eliminada</strong>, y los saldos de las otras cuentas no cambian.
            </>
          )}
          {programadosDeLaCuenta.size > 0 && ' Sus programados sí se borran, con sus pendientes de después de hoy.'} No se puede deshacer.
        </p>
        <BotonExito className="boton-peligro" alTerminar={eliminar}>
          Eliminar
        </BotonExito>
        <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
          Cancelar
        </button>
      </PanelInferior>
    </>
  );
}
