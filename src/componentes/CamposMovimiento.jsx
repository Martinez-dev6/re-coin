// Filas y paneles de elección de un movimiento (gasto, ingreso, transferencia o gasto con tarjeta),
// compartidos por Nuevo (FormularioMovimiento, en pantalla) y Editar (EditarMovimiento, en ventana
// flotante). Lo propio de cada uno entra por props: al crear, la descripción con el corazón de
// favoritos, "Gasto recurrente" y las opciones "Nueva…" de los paneles; al editar, la hora.
// FilasMovimiento va dentro del formulario y PanelesMovimiento después de él, para que los paneles
// queden encima. Los dos reciben datos y setDatos (el estado del formulario) y panel y setPanel
// ('categoria' | 'cuentaId' | 'cuentaDestinoId' | 'tarjetaId' | 'cuotas' | 'factura' | 'etiquetas' |
// 'observacion', o null).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDatos } from '../datos/DatosContext.jsx';
import { guardarEtiqueta } from '../datos/etiquetas.js';
import { cuotasDe, facturaDeFecha, nombreFactura, sumarMeses } from '../datos/tarjetas.js';
import { abrirVentana } from '../estado/ventanas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import { conNegritas } from '../utilidades/negritas.jsx';
import CirculoCategoria from './CirculoCategoria.jsx';
import { Campo, EntradaFecha, EntradaTexto, Interruptor } from './Formulario.jsx';
import {
  IconoCalendario,
  IconoCapas,
  IconoCategorias,
  IconoCheck,
  IconoCheckCirculo,
  IconoCuentas,
  IconoEtiqueta,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoMas,
  IconoNota,
  IconoRecibo,
  IconoTarjeta,
  IconoTexto,
} from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from './PanelInferior.jsx';

// Íconos de las filas con su tamaño de fila (18 px).
const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoPagado = (p) => <IconoCheckCirculo tamano={18} grosor={2} {...p} />;
const IconoCuotas = (p) => <IconoCapas tamano={18} {...p} />;
const IconoFactura = (p) => <IconoRecibo tamano={18} {...p} />;

export const EJEMPLOS = {
  gasto: 'Ej. Gasolina',
  ingreso: 'Ej. Pago de cliente',
  transferencia: 'Opcional',
  gastoTarjeta: 'Ej. Llantas',
};

// Hasta cuántas cuotas se puede diferir una compra.
const CUOTAS = Array.from({ length: 36 }, (_, i) => i + 1);

// "3 de $ 100.000" (la primera cuota lleva lo que no da exacto) o "Sin cuotas".
function textoCuotas(cuotas, valor) {
  if (!(cuotas > 1)) return 'Sin cuotas';
  if (!(valor > 0)) return `${cuotas} cuotas`;
  return `${cuotas} de ${formatearPesos(cuotasDe({ valor, cuotas, factura: '2000-01' }).at(-1).valor)}`;
}

// Facturas que se pueden elegir: la anterior a la que toca por la fecha y las tres siguientes.
function opcionesFactura(tarjeta, fecha) {
  if (!tarjeta) return [];
  const propia = facturaDeFecha(tarjeta, fecha);
  return [-1, 0, 1, 2, 3].map((n) => sumarMeses(propia, n));
}

const vacio = (texto) => <span className="campo-vacio">{texto}</span>;

// descripcion: la fila Descripción, si no es la sencilla (al crear lleva el corazón de favoritos).
// despuesDeFecha: filas que van justo después de la fecha. cambiarPagado: si no se pasa, solo
// cambia el campo.
export function FilasMovimiento({ datos, setDatos, setPanel, cambiarFecha, cambiarPagado, descripcion, despuesDeFecha }) {
  const { cuenta, categoria: buscarCategoria, etiqueta, tarjeta } = useDatos();
  const { tipo } = datos;
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const categoria = buscarCategoria(datos.categoriaId);
  const nombresEtiquetas = datos.etiquetaIds.map((id) => etiqueta(id)?.nombre).filter(Boolean);
  const nombreCuenta = (id) => cuenta(id)?.nombre ?? vacio('Elegir');
  const textoPagado = tipo === 'ingreso' ? 'Recibido' : 'Pagado';

  const filaCategoria = (
    <Campo Icono={IconoCategorias} etiqueta="Categoría" alTocar={() => setPanel('categoria')}>
      {categoria ? (
        <>
          <CirculoCategoria icono={categoria.icono} color={categoria.color} talla="chico" />
          <span className="campo-recortado">{categoria.nombre}</span>
        </>
      ) : (
        vacio('Elegir')
      )}
    </Campo>
  );

  return (
    <div className="tarjeta campos">
      {descripcion ?? (
        <Campo Icono={IconoTexto} etiqueta="Descripción">
          <EntradaTexto valor={datos.descripcion} alCambiar={(descripcion) => cambiar({ descripcion })} ejemplo={EJEMPLOS[tipo]} />
        </Campo>
      )}
      {tipo === 'transferencia' ? (
        <>
          <Campo Icono={IconoDesde} etiqueta="Desde" alTocar={() => setPanel('cuentaId')}>
            {nombreCuenta(datos.cuentaId)}
          </Campo>
          <Campo Icono={IconoHacia} etiqueta="Hacia" alTocar={() => setPanel('cuentaDestinoId')}>
            {nombreCuenta(datos.cuentaDestinoId)}
          </Campo>
        </>
      ) : tipo === 'gastoTarjeta' ? (
        <>
          {filaCategoria}
          <Campo Icono={IconoTarjeta} etiqueta="Tarjeta" alTocar={() => setPanel('tarjetaId')}>
            {tarjeta(datos.tarjetaId)?.nombre ?? vacio('Elegir')}
          </Campo>
          <Campo Icono={IconoCuotas} etiqueta="Cuotas" alTocar={() => setPanel('cuotas')}>
            {textoCuotas(datos.cuotas, datos.valor)}
          </Campo>
          <Campo Icono={IconoFactura} etiqueta="Factura" alTocar={() => setPanel('factura')}>
            {datos.factura ? nombreFactura(datos.factura) : vacio('Elegir')}
          </Campo>
        </>
      ) : (
        <>
          {filaCategoria}
          <Campo Icono={IconoCuentas} etiqueta="Cuenta" alTocar={() => setPanel('cuentaId')}>
            {nombreCuenta(datos.cuentaId)}
          </Campo>
        </>
      )}
      <Campo Icono={IconoFecha} etiqueta="Fecha" conFlecha>
        <EntradaFecha valor={datos.fecha} alCambiar={cambiarFecha} />
      </Campo>
      {despuesDeFecha}
      {tipo !== 'transferencia' && (
        <Campo Icono={IconoEtiqueta} etiqueta="Etiquetas" alTocar={() => setPanel('etiquetas')}>
          {nombresEtiquetas.length > 0 ? <span className="campo-recortado">{nombresEtiquetas.join(', ')}</span> : vacio('Agregar')}
        </Campo>
      )}
      {tipo !== 'transferencia' && tipo !== 'gastoTarjeta' && (
        <Campo Icono={IconoPagado} etiqueta={textoPagado}>
          <Interruptor
            activo={Boolean(datos.pagado)}
            etiqueta={textoPagado}
            alCambiar={cambiarPagado ?? ((pagado) => cambiar({ pagado }))}
          />
        </Campo>
      )}
      <Campo Icono={IconoNota} etiqueta="Observación" alTocar={() => setPanel('observacion')}>
        {datos.observacion ? <span className="campo-recortado">{datos.observacion}</span> : vacio('Agregar nota')}
      </Campo>
    </div>
  );
}

// Los paneles no se cierran al elegir (Listo o tocar fuera). conNuevas: con "Nueva" categoría,
// cuenta o tarjeta (al crear; al editar, la ventana se perdería). elegirTarjeta y elegirFactura: si
// no se pasan, solo cambian el campo.
export function PanelesMovimiento({ datos, setDatos, panel, setPanel, elegirTarjeta, elegirFactura, conNuevas = false }) {
  const navegar = useNavigate();
  const { cuentas, categorias, etiquetas, tarjetas, tarjeta: buscarTarjeta } = useDatos();
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const cerrar = () => setPanel(null);
  const listo = { texto: 'Listo', alTocar: cerrar };
  const transferencia = datos.tipo === 'transferencia';
  // Las categorías son de gasto o de ingreso; el gasto con tarjeta usa las de gasto.
  const tipoCategoria = datos.tipo === 'ingreso' ? 'ingreso' : 'gasto';

  // Origen y destino nunca son la misma: si se elige como origen la de destino, se intercambian.
  const elegirCuenta = (campo, id) =>
    setDatos((d) => {
      const otro = campo === 'cuentaId' ? 'cuentaDestinoId' : 'cuentaId';
      if (d.tipo === 'transferencia' && d[otro] === id) return { ...d, [campo]: id, [otro]: d[campo] };
      return { ...d, [campo]: id };
    });

  const alternarEtiqueta = (id) =>
    setDatos((d) => ({
      ...d,
      etiquetaIds: d.etiquetaIds.includes(id) ? d.etiquetaIds.filter((e) => e !== id) : [...d.etiquetaIds, id],
    }));

  // Cierra el panel y, cuando terminó de bajar, va a crear lo que falta (la vuelta es al formulario,
  // que conserva lo escrito).
  const irACrear = (ruta) => {
    cerrar();
    setTimeout(() => navegar(ruta), DURACION_PANEL_MS + 30);
  };
  // Nueva cuenta o tarjeta: ventana flotante encima del formulario (Sesión 9); lo escrito se queda.
  const abrirEncima = (tipoVentana) => {
    cerrar();
    setTimeout(() => abrirVentana(tipoVentana), DURACION_PANEL_MS + 30);
  };

  return (
    <>
      <PanelInferior abierto={panel === 'categoria'} alCerrar={cerrar} titulo="Categoría" accion={listo}>
        <div className="panel-desplazable">
          <div className="rejilla-categorias" role="radiogroup" aria-label="Categoría">
            {categorias
              .filter((c) => c.tipo === tipoCategoria)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === datos.categoriaId}
                  className="rejilla-categorias-opcion"
                  onClick={() => cambiar({ categoriaId: c.id })}
                >
                  <CirculoCategoria icono={c.icono} color={c.color} talla="grande" />
                  <span>{c.nombre}</span>
                </button>
              ))}
            {conNuevas && (
              <button
                type="button"
                className="rejilla-categorias-opcion nueva"
                onClick={() => irACrear(`/categorias/nueva?tipo=${tipoCategoria}`)}
              >
                <span className="rejilla-categorias-nueva">
                  <IconoMas />
                </span>
                <span>Nueva</span>
              </button>
            )}
          </div>
        </div>
      </PanelInferior>

      {['cuentaId', 'cuentaDestinoId'].map((campo) => (
        <PanelInferior
          key={campo}
          abierto={panel === campo}
          alCerrar={cerrar}
          titulo={!transferencia ? 'Cuenta' : campo === 'cuentaId' ? 'Desde' : 'Hacia'}
          accion={listo}
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
            {conNuevas && (
              <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => abrirEncima('cuenta')}>
                <span className="icono-circulo grande">
                  <IconoMas />
                </span>
                <span className="panel-opcion-titulo">Nueva cuenta</span>
              </button>
            )}
          </div>
        </PanelInferior>
      ))}

      <PanelInferior abierto={panel === 'tarjetaId'} alCerrar={cerrar} titulo="Tarjeta" accion={listo}>
        <div className="panel-desplazable" role="radiogroup" aria-label="Tarjeta">
          {tarjetas.map((t) => {
            const marcada = t.id === datos.tarjetaId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion"
                onClick={() => (elegirTarjeta ? elegirTarjeta(t.id) : cambiar({ tarjetaId: t.id }))}
              >
                <span className="icono-circulo grande" style={estiloIconoCuenta(t.color)}>
                  <IconoPorNombre nombre={t.icono} tamano={20} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{t.nombre}</span>
                  <span className="panel-opcion-detalle">Disponible {formatearPesos(Math.max(0, t.cupo - t.usado))}</span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
          {conNuevas && (
            <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => abrirEncima('tarjeta')}>
              <span className="icono-circulo grande">
                <IconoMas />
              </span>
              <span className="panel-opcion-titulo">Nueva tarjeta</span>
            </button>
          )}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'cuotas'} alCerrar={cerrar} titulo="Cuotas" accion={listo}>
        <div className="rejilla-dias" role="radiogroup" aria-label="Cuotas">
          {CUOTAS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={datos.cuotas === n} onClick={() => cambiar({ cuotas: n })}>
              {n}
            </button>
          ))}
        </div>
        <p className="rejilla-dias-nota">
          {datos.cuotas > 1
            ? `Cada cuota va en su factura, empezando por la de ${datos.factura ? nombreFactura(datos.factura).toLowerCase() : 'la compra'}.`
            : 'Todo va en una sola factura.'}
        </p>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'factura'}
        alCerrar={cerrar}
        titulo={datos.cuotas > 1 ? 'Factura de la primera cuota' : 'Factura'}
        accion={listo}
      >
        <div role="radiogroup" aria-label="Factura">
          {opcionesFactura(buscarTarjeta(datos.tarjetaId), datos.fecha).map((mes) => {
            const marcada = mes === datos.factura;
            return (
              <button
                key={mes}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion panel-lista-opcion"
                onClick={() => (elegirFactura ? elegirFactura(mes) : cambiar({ factura: mes }))}
              >
                <span className="icono-circulo">
                  <IconoFactura tamano={16} />
                </span>
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">{nombreFactura(mes)}</span>
                </span>
                <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
              </button>
            );
          })}
        </div>
      </PanelInferior>

      <PanelInferior abierto={panel === 'etiquetas'} alCerrar={cerrar} titulo="Etiquetas" accion={listo}>
        <PanelEtiquetas etiquetas={etiquetas} elegidas={datos.etiquetaIds} alAlternar={alternarEtiqueta} />
      </PanelInferior>

      <PanelInferior abierto={panel === 'observacion'} alCerrar={cerrar} titulo="Observación" accion={listo}>
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

// Lista de etiquetas para marcar, y un campo para crear una nueva (queda marcada).
function PanelEtiquetas({ etiquetas, elegidas, alAlternar }) {
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState(null);

  const crear = async () => {
    if (!nueva.trim()) return;
    try {
      const id = await guardarEtiqueta(null, nueva);
      if (!elegidas.includes(id)) alAlternar(id);
      setNueva('');
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel-desplazable">
      {etiquetas.length === 0 && (
        <p className="panel-texto">Las etiquetas agrupan movimientos de distintas categorías, por ejemplo todo lo del carro.</p>
      )}
      {etiquetas.map((e) => {
        const marcada = elegidas.includes(e.id);
        return (
          <button
            key={e.id}
            type="button"
            role="checkbox"
            aria-checked={marcada}
            className="panel-opcion etiqueta-opcion"
            onClick={() => alAlternar(e.id)}
          >
            <span className="icono-circulo">
              <IconoEtiqueta tamano={16} />
            </span>
            <span className="panel-opcion-textos">
              <span className="panel-opcion-titulo">{e.nombre}</span>
            </span>
            <span className={'casilla' + (marcada ? ' marcada' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
          </button>
        );
      })}
      <form
        className="etiqueta-nueva"
        onSubmit={(evento) => {
          evento.preventDefault();
          crear();
        }}
      >
        <input
          type="text"
          enterKeyHint="done"
          autoComplete="off"
          maxLength={30}
          placeholder="Nueva etiqueta"
          aria-label="Nueva etiqueta"
          value={nueva}
          onChange={(evento) => setNueva(evento.target.value)}
        />
        <button type="submit" className="boton-texto" disabled={!nueva.trim()}>
          Agregar
        </button>
      </form>
      {error && <p className="etiqueta-error">{conNegritas(error)}</p>}
    </div>
  );
}
