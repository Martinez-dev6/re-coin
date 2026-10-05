// Editar una transferencia en una ventana flotante sobre su detalle (pedido del dueño, Sesión 9:
// antes abría la pantalla completa del formulario). Los mismos campos del formulario: valor,
// descripción, desde, hacia, fecha, hora (solo si es de hoy, como en el formulario) y observación.
// Guardar lleva la animación de "listo" (BotonExito) y después se cierra.
// movimiento: la transferencia; se queda mientras la ventana se va.
import { useEffect, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { faltante, guardarMovimiento, horaDe } from '../datos/movimientos.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { horaActual, hoyTexto, textoHora } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import BotonExito from './BotonExito.jsx';
import { Campo, EntradaFecha, EntradaHora, EntradaTexto, MontoEditable } from './Formulario.jsx';
import {
  IconoCalendario,
  IconoCheck,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoNota,
  IconoReloj,
  IconoTexto,
} from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior from './PanelInferior.jsx';
import VentanaFlotante from './VentanaFlotante.jsx';

const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHora = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

const CAMPOS = ['tipo', 'valor', 'descripcion', 'cuentaId', 'cuentaDestinoId', 'fecha', 'pagado', 'observacion'];
const desde = (m) => ({
  ...Object.fromEntries(CAMPOS.map((c) => [c, m[c] ?? null])),
  descripcion: m.descripcion ?? '',
  observacion: m.observacion ?? '',
  hora: horaDe(m),
  categoriaId: null,
  etiquetaIds: [],
  tarjetaId: null,
  cuotas: null,
  factura: null,
});

export default function EditarTransferencia({ movimiento: m, abierto, alCerrar }) {
  const { cuentas, cuenta: buscarCuenta } = useDatos();
  const [datos, setDatos] = useState(() => desde(m));
  // 'cuentaId' | 'cuentaDestinoId' | 'observacion'
  const [panel, setPanel] = useState(null);
  const [aviso, setAviso] = useState(null);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));

  // Cada vez que se abre, parte de la transferencia como está guardada.
  useEffect(() => {
    if (!abierto) return;
    setDatos(desde(m));
    setAviso(null);
    // Solo al abrir.
  }, [abierto]);

  // La hora, como en el formulario: en su fecha de siempre, la suya; hoy, "Ahora"; otro día, nada.
  const cambiarFecha = (fecha) =>
    cambiar({ fecha, hora: fecha === m.fecha ? horaDe(m) : fecha === hoyTexto() ? 'ahora' : null });

  // Origen y destino nunca son la misma: si se elige como origen la de destino, se intercambian.
  const elegirCuenta = (campo, id) =>
    setDatos((d) => {
      const otro = campo === 'cuentaId' ? 'cuentaDestinoId' : 'cuentaId';
      if (d[otro] === id) return { ...d, [campo]: id, [otro]: d[campo] };
      return { ...d, [campo]: id };
    });

  const guardar = () => {
    const falta = faltante(datos);
    if (falta) {
      setAviso(falta.texto);
      return false;
    }
    setAviso(null);
    return guardarMovimiento(m.id, datos);
  };

  const nombreCuenta = (id) => buscarCuenta(id)?.nombre ?? <span className="campo-vacio">Elegir</span>;

  return (
    <>
      <VentanaFlotante
        abierto={abierto}
        alCerrar={alCerrar}
        titulo="Editar transferencia"
        arriba={<MontoEditable etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />}
      >
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Descripción">
            <EntradaTexto valor={datos.descripcion} alCambiar={(descripcion) => cambiar({ descripcion })} ejemplo="Opcional" />
          </Campo>
          <Campo Icono={IconoDesde} etiqueta="Desde" alTocar={() => setPanel('cuentaId')}>
            {nombreCuenta(datos.cuentaId)}
          </Campo>
          <Campo Icono={IconoHacia} etiqueta="Hacia" alTocar={() => setPanel('cuentaDestinoId')}>
            {nombreCuenta(datos.cuentaDestinoId)}
          </Campo>
          <Campo Icono={IconoFecha} etiqueta="Fecha" conFlecha>
            <EntradaFecha valor={datos.fecha} alCambiar={cambiarFecha} />
          </Campo>
          {datos.hora && (
            <Campo Icono={IconoHora} etiqueta="Hora">
              <EntradaHora
                valor={datos.hora === 'ahora' ? horaActual() : datos.hora}
                texto={datos.hora === 'ahora' ? 'Ahora' : textoHora(datos.hora)}
                alCambiar={(hora) => cambiar({ hora })}
              />
            </Campo>
          )}
          <Campo Icono={IconoNota} etiqueta="Observación" alTocar={() => setPanel('observacion')}>
            {datos.observacion ? (
              <span className="campo-recortado">{datos.observacion}</span>
            ) : (
              <span className="campo-vacio">Agregar nota</span>
            )}
          </Campo>
        </div>
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <BotonExito className="boton-principal guardar-transferencia" alTocar={guardar} alTerminar={alCerrar}>
          Guardar transferencia
        </BotonExito>
      </VentanaFlotante>

      {/* Encima de la ventana (se montan después, así quedan arriba). */}
      {['cuentaId', 'cuentaDestinoId'].map((campo) => (
        <PanelInferior
          key={campo}
          abierto={panel === campo}
          alCerrar={() => setPanel(null)}
          titulo={campo === 'cuentaId' ? 'Desde' : 'Hacia'}
          accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
        >
          <div className="panel-desplazable" role="radiogroup" aria-label="Cuenta">
            {cuentas.map((c) => {
              const marcada = c.id === datos[campo];
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={marcada}
                  className="panel-opcion"
                  onClick={() => elegirCuenta(campo, c.id)}
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
          </div>
        </PanelInferior>
      ))}

      <PanelInferior
        abierto={panel === 'observacion'}
        alCerrar={() => setPanel(null)}
        titulo="Observación"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <textarea
          className="movimiento-nota"
          rows={4}
          maxLength={300}
          placeholder="Escribe una nota"
          value={datos.observacion}
          onChange={(evento) => cambiar({ observacion: evento.target.value })}
        />
      </PanelInferior>
    </>
  );
}
