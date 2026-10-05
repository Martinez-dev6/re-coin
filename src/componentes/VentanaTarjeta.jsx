// Nueva tarjeta y Editar tarjeta en una ventana flotante (Sesión 9, pedido del dueño; antes era la
// pantalla /tarjetas/nueva y /tarjetas/:id/editar). design/capturas/NuevaTarjeta.png
// Se abre con abrirVentana('tarjeta' [, id]) (estado/ventanas.js). El color elegido va en el ícono
// y en toda la ventana (como es pequeña, el dueño lo quiso así); el resto de la app no cambia.
// tarjeta: la que se edita (undefined = nueva); se queda mientras la ventana se va.
import { useEffect, useRef, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { eliminarTarjeta, guardarTarjeta } from '../datos/tarjetas.js';
import { abrirVentana } from '../estado/ventanas.js';
import { variablesDeColor } from '../tema/aplicarTema.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { useTema } from '../tema/TemaContext.jsx';
import { formatearPesos } from '../utilidades/formato.js';
import BotonExito from './BotonExito.jsx';
import { Campo, EntradaTexto, MontoEditable, SelectorColorCuenta } from './Formulario.jsx';
import { IconoBanco, IconoBasura, IconoCalendario, IconoCheck, IconoMas, IconoReloj, IconoTexto } from './iconos.jsx';
import { ICONOS_TARJETA, IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from './PanelInferior.jsx';
import SelectorIcono from './SelectorIcono.jsx';
import VentanaFlotante from './VentanaFlotante.jsx';

const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);
const IconoCierre = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoPago = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

const datosDe = (tarjeta, cuentas) =>
  tarjeta
    ? {
        nombre: tarjeta.nombre,
        cupo: tarjeta.cupo,
        diaCierre: tarjeta.diaCierre,
        diaPago: tarjeta.diaPago,
        cuentaPagoId: tarjeta.cuentaPagoId,
        icono: tarjeta.icono,
        color: tarjeta.color ?? null,
      }
    : { nombre: '', cupo: 0, diaCierre: 15, diaPago: 25, cuentaPagoId: cuentas[0]?.id ?? null, icono: 'tarjeta', color: null };

export default function VentanaTarjeta({ tarjeta, abierto, alCerrar }) {
  const { cuentas, cuenta, movimientos } = useDatos();
  const { oscuro, acento } = useTema();
  const [datos, setDatos] = useState(() => datosDe(tarjeta, cuentas));
  const [panel, setPanel] = useState(null); // 'diaCierre' | 'diaPago' | 'cuenta' | 'eliminar'
  const eliminando = useRef(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const usos = tarjeta ? movimientos.filter((m) => m.tarjetaId === tarjeta.id).length : 0;

  // Cada vez que se abre, parte de la tarjeta como está guardada (o vacía).
  useEffect(() => {
    if (!abierto) return;
    setDatos(datosDe(tarjeta, cuentas));
    setPanel(null);
    eliminando.current = false;
    // Solo al abrir.
  }, [abierto]);

  // Una cuenta recién creada desde aquí ("Crear una cuenta") queda como "Paga desde".
  useEffect(() => {
    if (abierto && !datos.cuentaPagoId && cuentas[0]) cambiar({ cuentaPagoId: cuentas[0].id });
  }, [cuentas.length]);

  // Primero baja el panel de confirmar y se va la ventana; después se borra (si se estaba en la
  // pantalla de la tarjeta, esa pantalla vuelve sola a la lista).
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanel(null);
    alCerrar();
    setTimeout(() => eliminarTarjeta(tarjeta.id), DURACION_PANEL_MS + 30);
  };

  const panelDia = (campo, titulo) => (
    <PanelInferior
      abierto={panel === campo}
      alCerrar={() => setPanel(null)}
      titulo={titulo}
      accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
    >
      <div className="rejilla-dias" role="radiogroup" aria-label={titulo}>
        {DIAS.map((dia) => (
          <button key={dia} type="button" role="radio" aria-checked={datos[campo] === dia} onClick={() => cambiar({ [campo]: dia })}>
            {dia}
          </button>
        ))}
      </div>
      <p className="rejilla-dias-nota">Si el mes no tiene ese día, se usa el último del mes.</p>
    </PanelInferior>
  );

  return (
    <>
      <VentanaFlotante
        abierto={abierto}
        alCerrar={alCerrar}
        titulo={tarjeta ? 'Editar tarjeta' : 'Nueva tarjeta'}
        estilo={variablesDeColor(datos.color, oscuro, acento)}
        arriba={<MontoEditable etiqueta="Cupo total" valor={datos.cupo} alCambiar={(cupo) => cambiar({ cupo })} />}
        pie={
          <BotonExito className="boton-principal" alTocar={() => guardarTarjeta(tarjeta?.id, datos)} alTerminar={alCerrar}>
            Guardar tarjeta
          </BotonExito>
        }
      >
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Nombre" tono="g">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Tarjeta principal" />
          </Campo>
          <Campo Icono={IconoCierre} etiqueta="Día de cierre" tono="a" alTocar={() => setPanel('diaCierre')}>
            {datos.diaCierre}
          </Campo>
          <Campo Icono={IconoPago} etiqueta="Día de pago" tono="e" alTocar={() => setPanel('diaPago')}>
            {datos.diaPago}
          </Campo>
          <Campo Icono={IconoBanco} etiqueta="Paga desde" tono="c" alTocar={() => setPanel('cuenta')}>
            {cuenta(datos.cuentaPagoId)?.nombre ?? <span className="campo-vacio">Elegir</span>}
          </Campo>
        </div>

        <h2 className="titulo-seccion">Ícono</h2>
        <SelectorIcono
          sugeridos={ICONOS_TARJETA}
          elegido={datos.icono}
          alElegir={(icono) => cambiar({ icono })}
          color={datos.color}
        />

        <h2 className="titulo-seccion">Color</h2>
        <SelectorColorCuenta valor={datos.color} alCambiar={(color) => cambiar({ color })} etiqueta="Color de la tarjeta" />

        {tarjeta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar tarjeta
          </button>
        )}
      </VentanaFlotante>

      {panelDia('diaCierre', 'Día de cierre')}
      {panelDia('diaPago', 'Día de pago')}

      <PanelInferior
        abierto={panel === 'cuenta'}
        alCerrar={() => setPanel(null)}
        titulo="Paga desde"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div className="panel-desplazable" role="radiogroup" aria-label="Cuenta desde la que se paga">
          {cuentas.map((c) => {
            const marcada = c.id === datos.cuentaPagoId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion"
                onClick={() => cambiar({ cuentaPagoId: c.id })}
              >
                <span className="icono-circulo grande" style={estiloIconoCuenta(c.color)}>
                  <IconoPorNombre nombre={c.icono} tamano={20} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{c.nombre}</span>
                  <span className={'panel-opcion-detalle ' + (c.saldo < 0 ? 'saldo-negativo' : 'saldo-positivo')}>
                    {formatearPesos(c.saldo)}
                  </span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
          {cuentas.length === 0 && (
            <button
              type="button"
              className="panel-opcion panel-opcion-nueva"
              onClick={() => {
                setPanel(null);
                setTimeout(() => abrirVentana('cuenta'), DURACION_PANEL_MS);
              }}
            >
              <span className="icono-circulo grande">
                <IconoMas />
              </span>
              <span className="panel-opcion-titulo">Crear una cuenta</span>
            </button>
          )}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'eliminar'} alCerrar={() => setPanel(null)} titulo="¿Eliminar la tarjeta?">
        <p className="panel-texto">
          Se borra «{tarjeta?.nombre}» de este teléfono
          {usos > 0 && ` con ${usos === 1 ? 'su compra o pago' : `sus ${usos} compras y pagos`}`}. No se puede deshacer.
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
