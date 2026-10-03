// Nueva cuenta (/cuentas/nueva) y editar cuenta (/cuentas/:id). design/capturas/NuevaCuenta.png
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  CabeceraFormulario,
  Campo,
  EntradaTexto,
  Interruptor,
  MontoEditable,
  PieFormulario,
  RejillaIconos,
} from '../componentes/Formulario.jsx';
import { IconoBanco, IconoBasura, IconoCheck, IconoOjo, IconoTexto } from '../componentes/iconos.jsx';
import { ICONOS_CUENTA, IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { eliminarCuenta, guardarCuenta, TIPOS_CUENTA, tipoCuenta } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { volver } from '../utilidades/navegacion.js';

const LISTA = '/mi-espacio/cuentas';

export default function FormularioCuenta() {
  const { id } = useParams();
  const { cuentas, cargando } = useDatos();
  const editando = id !== 'nueva';
  const cuenta = editando ? cuentas.find((c) => c.id === id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar cuenta" volverA={LISTA} />;
  if (editando && !cuenta) return <Navigate to={LISTA} replace />;
  // key: al pasar de una cuenta a otra, el formulario empieza de nuevo con sus datos.
  return <Campos key={id} cuenta={cuenta} />;
}

function Campos({ cuenta }) {
  const navegar = useNavigate();
  const [datos, setDatos] = useState(
    () =>
      cuenta ?? { nombre: '', tipo: 'banco', saldoInicial: 0, icono: tipoCuenta('banco').icono, incluirEnSaldo: true },
  );
  // Mientras no se elija un ícono a mano, sigue al tipo (Efectivo → billete…).
  const [iconoAMano, setIconoAMano] = useState(Boolean(cuenta));
  const [panelTipo, setPanelTipo] = useState(false);
  const [panelEliminar, setPanelEliminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));

  const elegirTipo = (tipo) => cambiar(iconoAMano ? { tipo } : { tipo, icono: tipoCuenta(tipo).icono });

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarCuenta(cuenta?.id, datos);
      volver(navegar, LISTA);
    } finally {
      setGuardando(false);
    }
  };

  // Primero se vuelve a la lista y después se borra: así el formulario no se queda mostrando
  // una cuenta que ya no existe.
  const eliminar = () => {
    volver(navegar, LISTA);
    eliminarCuenta(cuenta.id);
  };

  return (
    <div>
      <CabeceraFormulario titulo={cuenta ? 'Editar cuenta' : 'Nueva cuenta'} volverA={LISTA}>
        <MontoEditable etiqueta="Saldo inicial" valor={datos.saldoInicial} alCambiar={(saldoInicial) => cambiar({ saldoInicial })} />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Nombre">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Cuenta de ahorros" />
          </Campo>
          <Campo Icono={IconoBanco} etiqueta="Tipo" alTocar={() => setPanelTipo(true)}>
            {tipoCuenta(datos.tipo).texto}
          </Campo>
          <Campo Icono={IconoOjo} etiqueta="En el saldo">
            <Interruptor
              activo={datos.incluirEnSaldo}
              alCambiar={(incluirEnSaldo) => cambiar({ incluirEnSaldo })}
              etiqueta="Incluir en el saldo total"
            />
          </Campo>
        </div>

        <h2 className="titulo-seccion">Ícono</h2>
        <RejillaIconos
          nombres={ICONOS_CUENTA}
          elegido={datos.icono}
          etiqueta="Ícono"
          alElegir={(icono) => {
            setIconoAMano(true);
            cambiar({ icono });
          }}
        />

        {cuenta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanelEliminar(true)}>
            <IconoBasura />
            Eliminar cuenta
          </button>
        )}
      </div>

      <PieFormulario>
        <button type="button" className="boton-principal" disabled={guardando} onClick={guardar}>
          Guardar cuenta
        </button>
      </PieFormulario>

      {/* Como los demás paneles de elección: no se cierra al elegir (Listo o tocar fuera). */}
      <PanelInferior
        abierto={panelTipo}
        alCerrar={() => setPanelTipo(false)}
        titulo="Tipo de cuenta"
        accion={{ texto: 'Listo', alTocar: () => setPanelTipo(false) }}
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
                <span className="icono-circulo grande">
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

      <PanelInferior abierto={panelEliminar} alCerrar={() => setPanelEliminar(false)} titulo="¿Eliminar la cuenta?">
        <p className="panel-texto">Se borra «{cuenta?.nombre}» de este teléfono. No se puede deshacer.</p>
        <button type="button" className="boton-peligro" onClick={eliminar}>
          Eliminar
        </button>
        <button type="button" className="boton-secundario" onClick={() => setPanelEliminar(false)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
