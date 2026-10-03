// Nuevo gasto, ingreso o transferencia (/nuevo/gasto, /nuevo/ingreso, /nuevo/transferencia;
// ?cuenta=id elige la cuenta) y editar un movimiento (/movimientos/:id/editar).
// design/capturas/NuevoGasto.png, NuevoIngreso.png, NuevaTransferencia.png, SelectorCategoria.png
// y SelectorCuenta.png. "Repetir" queda para el paso 7 (Programados).
import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import {
  CabeceraFormulario,
  Campo,
  EntradaFecha,
  EntradaTexto,
  Interruptor,
  MontoEditable,
  PieFormulario,
  Segmentado,
} from '../componentes/Formulario.jsx';
import {
  IconoCalendario,
  IconoCategorias,
  IconoCheck,
  IconoCheckCirculo,
  IconoCuentas,
  IconoEtiqueta,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoMas,
  IconoNota,
  IconoTexto,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { guardarEtiqueta } from '../datos/etiquetas.js';
import { faltante, guardarMovimiento, TIPOS_MOVIMIENTO } from '../datos/movimientos.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { hoyTexto } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import './FormularioMovimiento.css';

const TITULOS = {
  gasto: ['Nuevo gasto', 'Editar gasto', 'Guardar gasto'],
  ingreso: ['Nuevo ingreso', 'Editar ingreso', 'Guardar ingreso'],
  transferencia: ['Nueva transferencia', 'Editar transferencia', 'Guardar transferencia'],
};

// Íconos de las filas con su tamaño de fila (18 px).
const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoPagado = (p) => <IconoCheckCirculo tamano={18} grosor={2} {...p} />;

const EJEMPLOS = { gasto: 'Ej. Gasolina', ingreso: 'Ej. Pago de cliente', transferencia: 'Opcional' };

// La última cuenta usada queda elegida en el siguiente movimiento.
const CLAVE_ULTIMA_CUENTA = 'sendo.ultimaCuenta';
function leerUltimaCuenta() {
  try {
    return localStorage.getItem(CLAVE_ULTIMA_CUENTA);
  } catch {
    return null;
  }
}
function recordarCuenta(id) {
  try {
    localStorage.setItem(CLAVE_ULTIMA_CUENTA, id);
  } catch {
    // Sin almacenamiento (navegación privada): solo no se recuerda.
  }
}

// Lo escrito en un formulario sin guardar, por entrada del historial. Si se sale a crear una
// categoría, una cuenta o una etiqueta y se vuelve, el formulario sigue como estaba.
const borradores = new Map();

export default function FormularioMovimiento() {
  const { pantalla, id } = useParams();
  const [parametros] = useSearchParams();
  const { key: clave } = useLocation();
  const { movimientos, cargando } = useDatos();

  if (id) {
    const movimiento = movimientos.find((m) => m.id === id);
    if (cargando) return <CabeceraFormulario titulo="Editar movimiento" volverA="/transacciones" />;
    if (!movimiento) return <Navigate to="/transacciones" replace />;
    return <Campos key={clave} clave={clave} movimiento={movimiento} />;
  }
  const tipo = TIPOS_MOVIMIENTO.some((t) => t.valor === pantalla) ? pantalla : 'gasto';
  if (cargando) return <CabeceraFormulario titulo={TITULOS[tipo][0]} volverA="/" />;
  return <Campos key={clave} clave={clave} tipoInicial={tipo} cuentaPedida={parametros.get('cuenta')} />;
}

function datosIniciales({ movimiento, tipoInicial, cuentaPedida, cuentas }) {
  if (movimiento) {
    const { tipo, valor, descripcion, categoriaId, cuentaId, cuentaDestinoId, fecha, pagado, etiquetaIds, observacion } =
      movimiento;
    return { tipo, valor, descripcion, categoriaId, cuentaId, cuentaDestinoId, fecha, pagado, etiquetaIds, observacion };
  }
  const existe = (cuentaId) => cuentas.some((c) => c.id === cuentaId);
  const cuentaId = [cuentaPedida, leerUltimaCuenta(), cuentas[0]?.id].find(existe) ?? null;
  return {
    tipo: tipoInicial,
    valor: 0,
    descripcion: '',
    categoriaId: null,
    cuentaId,
    cuentaDestinoId: cuentas.find((c) => c.id !== cuentaId)?.id ?? null,
    fecha: hoyTexto(),
    pagado: true,
    etiquetaIds: [],
    observacion: '',
  };
}

function Campos({ clave, movimiento, tipoInicial, cuentaPedida }) {
  const navegar = useNavigate();
  const { cuentas, categorias, etiquetas, cuenta: buscarCuenta, categoria: buscarCategoria, etiqueta: buscarEtiqueta } =
    useDatos();
  const borrador = borradores.get(clave);
  const [datos, setDatos] = useState(() => borrador?.datos ?? datosIniciales({ movimiento, tipoInicial, cuentaPedida, cuentas }));
  // Mientras no se toque "Pagado" a mano, una fecha futura lo apaga y una de hoy o antes lo prende.
  const [pagadoAMano, setPagadoAMano] = useState(borrador?.pagadoAMano ?? Boolean(movimiento));
  const [panel, setPanel] = useState(null); // 'categoria' | 'cuentaId' | 'cuentaDestinoId' | 'etiquetas' | 'observacion'
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const monto = useRef(null);

  useEffect(() => {
    borradores.set(clave, { datos, pagadoAMano });
  }, [clave, datos, pagadoAMano]);

  // El aviso ("Elige una categoría.") se va solo.
  useEffect(() => {
    if (!aviso) return undefined;
    const espera = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(espera);
  }, [aviso]);

  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const { tipo } = datos;
  const transferencia = tipo === 'transferencia';
  const [tituloNuevo, tituloEditar, textoGuardar] = TITULOS[tipo];
  const volverA = movimiento ? `/movimientos/${movimiento.id}` : '/';

  const cambiarTipo = (nuevo) =>
    setDatos((d) => {
      const categoria = buscarCategoria(d.categoriaId);
      return {
        ...d,
        tipo: nuevo,
        categoriaId: categoria?.tipo === nuevo ? d.categoriaId : null,
        cuentaDestinoId: d.cuentaDestinoId ?? cuentas.find((c) => c.id !== d.cuentaId)?.id ?? null,
      };
    });

  const cambiarFecha = (fecha) => cambiar(pagadoAMano ? { fecha } : { fecha, pagado: fecha <= hoyTexto() });

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

  // Cierra el panel y, cuando terminó de bajar, va a crear lo que falta (la vuelta es al formulario).
  const irACrear = (ruta) => {
    setPanel(null);
    setTimeout(() => navegar(ruta), DURACION_PANEL_MS + 30);
  };

  const guardar = async () => {
    const falta = faltante(datos);
    if (falta) {
      setAviso(falta.texto);
      if (falta.campo === 'valor') monto.current?.focus();
      else setPanel(falta.campo === 'categoriaId' ? 'categoria' : falta.campo);
      return;
    }
    setGuardando(true);
    try {
      await guardarMovimiento(movimiento?.id, datos);
      recordarCuenta(datos.cuentaId);
      borradores.delete(clave);
      volver(navegar, volverA);
    } finally {
      setGuardando(false);
    }
  };

  const categoria = buscarCategoria(datos.categoriaId);
  const nombreCuenta = (id) => buscarCuenta(id)?.nombre;
  const nombresEtiquetas = datos.etiquetaIds.map((id) => buscarEtiqueta(id)?.nombre).filter(Boolean);
  const vacio = (texto) => <span className="campo-vacio">{texto}</span>;

  const filaDescripcion = (
    <Campo Icono={IconoTexto} etiqueta="Descripción">
      <EntradaTexto valor={datos.descripcion} alCambiar={(descripcion) => cambiar({ descripcion })} ejemplo={EJEMPLOS[tipo]} />
    </Campo>
  );
  const filaFecha = (
    <Campo Icono={IconoFecha} etiqueta="Fecha" conFlecha>
      <EntradaFecha valor={datos.fecha} alCambiar={cambiarFecha} />
    </Campo>
  );
  const filaObservacion = (
    <Campo Icono={IconoNota} etiqueta="Observación" alTocar={() => setPanel('observacion')}>
      {datos.observacion ? <span className="campo-recortado">{datos.observacion}</span> : vacio('Agregar nota')}
    </Campo>
  );

  return (
    <div>
      <CabeceraFormulario titulo={movimiento ? tituloEditar : tituloNuevo} volverA={volverA}>
        <MontoEditable ref={monto} etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />
        {/* Al editar no se cambia el tipo: la categoría y las cuentas dependen de él. */}
        <Segmentado
          opciones={TIPOS_MOVIMIENTO}
          valor={tipo}
          etiqueta="Tipo de movimiento"
          bloqueado={Boolean(movimiento)}
          alCambiar={cambiarTipo}
        />
      </CabeceraFormulario>

      <div className="formulario-contenido">
        {cuentas.length === 0 ? (
          <div className="tarjeta movimiento-sin-cuentas">
            <p>Para registrar movimientos primero crea una cuenta: banco, billetera o efectivo.</p>
            <button type="button" className="boton-principal" onClick={() => navegar('/cuentas/nueva')}>
              Crear cuenta
            </button>
          </div>
        ) : transferencia ? (
          <div className="tarjeta campos">
            <Campo
              Icono={IconoDesde}
              etiqueta="Desde"
              alTocar={() => setPanel('cuentaId')}
            >
              {nombreCuenta(datos.cuentaId) ?? vacio('Elegir')}
            </Campo>
            <Campo
              Icono={IconoHacia}
              etiqueta="Hacia"
              alTocar={() => setPanel('cuentaDestinoId')}
            >
              {nombreCuenta(datos.cuentaDestinoId) ?? vacio('Elegir')}
            </Campo>
            {filaFecha}
            {filaDescripcion}
            {filaObservacion}
          </div>
        ) : (
          <div className="tarjeta campos">
            {filaDescripcion}
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
            <Campo Icono={IconoCuentas} etiqueta="Cuenta" alTocar={() => setPanel('cuentaId')}>
              {nombreCuenta(datos.cuentaId) ?? vacio('Elegir')}
            </Campo>
            {filaFecha}
            <Campo Icono={IconoEtiqueta} etiqueta="Etiquetas" alTocar={() => setPanel('etiquetas')}>
              {nombresEtiquetas.length > 0 ? <span className="campo-recortado">{nombresEtiquetas.join(', ')}</span> : vacio('Agregar')}
            </Campo>
            <Campo
              Icono={IconoPagado}
              etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}
            >
              <Interruptor
                activo={datos.pagado}
                etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}
                alCambiar={(pagado) => {
                  setPagadoAMano(true);
                  cambiar({ pagado });
                }}
              />
            </Campo>
            {filaObservacion}
          </div>
        )}
      </div>

      <PieFormulario>
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <button
          type="button"
          className={'boton-principal guardar-' + tipo}
          disabled={guardando || cuentas.length === 0}
          onClick={guardar}
        >
          {textoGuardar}
        </button>
      </PieFormulario>

      {/* Paneles de elección: no se cierran al elegir (Listo o tocar fuera). */}
      <PanelInferior
        abierto={panel === 'categoria'}
        alCerrar={() => setPanel(null)}
        titulo="Categoría"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <div className="panel-desplazable">
          <div className="rejilla-categorias" role="radiogroup" aria-label="Categoría">
            {categorias
              .filter((c) => c.tipo === tipo)
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
            <button
              type="button"
              className="rejilla-categorias-opcion nueva"
              onClick={() => irACrear(`/categorias/nueva?tipo=${tipo}`)}
            >
              <span className="rejilla-categorias-nueva">
                <IconoMas />
              </span>
              <span>Nueva</span>
            </button>
          </div>
        </div>
      </PanelInferior>

      {['cuentaId', 'cuentaDestinoId'].map((campo) => (
        <PanelInferior
          key={campo}
          abierto={panel === campo}
          alCerrar={() => setPanel(null)}
          titulo={!transferencia ? 'Cuenta' : campo === 'cuentaId' ? 'Desde' : 'Hacia'}
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
            <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => irACrear('/cuentas/nueva')}>
              <span className="icono-circulo grande">
                <IconoMas />
              </span>
              <span className="panel-opcion-titulo">Nueva cuenta</span>
            </button>
          </div>
        </PanelInferior>
      ))}

      <PanelInferior
        abierto={panel === 'etiquetas'}
        alCerrar={() => setPanel(null)}
        titulo="Etiquetas"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
        <PanelEtiquetas etiquetas={etiquetas} elegidas={datos.etiquetaIds} alAlternar={alternarEtiqueta} />
      </PanelInferior>

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
    </div>
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
      {error && <p className="etiqueta-error">{error}</p>}
    </div>
  );
}
