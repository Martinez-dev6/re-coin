// Nuevo gasto, ingreso, transferencia o gasto con tarjeta (/nuevo/gasto, /nuevo/ingreso,
// /nuevo/transferencia, /nuevo/gasto-tarjeta; ?cuenta=id elige la cuenta). Editar un movimiento va
// en una ventana flotante (EditarMovimiento.jsx); las filas y los paneles de elección son los
// mismos (CamposMovimiento.jsx). design/capturas/NuevoGasto.png, NuevoIngreso.png,
// NuevaTransferencia.png, GastoTarjeta.png, SelectorCategoria.png y SelectorCuenta.png.
// Desde la Sesión 9 (pedido del dueño) los programados se crean aquí: el interruptor "Gasto
// recurrente" (o ingreso, o transferencia) muestra Frecuencia y Termina, y al guardar se crea el
// movimiento y el programado que lo repite (guardarRecurrente en programados.js).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import BotonExito from '../componentes/BotonExito.jsx';
import { EJEMPLOS, FilasMovimiento, PanelesMovimiento } from '../componentes/CamposMovimiento.jsx';
import {
  CabeceraFormulario,
  Campo,
  EntradaTexto,
  Interruptor,
  MontoEditable,
  PieFormulario,
  Segmentado,
} from '../componentes/Formulario.jsx';
import { IconoCheck, IconoCorazon, IconoRepetir, IconoReloj, IconoTexto } from '../componentes/iconos.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import ToqueHaptico from '../componentes/ToqueHaptico.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { favoritoDe, guardarFavorito, sugerirFavoritos, usarFavorito } from '../datos/favoritos.js';
import { faltante, guardarMovimiento, TIPOS_MOVIMIENTO } from '../datos/movimientos.js';
import { FRECUENCIAS, guardarRecurrente, textoFrecuencia } from '../datos/programados.js';
import { facturaDeFecha } from '../datos/tarjetas.js';
import { abrirVentana } from '../estado/ventanas.js';
import { fechaCorta, hoyTexto } from '../utilidades/fechas.js';
import { volver } from '../utilidades/navegacion.js';
import { pasarTeclado } from '../utilidades/teclado.js';
import './FormularioMovimiento.css';

const TITULOS = {
  gasto: ['Nuevo gasto', 'Guardar gasto'],
  ingreso: ['Nuevo ingreso', 'Guardar ingreso'],
  transferencia: ['Nueva transferencia', 'Guardar transferencia'],
  gastoTarjeta: ['Gasto con tarjeta', 'Guardar gasto de tarjeta'],
};

// Interruptor para repetir el movimiento (Sesión 9).
const TEXTO_RECURRENTE = {
  gasto: 'Gasto recurrente',
  ingreso: 'Ingreso recurrente',
  transferencia: 'Transferencia recurrente',
  // Gasto con tarjeta (suscripciones; pedido del dueño, Sesión 9): cada repetición va a la factura que
  // le toca por su fecha.
  gastoTarjeta: 'Gasto recurrente',
};

// Ruta (/nuevo/…) → tipo.
const TIPO_POR_RUTA = { gasto: 'gasto', ingreso: 'ingreso', transferencia: 'transferencia', 'gasto-tarjeta': 'gastoTarjeta' };

const IconoRepetirFila = (p) => <IconoRepetir tamano={18} grosor={2} {...p} />;
const IconoTermina = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

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

// Lo escrito en un formulario sin guardar, por entrada del historial. Si se sale a crear una
// categoría, una cuenta o una etiqueta y se vuelve, el formulario sigue como estaba.
const borradores = new Map();

export default function FormularioMovimiento() {
  const { pantalla } = useParams();
  const [parametros] = useSearchParams();
  const { key: clave } = useLocation();
  const { cargando } = useDatos();

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

function datosIniciales({ tipoInicial, cuentaPedida, fechaPedida, cuentas, tarjetas }) {
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
    // null, 'HH:MM' o 'ahora' (la hora en que se guarde)
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

function Campos({ clave, tipoInicial, cuentaPedida, fechaPedida }) {
  const navegar = useNavigate();
  const {
    cuentas,
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
      datosIniciales({ tipoInicial, cuentaPedida, fechaPedida, cuentas, tarjetas }),
  );
  // Mientras no se toque "Pagado" a mano, una fecha futura lo apaga y una de hoy o antes lo prende.
  const [pagadoAMano, setPagadoAMano] = useState(borrador?.pagadoAMano ?? false);
  // Igual con la factura de un gasto con tarjeta: sigue a la fecha y a la tarjeta (día de cierre).
  const [facturaAMano, setFacturaAMano] = useState(borrador?.facturaAMano ?? false);
  // Corazón de favorito: null = sin tocar (se ve marcado si la descripción ya es un favorito y al
  // guardar no cambia nada); true o false = tocado a mano (al guardar crea, actualiza o quita).
  const [corazonAMano, setCorazonAMano] = useState(borrador?.corazonAMano ?? null);
  // Sube cada vez que se marca: vuelve a dibujar el corazón para repetir su latido.
  const [latidos, setLatidos] = useState(0);
  // Escribiendo en la descripción: solo entonces sale el desplegable de favoritos.
  const [escribiendo, setEscribiendo] = useState(false);
  const salida = useRef(null);
  // Los de CamposMovimiento, 'frecuencia' o 'termina'.
  const [panel, setPanel] = useState(null);
  const [aviso, setAviso] = useState(null);
  const monto = useRef(null);

  // Un movimiento nuevo abre con el cursor en el valor y el teclado arriba (pedido del dueño,
  // 2026-10-04; el menú del "+" prepara el teclado, ver teclado.js). Cuando la pantalla termina de
  // entrar: con el foco puesto a mitad del deslizamiento, el cursor daba saltos. No al volver con
  // algo ya escrito (borrador).
  useEffect(() => {
    const conTeclado = !borrador?.datos.valor;
    return pasarTeclado(() => (conTeclado ? monto.current : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo al entrar.
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
  const conTarjeta = tipo === 'gastoTarjeta';
  // Las categorías son de gasto o de ingreso; el gasto con tarjeta usa las de gasto.
  const tipoCategoria = tipo === 'ingreso' ? 'ingreso' : 'gasto';
  const [titulo, textoGuardar] = TITULOS[tipo];
  // "Gasto recurrente" (o ingreso, transferencia o gasto con tarjeta).
  const recurrente = Boolean(datos.recurrente);
  const volverA = '/';

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
  // fila. Sin fila Hora al crear (así el formulario no se desplaza).
  const horaSegun = (fecha, actual) => {
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
  // escrito.
  const corazon = corazonAMano ?? Boolean(favoritoDe(favoritos, tipo, datos.descripcion));
  const sugerencias = !escribiendo ? [] : sugerirFavoritos(favoritos, tipo, datos.descripcion, 10);
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
      if (recurrente) await guardarRecurrente(datos);
      else await guardarMovimiento(null, datos);
      if (corazonAMano !== null) await guardarFavorito(datos, corazonAMano);
      if (conTarjeta) recordar(CLAVE_ULTIMA_TARJETA, datos.tarjetaId);
      else recordar(CLAVE_ULTIMA_CUENTA, datos.cuentaId);
      borradores.delete(clave);
    })();
  };

  // Sin cuentas (o sin tarjetas, en un gasto con tarjeta) no hay dónde registrar el movimiento.
  const sinDonde = conTarjeta ? tarjetas.length === 0 : cuentas.length === 0;

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
  // "Gasto recurrente"; prendido, Frecuencia y Termina.
  const filasRecurrente = (
    <>
      <Campo Icono={IconoRepetirFila} etiqueta={TEXTO_RECURRENTE[tipo]}>
        <Interruptor
          activo={recurrente}
          etiqueta={TEXTO_RECURRENTE[tipo]}
          alCambiar={(activo) => cambiar({ recurrente: activo })}
        />
      </Campo>
      {recurrente && (
        <>
          <Campo Icono={IconoRepetirFila} etiqueta="Frecuencia" alTocar={() => setPanel('frecuencia')}>
            {textoFrecuencia(datos.frecuencia)}
          </Campo>
          <Campo Icono={IconoTermina} etiqueta="Termina" alTocar={() => setPanel('termina')}>
            {datos.termina ? fechaCorta(datos.termina) : 'Nunca'}
          </Campo>
        </>
      )}
    </>
  );
  const campos = { datos, setDatos, panel, setPanel };

  return (
    <div>
      <CabeceraFormulario titulo={titulo} volverA={volverA}>
        <MontoEditable ref={monto} etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />
        {/* El gasto con tarjeta tiene su propio formulario, sin estas opciones
            (design/capturas/GastoTarjeta.png). */}
        {!conTarjeta && !fechaPedida && (
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
        ) : (
          <FilasMovimiento
            {...campos}
            descripcion={filaDescripcion}
            cambiarFecha={cambiarFecha}
            cambiarPagado={(pagado) => {
              setPagadoAMano(true);
              cambiar({ pagado });
            }}
            despuesDeFecha={filasRecurrente}
          />
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

      <PanelesMovimiento
        {...campos}
        conNuevas
        elegirTarjeta={(tarjetaId) =>
          setDatos((d) => ({ ...d, tarjetaId, factura: facturaSegun(tarjetaId, d.fecha, d.factura) }))
        }
        elegirFactura={(factura) => {
          setFacturaAMano(true);
          cambiar({ factura });
        }}
      />

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
    </div>
  );
}
