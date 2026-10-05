// Nuevo gasto, ingreso, transferencia o gasto con tarjeta (/nuevo/gasto, /nuevo/ingreso,
// /nuevo/transferencia, /nuevo/gasto-tarjeta; ?cuenta=id elige la cuenta) y editar un movimiento
// (/movimientos/:id/editar). design/capturas/NuevoGasto.png, NuevoIngreso.png,
// NuevaTransferencia.png, GastoTarjeta.png, SelectorCategoria.png y SelectorCuenta.png.
// Desde la Sesión 9 (pedido del dueño) los programados se crean aquí: el interruptor "Gasto
// recurrente" (o ingreso, o transferencia) muestra Frecuencia y Termina, y al guardar se crea el
// movimiento y el programado que lo repite (guardarRecurrente en programados.js).
import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BotonExito from '../componentes/BotonExito.jsx';
import CirculoCategoria from '../componentes/CirculoCategoria.jsx';
import {
  CabeceraFormulario,
  Campo,
  EntradaFecha,
  EntradaHora,
  EntradaTexto,
  Interruptor,
  MontoEditable,
  PieFormulario,
  Segmentado,
} from '../componentes/Formulario.jsx';
import {
  IconoBasura,
  IconoCalendario,
  IconoCapas,
  IconoCategorias,
  IconoCheck,
  IconoCheckCirculo,
  IconoCorazon,
  IconoCuentas,
  IconoEtiqueta,
  IconoGastoDiagonal,
  IconoIngresoDiagonal,
  IconoMas,
  IconoNota,
  IconoRecibo,
  IconoReloj,
  IconoRepetir,
  IconoTarjeta,
  IconoTexto,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelInferior, { DURACION_PANEL_MS } from '../componentes/PanelInferior.jsx';
import ToqueHaptico from '../componentes/ToqueHaptico.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { guardarEtiqueta } from '../datos/etiquetas.js';
import { favoritoDe, guardarFavorito, sugerirFavoritos, usarFavorito } from '../datos/favoritos.js';
import { faltante, guardarMovimiento, horaDe, TIPOS_MOVIMIENTO } from '../datos/movimientos.js';
import {
  eliminarFecha,
  eliminarProgramado,
  FRECUENCIAS,
  guardarProgramado,
  guardarRecurrente,
  textoFrecuencia,
} from '../datos/programados.js';
import { cuotasDe, facturaDeFecha, nombreFactura, sumarMeses } from '../datos/tarjetas.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { diaYMes, fechaCorta, horaActual, hoyTexto, textoHora } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { volver } from '../utilidades/navegacion.js';
import { pasarTeclado } from '../utilidades/teclado.js';
import './FormularioMovimiento.css';
import { abrirVentana } from '../estado/ventanas.js';

const TITULOS = {
  gasto: ['Nuevo gasto', 'Editar gasto', 'Guardar gasto'],
  ingreso: ['Nuevo ingreso', 'Editar ingreso', 'Guardar ingreso'],
  transferencia: ['Nueva transferencia', 'Editar transferencia', 'Guardar transferencia'],
  gastoTarjeta: ['Gasto con tarjeta', 'Editar gasto con tarjeta', 'Guardar gasto de tarjeta'],
};

const TITULOS_PROGRAMADO = ['Nuevo programado', 'Editar programado', 'Guardar programado'];

// Interruptor para repetir el movimiento (Sesión 9).
const TEXTO_RECURRENTE = {
  gasto: 'Gasto recurrente',
  ingreso: 'Ingreso recurrente',
  transferencia: 'Transferencia recurrente',
  // Gasto con tarjeta (suscripciones; pedido del dueño, Sesión 9): cada repetición va a la factura que
  // le toca por su fecha.
  gastoTarjeta: 'Gasto recurrente',
};

// Formas de eliminar un programado (eliminarProgramado en programados.js).
const ELIMINAR_PROGRAMADO = [
  { valor: 'solo', titulo: 'Solo el programado', detalle: 'Deja de repetirse. Lo ya registrado se queda en Transacciones.' },
  { valor: 'realizados', titulo: 'El programado y sus realizados', detalle: 'También borra los movimientos que ya se pagaron.' },
  { valor: 'todo', titulo: 'Todo', detalle: 'El programado y todos sus movimientos, pagados y pendientes.' },
];

// Ruta (/nuevo/…) → tipo.
const TIPO_POR_RUTA = { gasto: 'gasto', ingreso: 'ingreso', transferencia: 'transferencia', 'gasto-tarjeta': 'gastoTarjeta' };

// Hasta cuántas cuotas se puede diferir una compra.
export const CUOTAS = Array.from({ length: 36 }, (_, i) => i + 1);

// Íconos de las filas con su tamaño de fila (18 px).
const IconoFecha = (p) => <IconoCalendario tamano={18} {...p} />;
const IconoDesde = (p) => <IconoGastoDiagonal tamano={18} grosor={2} {...p} />;
const IconoHacia = (p) => <IconoIngresoDiagonal tamano={18} grosor={2} {...p} />;
const IconoPagado = (p) => <IconoCheckCirculo tamano={18} grosor={2} {...p} />;

const IconoCuotas = (p) => <IconoCapas tamano={18} {...p} />;
const IconoRepetirFila = (p) => <IconoRepetir tamano={18} grosor={2} {...p} />;
const IconoTermina = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;
const IconoHora = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;
const IconoFactura = (p) => <IconoRecibo tamano={18} {...p} />;

const EJEMPLOS = {
  gasto: 'Ej. Gasolina',
  ingreso: 'Ej. Pago de cliente',
  transferencia: 'Opcional',
  gastoTarjeta: 'Ej. Llantas',
};

// La última cuenta y la última tarjeta usadas quedan elegidas en el siguiente movimiento.
const CLAVE_ULTIMA_CUENTA = 'sendo.ultimaCuenta';
const CLAVE_ULTIMA_TARJETA = 'sendo.ultimaTarjeta';
function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}
function recordar(clave, id) {
  try {
    localStorage.setItem(clave, id);
  } catch {
    // Sin almacenamiento (navegación privada): solo no se recuerda.
  }
}

// "3 de $ 100.000" (la primera cuota lleva lo que no da exacto) o "Sin cuotas".
export function textoCuotas(cuotas, valor) {
  if (!(cuotas > 1)) return 'Sin cuotas';
  if (!(valor > 0)) return `${cuotas} cuotas`;
  return `${cuotas} de ${formatearPesos(cuotasDe({ valor, cuotas, factura: '2000-01' }).at(-1).valor)}`;
}

// Facturas que se pueden elegir: la anterior a la que toca por la fecha y las tres siguientes.
export function opcionesFactura(tarjeta, fecha) {
  if (!tarjeta) return [];
  const propia = facturaDeFecha(tarjeta, fecha);
  return [-1, 0, 1, 2, 3].map((n) => sumarMeses(propia, n));
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
  const tipo = TIPO_POR_RUTA[pantalla] ?? 'gasto';
  if (cargando) return <CabeceraFormulario titulo={TITULOS[tipo][0]} volverA="/" />;
  // ?fecha=AAAA-MM-DD: desde el "+" de un día del calendario de Programados, con ese día ya puesto y
  // sin el selector Ingreso | Gasto | Transferencia (se eligió en la ventana de ese "+").
  const fechaPedida = /^\d{4}-\d{2}-\d{2}$/.test(parametros.get('fecha') ?? '') ? parametros.get('fecha') : null;
  return (
    <Campos
      key={clave}
      clave={clave}
      tipoInicial={tipo}
      cuentaPedida={parametros.get('cuenta')}
      fechaPedida={fechaPedida}
    />
  );
}

// Campos que el formulario copia de un movimiento al editarlo.
const CAMPOS = [
  'tipo',
  'valor',
  'descripcion',
  'categoriaId',
  'cuentaId',
  'cuentaDestinoId',
  'fecha',
  'hora', // null, 'HH:MM' o, solo en el formulario, 'ahora' (la hora en que se guarde)
  'pagado',
  'etiquetaIds',
  'observacion',
  'tarjetaId',
  'cuotas',
  'factura',
  'ajuste', // faltante o sobrante de Reajustar saldo: se puede guardar sin categoría
];

function datosIniciales({ movimiento, programado, tipoInicial, cuentaPedida, fechaPedida, cuentas, tarjetas }) {
  if (movimiento) return { ...Object.fromEntries(CAMPOS.map((campo) => [campo, movimiento[campo] ?? null])), hora: horaDe(movimiento) };
  // Un programado guarda la plantilla del movimiento; su "fecha" en el formulario es Empieza.
  if (programado) {
    return {
      ...Object.fromEntries(CAMPOS.map((campo) => [campo, programado[campo] ?? null])),
      etiquetaIds: programado.etiquetaIds ?? [],
      observacion: programado.observacion ?? '',
      fecha: programado.empieza,
      hora: null,
      frecuencia: programado.frecuencia,
      termina: programado.termina,
    };
  }
  const existe = (lista) => (id) => lista.some((x) => x.id === id);
  const cuentaId = [cuentaPedida, leer(CLAVE_ULTIMA_CUENTA), cuentas[0]?.id].find(existe(cuentas)) ?? null;
  const tarjetaId = [leer(CLAVE_ULTIMA_TARJETA), tarjetas[0]?.id].find(existe(tarjetas)) ?? null;
  const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
  const fecha = fechaPedida ?? hoyTexto();
  return {
    tipo: tipoInicial,
    valor: 0,
    descripcion: '',
    categoriaId: null,
    cuentaId,
    cuentaDestinoId: cuentas.find((c) => c.id !== cuentaId)?.id ?? null,
    fecha,
    hora: fecha === hoyTexto() ? 'ahora' : null,
    pagado: fecha <= hoyTexto(),
    etiquetaIds: [],
    observacion: '',
    tarjetaId,
    cuotas: 1,
    factura: tarjeta ? facturaDeFecha(tarjeta, fecha) : null,
    frecuencia: 'mes',
    termina: null,
    recurrente: false,
  };
}

// esProgramado: es el formulario de un programado (FormularioProgramado, más abajo): sin Pagado
// y con Frecuencia, Empieza y Termina. programado: el que se edita.
// ocurrencia: en un programado abierto desde una fecha del calendario que aún no es movimiento, esa
// fecha ('AAAA-MM-DD'): al eliminar se ofrece quitar solo esa.
function Campos({ clave, movimiento, programado, esProgramado = false, tipoInicial, cuentaPedida, fechaPedida, ocurrencia }) {
  const navegar = useNavigate();
  const {
    cuentas,
    categorias,
    etiquetas,
    tarjetas,
    cuenta: buscarCuenta,
    categoria: buscarCategoria,
    etiqueta: buscarEtiqueta,
    tarjeta: buscarTarjeta,
    favoritos,
  } = useDatos();
  const borrador = borradores.get(clave);
  const [datos, setDatos] = useState(
    () =>
      borrador?.datos ??
      datosIniciales({ movimiento, programado, tipoInicial, cuentaPedida, fechaPedida, cuentas, tarjetas }),
  );
  // Mientras no se toque "Pagado" a mano, una fecha futura lo apaga y una de hoy o antes lo prende.
  const [pagadoAMano, setPagadoAMano] = useState(borrador?.pagadoAMano ?? Boolean(movimiento));
  // Igual con la factura de un gasto con tarjeta: sigue a la fecha y a la tarjeta (día de cierre).
  const [facturaAMano, setFacturaAMano] = useState(borrador?.facturaAMano ?? Boolean(movimiento));
  // Corazón de favorito: null = sin tocar (se ve marcado si la descripción ya es un favorito y al
  // guardar no cambia nada); true o false = tocado a mano (al guardar crea, actualiza o quita).
  const [corazonAMano, setCorazonAMano] = useState(borrador?.corazonAMano ?? null);
  // Sube cada vez que se marca: vuelve a dibujar el corazón para repetir su latido.
  const [latidos, setLatidos] = useState(0);
  // Escribiendo en la descripción: solo entonces sale el desplegable de favoritos.
  const [escribiendo, setEscribiendo] = useState(false);
  const salida = useRef(null);
  // 'categoria' | 'cuentaId' | 'cuentaDestinoId' | 'tarjetaId' | 'cuotas' | 'factura' | 'etiquetas' | 'observacion'
  const [panel, setPanel] = useState(null);
  // Forma de eliminar un programado (ELIMINAR_PROGRAMADO).
  const [modoEliminar, setModoEliminar] = useState(ocurrencia ? 'fecha' : 'solo');
  const [aviso, setAviso] = useState(null);
  const monto = useRef(null);

  // Un movimiento nuevo abre con el cursor en el valor y el teclado arriba (pedido del dueño,
  // 2026-10-04; el menú del "+" prepara el teclado, ver teclado.js). Cuando la pantalla termina de
  // entrar: con el foco puesto a mitad del deslizamiento, el cursor daba saltos. No al editar, en
  // programados ni al volver con algo ya escrito (borrador).
  useEffect(() => {
    const conTeclado = !movimiento && !esProgramado && !borrador?.datos.valor;
    return pasarTeclado(() => (conTeclado ? monto.current : null));
    // Solo al entrar.
  }, []);

  useEffect(() => {
    borradores.set(clave, { datos, pagadoAMano, facturaAMano, corazonAMano });
  }, [clave, datos, pagadoAMano, facturaAMano, corazonAMano]);

  // El aviso ("Elige una categoría.") se va solo.
  useEffect(() => {
    if (!aviso) return undefined;
    const espera = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(espera);
  }, [aviso]);

  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const { tipo } = datos;
  const transferencia = tipo === 'transferencia';
  const conTarjeta = tipo === 'gastoTarjeta';
  // Las categorías son de gasto o de ingreso; el gasto con tarjeta usa las de gasto.
  const tipoCategoria = tipo === 'ingreso' ? 'ingreso' : 'gasto';
  const [tituloNuevo, tituloEditar, textoGuardar] = esProgramado ? TITULOS_PROGRAMADO : TITULOS[tipo];
  const editando = Boolean(movimiento || programado);
  // "Gasto recurrente": solo al crear (gasto, ingreso, transferencia o gasto con tarjeta).
  const puedeRepetir = !editando && !esProgramado;
  const recurrente = puedeRepetir && Boolean(datos.recurrente);
  let volverA = '/';
  if (movimiento) volverA = `/movimientos/${movimiento.id}`;
  else if (esProgramado) volverA = '/planes';

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

  // La factura que corresponde a una fecha y una tarjeta, si no se eligió a mano.
  const facturaSegun = (tarjetaId, fecha, actual) => {
    const tarjeta = buscarTarjeta(tarjetaId);
    return facturaAMano || !tarjeta ? actual : facturaDeFecha(tarjeta, fecha);
  };

  // La hora solo va en lo que se registra en el momento (pedido del dueño, Sesión 9): con fecha de
  // hoy, "Ahora" (la hora en que se guarda) o la que se eligió; con otra fecha, sin hora y sin la
  // fila. Al editar, en su fecha de siempre el movimiento conserva la suya.
  const horaSegun = (fecha, actual) => {
    if (movimiento && fecha === movimiento.fecha) return horaDe(movimiento);
    if (fecha === hoyTexto()) return actual ?? 'ahora';
    return null;
  };

  const cambiarFecha = (fecha) =>
    setDatos((d) => ({
      ...d,
      fecha,
      hora: horaSegun(fecha, d.hora),
      pagado: pagadoAMano ? d.pagado : fecha <= hoyTexto(),
      factura: facturaSegun(d.tarjetaId, fecha, d.factura),
    }));

  // Favoritos (favoritos.js): el corazón junto a la descripción y, debajo, los que coinciden con lo
  // escrito. No van en los programados.
  const corazon = corazonAMano ?? Boolean(favoritoDe(favoritos, tipo, datos.descripcion));
  const sugerencias = esProgramado || !escribiendo ? [] : sugerirFavoritos(favoritos, tipo, datos.descripcion, 10);
  // Al salir de la descripción el desplegable se va un momento después: si se tocó una opción,
  // su toque llega antes.
  const alSalirDescripcion = () => {
    salida.current = setTimeout(() => setEscribiendo(false), 200);
  };
  const alEnfocarDescripcion = () => {
    clearTimeout(salida.current);
    setEscribiendo(true);
  };
  useEffect(() => () => clearTimeout(salida.current), []);
  const alternarCorazon = (evento) => {
    evento.preventDefault(); // dentro de la fila (un <label>): que no enfoque la descripción
    if (!corazon && !datos.descripcion.trim()) {
      setAviso('Escribe una descripción para guardarlo como favorito.');
      return;
    }
    if (!corazon) setLatidos((n) => n + 1);
    setCorazonAMano(!corazon);
  };
  // Llena el formulario con lo guardado en el favorito, menos el valor, la fecha y la hora. Lo que
  // ya no existe (una cuenta o categoría borrada) se queda como estaba.
  const elegirFavorito = (favorito) => {
    usarFavorito(favorito.id);
    clearTimeout(salida.current);
    setEscribiendo(false);
    document.activeElement?.blur(); // baja el teclado para ver el formulario lleno
    setDatos((d) => {
      const categoria = buscarCategoria(favorito.categoriaId);
      const cuentaId = buscarCuenta(favorito.cuentaId) ? favorito.cuentaId : d.cuentaId;
      const destino = buscarCuenta(favorito.cuentaDestinoId) ? favorito.cuentaDestinoId : d.cuentaDestinoId;
      const tarjetaId = buscarTarjeta(favorito.tarjetaId) ? favorito.tarjetaId : d.tarjetaId;
      return {
        ...d,
        descripcion: favorito.descripcion,
        categoriaId: categoria?.tipo === tipoCategoria ? favorito.categoriaId : d.categoriaId,
        cuentaId,
        cuentaDestinoId: destino === cuentaId ? d.cuentaDestinoId : destino,
        tarjetaId,
        factura: facturaSegun(tarjetaId, d.fecha, d.factura),
        cuotas: favorito.cuotas ?? d.cuotas,
        etiquetaIds: (favorito.etiquetaIds ?? []).filter((id) => buscarEtiqueta(id)),
        observacion: favorito.observacion ?? '',
      };
    });
  };

  const elegirTarjeta = (tarjetaId) =>
    setDatos((d) => ({ ...d, tarjetaId, factura: facturaSegun(tarjetaId, d.fecha, d.factura) }));

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
  // Nueva cuenta o tarjeta: ventana flotante encima del formulario (Sesión 9); lo escrito se queda.
  const abrirEncima = (tipoVentana) => {
    setPanel(null);
    setTimeout(() => abrirVentana(tipoVentana), DURACION_PANEL_MS + 30);
  };

  // Si falta algo, avisa y devuelve false (el botón no anima). Si no, guarda; al terminar la
  // animación del botón (BotonExito) se vuelve.
  const guardar = () => {
    const falta = faltante(datos);
    if (falta) {
      setAviso(falta.texto);
      if (falta.campo === 'valor') monto.current?.focus();
      else setPanel(falta.campo === 'categoriaId' ? 'categoria' : falta.campo);
      return false;
    }
    setAviso(null); // el aviso de antes ("Elige una categoría.") no se queda encima del chulo
    return (async () => {
      if (esProgramado) await guardarProgramado(programado?.id, datos);
      else if (recurrente) await guardarRecurrente(datos);
      else await guardarMovimiento(movimiento?.id, datos);
      if (!esProgramado && corazonAMano !== null) await guardarFavorito(datos, corazonAMano);
      if (conTarjeta) recordar(CLAVE_ULTIMA_TARJETA, datos.tarjetaId);
      else recordar(CLAVE_ULTIMA_CUENTA, datos.cuentaId);
      borradores.delete(clave);
    })();
  };

  const categoria = buscarCategoria(datos.categoriaId);
  const nombreCuenta = (id) => buscarCuenta(id)?.nombre;
  const nombresEtiquetas = datos.etiquetaIds.map((id) => buscarEtiqueta(id)?.nombre).filter(Boolean);
  const vacio = (texto) => <span className="campo-vacio">{texto}</span>;
  // Sin cuentas (o sin tarjetas, en un gasto con tarjeta) no hay dónde registrar el movimiento.
  const sinDonde = conTarjeta ? tarjetas.length === 0 : cuentas.length === 0;

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
  const filaDescripcion = (
    <div className="descripcion-con-favoritos">
      <Campo Icono={IconoTexto} etiqueta="Descripción">
        <EntradaTexto
          valor={datos.descripcion}
          alCambiar={(descripcion) => cambiar({ descripcion })}
          ejemplo={EJEMPLOS[tipo]}
          alEnfocar={alEnfocarDescripcion}
          alSalir={alSalirDescripcion}
        />
        {!esProgramado && (
          <button
            type="button"
            className="corazon"
            aria-pressed={corazon}
            aria-label={corazon ? 'Quitar de favoritos' : 'Guardar como favorito'}
            onClick={alternarCorazon}
          >
            <span key={latidos} className={'corazon-dibujo' + (latidos > 0 && corazon ? ' latido' : '')}>
              <IconoCorazon />
            </span>
            {latidos > 0 && corazon && <span key={'onda' + latidos} className="corazon-onda" />}
            <ToqueHaptico />
          </button>
        )}
      </Campo>
      {/* Desplegable encima de las filas de abajo; con más de dos se desplaza por dentro. */}
      {sugerencias.length > 0 && (
        <div className="favoritos-sugeridos" aria-label="Favoritos">
          {sugerencias.map((f) => (
            <button key={f.id} type="button" className="favorito-sugerido" onClick={() => elegirFavorito(f)}>
              <span className="favorito-sugerido-icono">
                <IconoCorazon tamano={14} />
              </span>
              <span className="favorito-sugerido-textos">
                <span className="favorito-sugerido-nombre">{f.descripcion}</span>
                <span className="favorito-sugerido-detalle">
                  {[
                    buscarCategoria(f.categoriaId)?.nombre,
                    f.tipo === 'gastoTarjeta' ? buscarTarjeta(f.tarjetaId)?.nombre : buscarCuenta(f.cuentaId)?.nombre,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span className="favorito-sugerido-usar">Usar</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
  // Frecuencia y Termina: en un programado y en un movimiento nuevo con "… recurrente" prendido.
  const filasRepetir = (
    <>
      <Campo Icono={IconoRepetirFila} etiqueta="Frecuencia" alTocar={() => setPanel('frecuencia')}>
        {textoFrecuencia(datos.frecuencia)}
      </Campo>
      <Campo Icono={IconoTermina} etiqueta="Termina" alTocar={() => setPanel('termina')}>
        {datos.termina ? fechaCorta(datos.termina) : 'Nunca'}
      </Campo>
    </>
  );
  // En un programado, la fecha es cuándo empieza.
  const filaFecha = esProgramado ? (
    <>
      <Campo Icono={IconoFecha} etiqueta="Empieza" conFlecha>
        <EntradaFecha valor={datos.fecha} alCambiar={(fecha) => cambiar({ fecha })} />
      </Campo>
      {filasRepetir}
    </>
  ) : (
    <Campo Icono={IconoFecha} etiqueta="Fecha" conFlecha>
      <EntradaFecha valor={datos.fecha} alCambiar={cambiarFecha} />
    </Campo>
  );
  // Hora: al crear no hay fila (pedido del dueño, Sesión 9: así el formulario no se desplaza); se
  // pone sola si la fecha es hoy. Solo al editar, si el movimiento la tiene; tocarla abre el reloj.
  const filaHora = movimiento && datos.hora && (
    <Campo Icono={IconoHora} etiqueta="Hora">
      <EntradaHora
        valor={datos.hora === 'ahora' ? horaActual() : datos.hora}
        texto={datos.hora === 'ahora' ? 'Ahora' : textoHora(datos.hora)}
        alCambiar={(hora) => cambiar({ hora })}
      />
    </Campo>
  );
  const filaRecurrente = puedeRepetir && (
    <>
      <Campo Icono={IconoRepetirFila} etiqueta={TEXTO_RECURRENTE[tipo]}>
        <Interruptor
          activo={recurrente}
          etiqueta={TEXTO_RECURRENTE[tipo]}
          alCambiar={(activo) => cambiar({ recurrente: activo })}
        />
      </Campo>
      {recurrente && filasRepetir}
    </>
  );
  const filaObservacion = (
    <Campo Icono={IconoNota} etiqueta="Observación" alTocar={() => setPanel('observacion')}>
      {datos.observacion ? <span className="campo-recortado">{datos.observacion}</span> : vacio('Agregar nota')}
    </Campo>
  );

  return (
    <div>
      <CabeceraFormulario titulo={editando ? tituloEditar : tituloNuevo} volverA={volverA}>
        <MontoEditable ref={monto} etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />
        {/* Al editar no se cambia el tipo (la categoría y las cuentas dependen de él), así que el
            selector no sale: antes salía bloqueado y parecía que no funcionaba (pedido del dueño,
            2026-10-04). El gasto con tarjeta tiene su propio formulario, sin estas opciones
            (design/capturas/GastoTarjeta.png). */}
        {!conTarjeta && !movimiento && !fechaPedida && (
          <Segmentado opciones={TIPOS_MOVIMIENTO} valor={tipo} etiqueta="Tipo de movimiento" alCambiar={cambiarTipo} />
        )}
      </CabeceraFormulario>

      <div className="formulario-contenido">
        {sinDonde ? (
          <div className="tarjeta movimiento-sin-cuentas">
            <p>
              {conTarjeta
                ? 'Para registrar compras con tarjeta primero crea una tarjeta.'
                : 'Para registrar movimientos primero crea una cuenta: banco, billetera o efectivo.'}
            </p>
            <button
              type="button"
              className="boton-principal"
              onClick={() => abrirVentana(conTarjeta ? 'tarjeta' : 'cuenta')}
            >
              {conTarjeta ? 'Crear tarjeta' : 'Crear cuenta'}
            </button>
          </div>
        ) : conTarjeta ? (
          <div className="tarjeta campos">
            {filaDescripcion}
            {filaCategoria}
            <Campo Icono={IconoTarjeta} etiqueta="Tarjeta" alTocar={() => setPanel('tarjetaId')}>
              {buscarTarjeta(datos.tarjetaId)?.nombre ?? vacio('Elegir')}
            </Campo>
            <Campo Icono={IconoCuotas} etiqueta="Cuotas" alTocar={() => setPanel('cuotas')}>
              {textoCuotas(datos.cuotas, datos.valor)}
            </Campo>
            {/* En un programado la factura sale de cada fecha: no se elige. */}
            {!esProgramado && (
              <Campo Icono={IconoFactura} etiqueta="Factura" alTocar={() => setPanel('factura')}>
                {datos.factura ? nombreFactura(datos.factura) : vacio('Elegir')}
              </Campo>
            )}
            {filaFecha}
            {filaHora}
            {filaRecurrente}
            {filaEtiquetas}
            {filaObservacion}
          </div>
        ) : transferencia ? (
          <div className="tarjeta campos">
            {/* La descripción arriba, como en gasto e ingreso (pedido del dueño, 2026-10-04). */}
            {filaDescripcion}
            <Campo Icono={IconoDesde} etiqueta="Desde" alTocar={() => setPanel('cuentaId')}>
              {nombreCuenta(datos.cuentaId) ?? vacio('Elegir')}
            </Campo>
            <Campo Icono={IconoHacia} etiqueta="Hacia" alTocar={() => setPanel('cuentaDestinoId')}>
              {nombreCuenta(datos.cuentaDestinoId) ?? vacio('Elegir')}
            </Campo>
            {filaFecha}
            {filaHora}
            {filaRecurrente}
            {filaObservacion}
          </div>
        ) : (
          <div className="tarjeta campos">
            {filaDescripcion}
            {filaCategoria}
            <Campo Icono={IconoCuentas} etiqueta="Cuenta" alTocar={() => setPanel('cuentaId')}>
              {nombreCuenta(datos.cuentaId) ?? vacio('Elegir')}
            </Campo>
            {filaFecha}
            {filaHora}
            {filaRecurrente}
            {filaEtiquetas}
            {/* Un programado se registra siempre como pendiente (decisión del dueño). */}
            {!esProgramado && (
              <Campo Icono={IconoPagado} etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}>
                <Interruptor
                  activo={datos.pagado}
                  etiqueta={tipo === 'ingreso' ? 'Recibido' : 'Pagado'}
                  alCambiar={(pagado) => {
                    setPagadoAMano(true);
                    cambiar({ pagado });
                  }}
                />
              </Campo>
            )}
            {filaObservacion}
          </div>
        )}

        {programado && (
          <button type="button" className="formulario-eliminar" onClick={() => setPanel('eliminar')}>
            <IconoBasura />
            Eliminar programado
          </button>
        )}
      </div>

      <PieFormulario>
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <BotonExito
          className={'boton-principal guardar-' + (conTarjeta ? 'gasto' : tipo)}
          disabled={sinDonde}
          alTocar={guardar}
          alTerminar={() => volver(navegar, volverA)}
        >
          {textoGuardar}
        </BotonExito>
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
            <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => abrirEncima('cuenta')}>
              <span className="icono-circulo grande">
                <IconoMas />
              </span>
              <span className="panel-opcion-titulo">Nueva cuenta</span>
            </button>
          </div>
        </PanelInferior>
      ))}

      <PanelInferior
        abierto={panel === 'tarjetaId'}
        alCerrar={() => setPanel(null)}
        titulo="Tarjeta"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
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
                onClick={() => elegirTarjeta(t.id)}
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
          <button type="button" className="panel-opcion panel-opcion-nueva" onClick={() => abrirEncima('tarjeta')}>
            <span className="icono-circulo grande">
              <IconoMas />
            </span>
            <span className="panel-opcion-titulo">Nueva tarjeta</span>
          </button>
        </div>
      </PanelInferior>

      <PanelInferior
        abierto={panel === 'cuotas'}
        alCerrar={() => setPanel(null)}
        titulo="Cuotas"
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
      >
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
        alCerrar={() => setPanel(null)}
        titulo={datos.cuotas > 1 ? 'Factura de la primera cuota' : 'Factura'}
        accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
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
                onClick={() => {
                  setFacturaAMano(true);
                  cambiar({ factura: mes });
                }}
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

      {(esProgramado || puedeRepetir) && (
        <>
          <PanelInferior
            abierto={panel === 'frecuencia'}
            alCerrar={() => setPanel(null)}
            titulo="Frecuencia"
            accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
          >
            <div role="radiogroup" aria-label="Frecuencia">
              {FRECUENCIAS.map((f) => {
                const marcada = f.valor === datos.frecuencia;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    role="radio"
                    aria-checked={marcada}
                    className="panel-opcion panel-lista-opcion"
                    onClick={() => cambiar({ frecuencia: f.valor })}
                  >
                    <span className="panel-opcion-textos">
                      <span className="panel-opcion-titulo">{f.texto}</span>
                    </span>
                    <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
                  </button>
                );
              })}
            </div>
            {datos.frecuencia === 'quincena' && (
              <p className="rejilla-dias-nota">
                El día en que empieza y 15 días después (o antes), cada mes. Por ejemplo, el 15 y el 30.
              </p>
            )}
          </PanelInferior>

          <PanelInferior
            abierto={panel === 'termina'}
            alCerrar={() => setPanel(null)}
            titulo="Termina"
            accion={{ texto: 'Listo', alTocar: () => setPanel(null) }}
          >
            <div role="radiogroup" aria-label="Termina">
              <button
                type="button"
                role="radio"
                aria-checked={!datos.termina}
                className="panel-opcion panel-lista-opcion"
                onClick={() => cambiar({ termina: null })}
              >
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">Nunca</span>
                </span>
                <span className={'radio' + (!datos.termina ? ' marcado' : '')}>
                  {!datos.termina && <IconoCheck tamano={14} />}
                </span>
              </button>
              <label className="panel-opcion panel-lista-opcion termina-fecha">
                <span className="panel-opcion-textos">
                  <span className="panel-opcion-titulo">En una fecha</span>
                  <span className="panel-opcion-detalle">
                    {datos.termina ? fechaCorta(datos.termina) : 'Tocar para elegir'}
                  </span>
                </span>
                <span className={'radio' + (datos.termina ? ' marcado' : '')}>
                  {datos.termina && <IconoCheck tamano={14} />}
                </span>
                <input
                  className="campo-fecha"
                  type="date"
                  aria-label="Fecha en que termina"
                  min={datos.fecha}
                  value={datos.termina ?? ''}
                  onClick={(evento) => {
                    try {
                      evento.currentTarget.showPicker?.();
                    } catch {
                      // Ya estaba abierto o el navegador no lo permite: el toque lo abre igual.
                    }
                  }}
                  onChange={(evento) => evento.target.value && cambiar({ termina: evento.target.value })}
                />
              </label>
            </div>
          </PanelInferior>

          <PanelInferior abierto={panel === 'eliminar'} alCerrar={() => setPanel(null)} titulo="¿Qué quieres eliminar?">
            <div role="radiogroup" aria-label="Qué eliminar" className="eliminar-programado">
              {[
                ...(ocurrencia
                  ? [{ valor: 'fecha', titulo: 'Solo el del ' + diaYMes(ocurrencia), detalle: 'Esa fecha no se registra. Las demás siguen.' }]
                  : []),
                ...ELIMINAR_PROGRAMADO,
              ].map((o) => {
                const marcada = o.valor === modoEliminar;
                return (
                  <button
                    key={o.valor}
                    type="button"
                    role="radio"
                    aria-checked={marcada}
                    className="panel-opcion eliminar-programado-opcion"
                    onClick={() => setModoEliminar(o.valor)}
                  >
                    <span className="panel-opcion-textos">
                      <span className="panel-opcion-titulo">{o.titulo}</span>
                      <span className="panel-opcion-detalle">{o.detalle}</span>
                    </span>
                    <span className={'radio' + (marcada ? ' marcado' : '')}>{marcada && <IconoCheck tamano={14} />}</span>
                  </button>
                );
              })}
            </div>
            <BotonExito
              className="boton-peligro"
              alTerminar={() => {
                setPanel(null);
                setTimeout(() => {
                  borradores.delete(clave);
                  volver(navegar, volverA);
                  if (modoEliminar === 'fecha') eliminarFecha(programado.id, ocurrencia);
                  else eliminarProgramado(programado.id, modoEliminar);
                }, DURACION_PANEL_MS + 30);
              }}
            >
              Eliminar
            </BotonExito>
            <button type="button" className="boton-secundario" onClick={() => setPanel(null)}>
              Cancelar
            </button>
          </PanelInferior>
        </>
      )}
    </div>
  );
}

// Nuevo programado (/programados/nuevo) y editar programado (/programados/:id).
// design/capturas/NuevoProgramado.png, sin "Registrar solo": siempre se registra como pendiente.
export function FormularioProgramado() {
  const { id } = useParams();
  const { key: clave } = useLocation();
  const [parametros] = useSearchParams();
  const { programados, cargando } = useDatos();
  const editando = id !== 'nuevo';
  const ocurrencia = /^\d{4}-\d{2}-\d{2}$/.test(parametros.get('fecha') ?? '') ? parametros.get('fecha') : null;
  const programado = editando ? programados.find((p) => p.id === id) : undefined;
  if (cargando) return <CabeceraFormulario titulo={TITULOS_PROGRAMADO[0]} volverA="/planes" />;
  if (editando && !programado) return <Navigate to="/planes" replace />;
  return <Campos key={clave} clave={clave} esProgramado programado={programado} tipoInicial="gasto" ocurrencia={ocurrencia} />;
}

// Lista de etiquetas para marcar, y un campo para crear una nueva (queda marcada).
export function PanelEtiquetas({ etiquetas, elegidas, alAlternar }) {
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
