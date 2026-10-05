// Editar un movimiento en una ventana flotante sobre su detalle (pedido del dueño, Sesión 9: primero
// solo transferencias, luego todos). Gasto, ingreso, transferencia y gasto con tarjeta, con los mismos
// campos del formulario (sin el corazón de favoritos). La hora solo sale si el movimiento la tiene
// (como en el formulario: en su fecha de siempre la conserva; con la fecha de hoy, "Ahora"; otro día,
// sin hora). Guardar lleva la animación de "listo" (BotonExito) y después se cierra.
// movimiento: el que se edita; se queda mientras la ventana se va.
import { useEffect, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { faltante, guardarMovimiento, horaDe } from '../datos/movimientos.js';
import { nombreFactura } from '../datos/tarjetas.js';
import { CUOTAS, opcionesFactura, PanelEtiquetas, textoCuotas } from '../pantallas/FormularioMovimiento.jsx';
import { estiloIconoCuenta } from '../tema/colores.js';
import { horaActual, hoyTexto, textoHora } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import BotonExito from './BotonExito.jsx';
import CirculoCategoria from './CirculoCategoria.jsx';
import { Campo, EntradaFecha, EntradaHora, EntradaTexto, Interruptor, MontoEditable } from './Formulario.jsx';
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
  IconoNota,
  IconoRecibo,
  IconoReloj,
  IconoTarjeta,
  IconoTexto,
} from './iconos.jsx';
import { IconoPorNombre } from './iconosPorNombre.jsx';
import PanelInferior from './PanelInferior.jsx';
import VentanaFlotante from './VentanaFlotante.jsx';

const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHora = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;
const IconoPagado = (p) => <IconoCheckCirculo tamano={18} grosor={2} {...p} />;
const IconoCuotas = (p) => <IconoCapas tamano={18} {...p} />;
const IconoFactura = (p) => <IconoRecibo tamano={18} {...p} />;

const TITULOS = {
  gasto: ['Editar gasto', 'Guardar gasto'],
  ingreso: ['Editar ingreso', 'Guardar ingreso'],
  transferencia: ['Editar transferencia', 'Guardar transferencia'],
  gastoTarjeta: ['Editar gasto con tarjeta', 'Guardar gasto de tarjeta'],
};

const CAMPOS = [
  'tipo',
  'valor',
  'descripcion',
  'categoriaId',
  'cuentaId',
  'cuentaDestinoId',
  'fecha',
  'pagado',
  'observacion',
  'tarjetaId',
  'cuotas',
  'factura',
  'ajuste',
];
const desde = (m) => ({
  ...Object.fromEntries(CAMPOS.map((c) => [c, m[c] ?? null])),
  descripcion: m.descripcion ?? '',
  observacion: m.observacion ?? '',
  etiquetaIds: m.etiquetaIds ?? [],
  hora: horaDe(m),
});

export default function EditarMovimiento({ movimiento: m, abierto, alCerrar }) {
  const {
    cuentas,
    categorias,
    etiquetas,
    tarjetas,
    cuenta: buscarCuenta,
    categoria: buscarCategoria,
    etiqueta: buscarEtiqueta,
    tarjeta: buscarTarjeta,
  } = useDatos();
  const [datos, setDatos] = useState(() => desde(m));
  // 'categoria' | 'cuentaId' | 'cuentaDestinoId' | 'tarjetaId' | 'cuotas' | 'factura' | 'etiquetas' | 'observacion'
  const [panel, setPanel] = useState(null);
  const [aviso, setAviso] = useState(null);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const { tipo } = datos;
  const transferencia = tipo === 'transferencia';
  const conTarjeta = tipo === 'gastoTarjeta';
  const tipoCategoria = tipo === 'ingreso' ? 'ingreso' : 'gasto';
  const [titulo, textoGuardar] = TITULOS[tipo] ?? TITULOS.gasto;

  // Cada vez que se abre, parte del movimiento como está guardado.
  useEffect(() => {
    if (!abierto) return;
    setDatos(desde(m));
    setAviso(null);
    // Solo al abrir.
  }, [abierto]);

  const cambiarFecha = (fecha) =>
    cambiar({ fecha, hora: fecha === m.fecha ? horaDe(m) : fecha === hoyTexto() ? 'ahora' : null });

  // Origen y destino nunca son la misma: si se elige como origen la de destino, se intercambian.
  const elegirCuenta = (campo, id) =>
    setDatos((d) => {
      const otro = campo === 'cuentaId' ? 'cuentaDestinoId' : 'cuentaId';
      if (transferencia && d[otro] === id) return { ...d, [campo]: id, [otro]: d[campo] };
      return { ...d, [campo]: id };
    });

  const alternarEtiqueta = (id) =>
    setDatos((d) => ({
      ...d,
      etiquetaIds: d.etiquetaIds.includes(id) ? d.etiquetaIds.filter((e) => e !== id) : [...d.etiquetaIds, id],
    }));

  const guardar = () => {
    const falta = faltante(datos);
    if (falta) {
      setAviso(falta.texto);
      if (falta.campo !== 'valor') setPanel(falta.campo === 'categoriaId' ? 'categoria' : falta.campo);
      return false;
    }
    setAviso(null);
    return guardarMovimiento(m.id, datos);
  };

  const vacio = (texto) => <span className="campo-vacio">{texto}</span>;
  const nombreCuenta = (id) => buscarCuenta(id)?.nombre ?? vacio('Elegir');
  const categoria = buscarCategoria(datos.categoriaId);
  const nombresEtiquetas = datos.etiquetaIds.map((id) => buscarEtiqueta(id)?.nombre).filter(Boolean);
  const listo = { texto: 'Listo', alTocar: () => setPanel(null) };

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
  const filaEtiquetas = (
    <Campo Icono={IconoEtiqueta} etiqueta="Etiquetas" alTocar={() => setPanel('etiquetas')}>
      {nombresEtiquetas.length > 0 ? <span className="campo-recortado">{nombresEtiquetas.join(', ')}</span> : vacio('Agregar')}
    </Campo>
  );

  return (
    <>
      <VentanaFlotante
        abierto={abierto}
        alCerrar={alCerrar}
        titulo={titulo}
        tono={conTarjeta ? 'gasto' : tipo}
        arriba={<MontoEditable etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />}
      >
        <div className="tarjeta campos">
          <Campo Icono={IconoTexto} etiqueta="Descripción">
            <EntradaTexto
              valor={datos.descripcion}
              alCambiar={(descripcion) => cambiar({ descripcion })}
              ejemplo={transferencia ? 'Opcional' : 'Ej. Gasolina'}
            />
          </Campo>
          {transferencia ? (
            <>
              <Campo Icono={IconoDesde} etiqueta="Desde" alTocar={() => setPanel('cuentaId')}>
                {nombreCuenta(datos.cuentaId)}
              </Campo>
              <Campo Icono={IconoHacia} etiqueta="Hacia" alTocar={() => setPanel('cuentaDestinoId')}>
                {nombreCuenta(datos.cuentaDestinoId)}
              </Campo>
            </>
          ) : conTarjeta ? (
            <>
              {filaCategoria}
              <Campo Icono={IconoTarjeta} etiqueta="Tarjeta" alTocar={() => setPanel('tarjetaId')}>
                {buscarTarjeta(datos.tarjetaId)?.nombre ?? vacio('Elegir')}
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
          {datos.hora && (
            <Campo Icono={IconoHora} etiqueta="Hora">
              <EntradaHora
                valor={datos.hora === 'ahora' ? horaActual() : datos.hora}
                texto={datos.hora === 'ahora' ? 'Ahora' : textoHora(datos.hora)}
                alCambiar={(hora) => cambiar({ hora })}
              />
            </Campo>
          )}
          {!transferencia && filaEtiquetas}
          {!transferencia && !conTarjeta && (
            <Campo Icono={IconoPagado} etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}>
              <Interruptor
                activo={Boolean(datos.pagado)}
                etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}
                alCambiar={(pagado) => cambiar({ pagado })}
              />
            </Campo>
          )}
          <Campo Icono={IconoNota} etiqueta="Observación" alTocar={() => setPanel('observacion')}>
            {datos.observacion ? <span className="campo-recortado">{datos.observacion}</span> : vacio('Agregar nota')}
          </Campo>
        </div>
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <BotonExito
          className={'boton-principal guardar-' + (conTarjeta ? 'gasto' : tipo)}
          alTocar={guardar}
          alTerminar={alCerrar}
        >
          {textoGuardar}
        </BotonExito>
      </VentanaFlotante>

      {/* Paneles de elección: encima de la ventana (se montan después, así quedan arriba). */}
      <PanelInferior abierto={panel === 'categoria'} alCerrar={() => setPanel(null)} titulo="Categoría" accion={listo}>
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
          </div>
        </div>
      </PanelInferior>

      {['cuentaId', 'cuentaDestinoId'].map((campo) => (
        <PanelInferior
          key={campo}
          abierto={panel === campo}
          alCerrar={() => setPanel(null)}
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
          </div>
        </PanelInferior>
      ))}

      {conTarjeta && (
        <>
          <PanelInferior abierto={panel === 'tarjetaId'} alCerrar={() => setPanel(null)} titulo="Tarjeta" accion={listo}>
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
                    onClick={() => cambiar({ tarjetaId: t.id })}
                  >
                    <span className="icono-circulo grande" style={estiloIconoCuenta(t.color)}>
                      <IconoPorNombre nombre={t.icono} tamano={20} />
                    </span>
                    <span className="panel-opcion-textos">
                      <span className="panel-opcion-titulo">{t.nombre}</span>
                    </span>
                    <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
                  </button>
                );
              })}
            </div>
          </PanelInferior>

          <PanelInferior abierto={panel === 'cuotas'} alCerrar={() => setPanel(null)} titulo="Cuotas" accion={listo}>
            <div className="rejilla-dias" role="radiogroup" aria-label="Cuotas">
              {CUOTAS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={datos.cuotas === n} onClick={() => cambiar({ cuotas: n })}>
                  {n}
                </button>
              ))}
            </div>
          </PanelInferior>

          <PanelInferior
            abierto={panel === 'factura'}
            alCerrar={() => setPanel(null)}
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
                    onClick={() => cambiar({ factura: mes })}
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
        </>
      )}

      {!transferencia && (
        <PanelInferior abierto={panel === 'etiquetas'} alCerrar={() => setPanel(null)} titulo="Etiquetas" accion={listo}>
          <PanelEtiquetas etiquetas={etiquetas} elegidas={datos.etiquetaIds} alAlternar={alternarEtiqueta} />
        </PanelInferior>
      )}

      <PanelInferior abierto={panel === 'observacion'} alCerrar={() => setPanel(null)} titulo="Observación" accion={listo}>
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
