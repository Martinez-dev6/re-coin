// Nueva tarjeta (/tarjetas/nueva) y editar tarjeta (/tarjetas/:id). design/capturas/NuevaTarjeta.png
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CabeceraFormulario, Campo, EntradaTexto, MontoEditable, PieFormulario } from '../componentes/Formulario.jsx';
import { IconoBanco, IconoBasura, IconoCalendario, IconoCheck, IconoMas, IconoReloj, IconoTexto } from '../componentes/iconos.jsx';
import { ICONOS_TARJETA, IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import SelectorIcono from '../componentes/SelectorIcono.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { eliminarTarjeta, guardarTarjeta } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import './FormularioMovimiento.css';

const LISTA = '/mi-espacio/tarjetas';
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

const IconoCierre = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoPago = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

export default function FormularioTarjeta() {
  const { id } = useParams();
  const { tarjeta, cargando } = useDatos();
  const editando = id !== 'nueva';
  const existente = editando ? tarjeta(id) : undefined;

  if (editando && cargando) return <CabeceraFormulario titulo="Editar tarjeta" volverA={LISTA} />;
  if (editando && !existente) return <Navigate to={LISTA} replace />;
  return <Campos key={id} tarjeta={existente} />;
}

function Campos({ tarjeta }) {
  const navegar = useNavigate();
  const { cuentas, cuenta, movimientos } = useDatos();
  const [datos, setDatos] = useState(() =>
    tarjeta
      ? {
          nombre: tarjeta.nombre,
          cupo: tarjeta.cupo,
          diaCierre: tarjeta.diaCierre,
          diaPago: tarjeta.diaPago,
          cuentaPagoId: tarjeta.cuentaPagoId,
          icono: tarjeta.icono,
        }
      : { nombre: '', cupo: 0, diaCierre: 15, diaPago: 25, cuentaPagoId: cuentas[0]?.id ?? null, icono: 'tarjeta' },
  );
  const [panel, setPanel] = useState(null); // 'diaCierre' | 'diaPago' | 'cuenta' | 'eliminar'
  const [guardando, setGuardando] = useState(false);
  const eliminando = useRef(false);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const usos = tarjeta ? movimientos.filter((m) => m.tarjetaId === tarjeta.id).length : 0;

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarTarjeta(tarjeta?.id, datos);
      volver(navegar, LISTA);
    } finally {
      setGuardando(false);
    }
  };

  // Primero baja el panel; después se vuelve a la lista y se borra (ver FormularioCuenta).
  const eliminar = () => {
    if (eliminando.current) return;
    eliminando.current = true;
    setPanel(null);
    setTimeout(() => {
      volver(navegar, LISTA);
      eliminarTarjeta(tarjeta.id);
    }, DURACION_PANEL_MS + 30);
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
    <div>
      <CabeceraFormulario titulo={tarjeta ? 'Editar tarjeta' : 'Nueva tarjeta'} volverA={LISTA}>
        <MontoEditable etiqueta="Cupo total" valor={datos.cupo} alCambiar={(cupo) => cambiar({ cupo })} />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Nombre">
            <EntradaTexto valor={datos.nombre} alCambiar={(nombre) => cambiar({ nombre })} ejemplo="Ej. Tarjeta principal" />
          </Campo>
          <Campo Icono={IconoCierre} etiqueta="Día de cierre" alTocar={() => setPanel('diaCierre')}>
            {datos.diaCierre}
          </Campo>
          <Campo Icono={IconoPago} etiqueta="Día de pago" alTocar={() => setPanel('diaPago')}>
            {datos.diaPago}
          </Campo>
          <Campo Icono={IconoBanco} etiqueta="Paga desde" alTocar={() => setPanel('cuenta')}>
            {cuenta(datos.cuentaPagoId)?.nombre ?? <span className="campo-vacio">Elegir</span>}
          </Campo>
        </div>

        <h2 className="titulo-seccion">Ícono</h2>
        <SelectorIcono sugeridos={ICONOS_TARJETA} elegido={datos.icono} alElegir={(icono) => cambiar({ icono })} />

        {tarjeta && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar tarjeta
          </button>
        )}
      </div>

      <PieFormulario>
        <button type="button" className="boton-principal" disabled={guardando} onClick={guardar}>
          Guardar tarjeta
        </button>
      </PieFormulario>

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
            <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => navegar('/cuentas/nueva')}>
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
        <button type="button" className="boton-peligro" onClick={eliminar}>
          Eliminar
        </button>
        <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
