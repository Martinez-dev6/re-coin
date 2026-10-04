import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../componentes/Avatar.jsx';
import AvisoCopia from '../componentes/AvisoCopia.jsx';
import ConteoSaldo from '../componentes/ConteoSaldo.jsx';
import BarraEstado from '../componentes/BarraEstado.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import PanelCuenta from '../componentes/PanelCuenta.jsx';
import {
  IconoAbajo,
  IconoAlerta,
  IconoAviso,
  IconoBilletera,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoMas,
  IconoOjo,
  IconoOjoTachado,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { PanelElegirMes } from '../componentes/SelectorMes.jsx';
import { fijarTipoTransacciones } from '../datos/buscar.js';
import { saldoTotal } from '../datos/cuentas.js';
import { esGasto } from '../datos/movimientos.js';
import { presupuestosDelMes } from '../datos/presupuestos.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { bloquesDeInicio, useAjustes } from '../estado/ajustes.js';
import { useMes } from '../estado/MesContext.jsx';
import { useSaldosOcultos } from '../estado/useSaldosOcultos.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { enMes, nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { useFilasAnimadas } from '../utilidades/movimiento.js';
import { BloqueBalance, BloqueGrafico, BloqueMetas, BloquePresupuestos, BloqueTarjetas } from './InicioBloques.jsx';
import './Inicio.css';

const OCULTO = '$ •••••';

const sumar = (lista) => lista.reduce((total, m) => total + m.valor, 0);

export default function Inicio() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { cuentas, movimientosPorMes, presupuestos, categoria, cargando } = useDatos();
  const sinCuentas = !cargando && cuentas.length === 0;
  const [ocultos, alternarOcultos] = useSaldosOcultos();
  const [panelMes, setPanelMes] = useState(false);
  // La cuenta tocada: su ventana (PanelCuenta) sube encima de Inicio.
  const [cuentaAbierta, setCuentaAbierta] = useState(null);
  const [panelCuenta, setPanelCuenta] = useState(false);
  const pesos = (valor) => (ocultos ? OCULTO : formatearPesos(valor));
  const elegidos = bloquesDeInicio(useAjustes()).filter((b) => b.visible);
  const listaCuentas = useRef(null);
  useFilasAnimadas(listaCuentas);

  // Al hacer scroll el banner se reduce: se desplaza con el dedo hasta dejar solo la fila de
  // arriba (perfil, mes, ojo), que nunca se mueve. Lo que pasa por debajo de esa fila se
  // desvanece antes de llegar a ella, y el saldo grande, al irse, aparece pequeño en el centro
  // de la fila en lugar del mes. Antes el banner entero se iba y sus botones pasaban por debajo
  // de la franja de la barra de estado y se veían cortados (iPhone, 2026-10-03).
  const cabecera = useRef(null);
  const banner = useRef(null);
  const fila = useRef(null);
  const etiquetaSaldo = useRef(null);
  const montoSaldo = useRef(null);
  const resumen = useRef(null);
  const botonMes = useRef(null);
  const compacto = useRef(null);
  useLayoutEffect(() => {
    // 1 en reposo; se desvanece en los 20 px antes de quedar 8 px metido en la fila. (En reposo
    // la etiqueta está a 12 px de la fila: empieza a desvanecerse apenas se mueve.)
    const visibilidad = (elemento, bordeFila) => {
      if (!elemento) return 1;
      const arriba = elemento.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, (arriba - bordeFila + 8) / 20));
    };
    const revisar = () => {
      if (!fila.current) return;
      const bordeFila = fila.current.getBoundingClientRect().bottom;
      const verSaldo = visibilidad(montoSaldo.current, bordeFila);
      // El mes se va en la primera mitad y el saldo pequeño llega en la segunda: no se enciman.
      const verCompacto = Math.max(0, 1 - verSaldo * 2);
      const valores = [
        [etiquetaSaldo.current, visibilidad(etiquetaSaldo.current, bordeFila)],
        [montoSaldo.current, verSaldo],
        [resumen.current, visibilidad(resumen.current, bordeFila)],
        [botonMes.current, Math.max(0, verSaldo * 2 - 1)],
        [compacto.current, verCompacto],
      ];
      for (const [elemento, valor] of valores) {
        if (!elemento) continue;
        elemento.style.opacity = valor;
        elemento.style.visibility = valor === 0 ? 'hidden' : 'visible';
      }
      // El saldo pequeño sube un poco al aparecer.
      if (compacto.current) compacto.current.style.transform = `translateY(${(1 - verCompacto) * 6}px)`;
    };
    // El banner se desplaza su alto menos el de la fila (ver .inicio-cabecera en Inicio.css).
    const medir = () => {
      if (cabecera.current && banner.current) {
        cabecera.current.style.setProperty('--inicio-alto', banner.current.offsetHeight + 'px');
      }
      revisar();
    };
    const observador = new ResizeObserver(medir);
    observador.observe(banner.current);
    // En captura, para oír también el scroll de la caja que usa TransicionPantallas mientras
    // anima: al volver a Inicio, la pantalla llega ya desplazada dentro de esa caja.
    const opciones = { capture: true, passive: true };
    document.addEventListener('scroll', revisar, opciones);
    medir();
    return () => {
      observador.disconnect();
      document.removeEventListener('scroll', revisar, opciones);
    };
  }, []);

  // Las transferencias no son ingresos ni gastos (decisión del dueño, 2026-10-03).
  // Las cuotas de tarjeta cuentan en el mes en que se pagan (movimientosPorMes, DatosContext).
  const delMes = movimientosPorMes.filter((m) => enMes(m.fecha, anio, mes));
  const ingresos = delMes.filter((m) => m.tipo === 'ingreso');
  const gastos = delMes.filter(esGasto);
  const gastosPendientes = gastos.filter((m) => !m.pagado);
  const ingresosPendientes = ingresos.filter((m) => !m.pagado);
  const alertas = presupuestosDelMes(presupuestos, movimientosPorMes, anio, mes).filter((p) => p.alerta);
  const hayPendientes = gastosPendientes.length + ingresosPendientes.length > 0;
  // "Pendientes y alertas" solo sale si en el mes hay algo que atender (pedido del dueño,
  // 2026-10-04): sin pendientes ni alertas, el bloque no se pinta ni ocupa lugar.
  const bloques = elegidos.filter((b) => b.id !== 'pendientes' || hayPendientes || alertas.length > 0);
  const saldo = saldoTotal(cuentas);
  // Total de todas las cuentas, también las que no suman al saldo actual ("En el saldo" apagado).
  const totalCuentas = cuentas.reduce((total, c) => total + c.saldo, 0);
  const tituloMes = nombreMes(mes) + (anio !== new Date().getFullYear() ? ` ${anio}` : '');
  // Al elegir otro mes, lo que depende del mes entra deslizándose desde ese lado.
  const posicionMes = anio * 12 + mes;

  // Ingresos y Gastos del banner abren Transacciones con ese tipo ya elegido (el mes es el mismo).
  const verEnTransacciones = (tipo) => {
    fijarTipoTransacciones(tipo);
    navegar('/transacciones');
  };

  return (
    <div className="inicio">
      <BarraEstado />

      <div ref={cabecera} className="encabezado-fijo inicio-cabecera">
        <header ref={banner} className="banner inicio-banner">
          {/* Lugar de la fila de arriba, que va fija aparte (m\u00e1s abajo). */}
          <div className="inicio-fila" />
          <div ref={etiquetaSaldo} className="inicio-saldo-etiqueta">
            Saldo actual en cuentas
          </div>
          <div ref={montoSaldo} className="inicio-saldo">
            {cargando ? '\u00a0' : ocultos ? OCULTO : <ConteoSaldo valor={saldo} />}
          </div>
          {!sinCuentas && (
            <div ref={resumen}>
              <Deslizar posicion={posicionMes} distancia={16} className="inicio-resumen">
                <button type="button" className="inicio-resumen-dato" onClick={() => verEnTransacciones('ingreso')}>
                  <span className="inicio-resumen-icono" style={{ color: 'var(--income-on-white)' }}>
                    <IconoFlechaArriba />
                  </span>
                  <span className="inicio-resumen-textos">
                    <span className="inicio-resumen-etiqueta">Ingresos</span>
                    <span className="inicio-resumen-valor">{pesos(sumar(ingresos))}</span>
                  </span>
                </button>
                <button type="button" className="inicio-resumen-dato" onClick={() => verEnTransacciones('gasto')}>
                  <span className="inicio-resumen-icono" style={{ color: 'var(--expense-on-white)' }}>
                    <IconoFlechaAbajo />
                  </span>
                  <span className="inicio-resumen-textos">
                    <span className="inicio-resumen-etiqueta">Gastos</span>
                    <span className="inicio-resumen-valor">{pesos(sumar(gastos))}</span>
                  </span>
                </button>
              </Deslizar>
            </div>
          )}
        </header>
      </div>

      {/* Fila de arriba: fija, por encima del banner. */}
      <div ref={fila} className="inicio-fila inicio-fila-fija">
        <button type="button" className="boton-banner inicio-perfil" aria-label="Perfil" onClick={() => navegar('/mi-espacio/perfil')}>
          <Avatar tamano={44} />
        </button>
        <div className="inicio-fila-centro">
          <button
            ref={botonMes}
            type="button"
            className="inicio-mes"
            aria-label="Cambiar mes"
            onClick={() => setPanelMes(true)}
          >
            <Deslizar as="span" posicion={posicionMes} distancia={16}>
              {tituloMes}
            </Deslizar>
            <IconoAbajo />
          </button>
          <div ref={compacto} className="inicio-compacto" aria-hidden="true">
            <span>Saldo actual</span>
            <strong>{pesos(saldo)}</strong>
          </div>
        </div>
        <button
          type="button"
          className="boton-banner"
          aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
          onClick={alternarOcultos}
        >
          {ocultos ? <IconoOjoTachado /> : <IconoOjo />}
        </button>
      </div>

      {/* Sin cuentas: design/capturas/InicioVacio.png */}
      {sinCuentas && (
        <div className="inicio-contenido">
          <div className="tarjeta inicio-vacio">
            <span className="inicio-vacio-icono">
              <IconoBilletera tamano={34} />
            </span>
            <h2 className="inicio-vacio-titulo">Crea tu primera cuenta</h2>
            <p className="inicio-vacio-texto">
              Agrega dónde tienes tu dinero: banco, billetera o efectivo. Después podrás registrar ingresos y gastos.
            </p>
            <button type="button" className="boton-principal inicio-vacio-boton" onClick={() => navegar('/cuentas/nueva')}>
              Crear cuenta
            </button>
            <button
              type="button"
              className="boton-texto inicio-vacio-importar"
              onClick={() => navegar('/mi-espacio/importar-exportar')}
            >
              Ya tengo datos, importar
            </button>
          </div>
        </div>
      )}

      {!cargando && !sinCuentas && (
        <div className="inicio-contenido">
          <AvisoCopia />
          {bloques.map(({ id }) => (
            <section key={id} className="inicio-bloque">
              {id === 'pendientes' && (
                <>
                  <h2 className="inicio-titulo">Pendientes y alertas</h2>
                  {hayPendientes && (
                    <Deslizar posicion={posicionMes} className="inicio-pendientes">
                      <button type="button" className="tarjeta inicio-pendiente" onClick={() => navegar('/pendientes?tipo=gasto')}>
                        <div className="inicio-pendiente-cabeza">
                          <span className="inicio-pendiente-icono">
                            <IconoFlechaAbajo tamano={18} grosor={2} />
                          </span>
                          {gastosPendientes.length > 0 && (
                            <span className="inicio-insignia rojo">{gastosPendientes.length}</span>
                          )}
                        </div>
                        <div className="inicio-pendiente-etiqueta">Gastos pendientes</div>
                        <div className="inicio-pendiente-valor" style={{ color: 'var(--expense)' }}>
                          {pesos(sumar(gastosPendientes))}
                        </div>
                      </button>
                      <button type="button" className="tarjeta inicio-pendiente" onClick={() => navegar('/pendientes?tipo=ingreso')}>
                        <div className="inicio-pendiente-cabeza">
                          <span className="inicio-pendiente-icono">
                            <IconoFlechaArriba tamano={18} grosor={2} />
                          </span>
                          {ingresosPendientes.length > 0 && (
                            <span className="inicio-insignia verde">{ingresosPendientes.length}</span>
                          )}
                        </div>
                        <div className="inicio-pendiente-etiqueta">Ingresos pendientes</div>
                        <div className="inicio-pendiente-valor" style={{ color: 'var(--income)' }}>
                          {pesos(sumar(ingresosPendientes))}
                        </div>
                      </button>
                    </Deslizar>
                  )}

                  {/* Presupuestos que llegaron a su "Avisarme al" o se pasaron (aviso dentro de la app).
                      Tocar uno lleva a Planes → Presupuestos, donde están todos con su barra. */}
                  {alertas.length > 0 && (
                    <Deslizar posicion={posicionMes} className="tarjeta inicio-alertas">
                      {alertas.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={'inicio-alerta ' + p.alerta}
                          onClick={() => navegar('/planes')}
                        >
                          <span className="inicio-alerta-icono">
                            {p.alerta === 'excedido' ? <IconoAlerta tamano={16} /> : <IconoAviso tamano={16} />}
                          </span>
                          <span className="inicio-alerta-texto">
                            <strong>{categoria(p.categoriaId)?.nombre ?? 'Presupuesto'}</strong>
                            {p.alerta === 'excedido'
                              ? ` se pasó por ${pesos(p.gastado - p.limite)}`
                              : ` va en el ${p.usado} % del presupuesto`}
                          </span>
                        </button>
                      ))}
                    </Deslizar>
                  )}
                </>
              )}
              {id === 'cuentas' && (
                <>
                  <div className="inicio-cuentas-cabeza">
                    <h2 className="inicio-titulo">Cuentas</h2>
                    <button type="button" className="boton-texto inicio-nueva-cuenta" onClick={() => navegar('/cuentas/nueva')}>
                      + Nueva cuenta
                    </button>
                  </div>
                  <div ref={listaCuentas} className="inicio-cuentas">
                    {cuentas.map(({ id, nombre, icono, color, saldo: saldoCuenta }) => (
                      <div key={id} data-clave={id} className="inicio-cuenta">
                        {/* Toda la fila (menos el "+") abre la ventana de la cuenta, como en Mi espacio → Cuentas. */}
                        <button
                          type="button"
                          className="inicio-cuenta-abrir"
                          onClick={() => {
                            setCuentaAbierta(id);
                            setPanelCuenta(true);
                          }}
                        >
                          <span className="icono-circulo grande" style={estiloIconoCuenta(color)}>
                            <IconoPorNombre nombre={icono} tamano={20} />
                          </span>
                          <span className="inicio-cuenta-textos">
                            <span className="inicio-cuenta-nombre">{nombre}</span>
                            <span className={'inicio-cuenta-saldo' + (saldoCuenta < 0 ? ' negativo' : '')}>{pesos(saldoCuenta)}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="inicio-cuenta-mas"
                          aria-label={`Agregar movimiento a ${nombre}`}
                          onClick={() => navegar('/nuevo/gasto?cuenta=' + id)}
                        >
                          <IconoMas />
                        </button>
                      </div>
                    ))}
                    {/* Última fila de la tarjeta: el total de todas las cuentas. */}
                    <div className="inicio-cuentas-total">
                      <span className="inicio-cuentas-total-titulo">Total</span>
                      <strong className={totalCuentas < 0 ? 'negativo' : undefined}>{pesos(totalCuentas)}</strong>
                    </div>
                  </div>
                </>
              )}
              {id === 'balance' && <BloqueBalance pesos={pesos} ocultos={ocultos} posicion={posicionMes} />}
              {id === 'presupuestos' && <BloquePresupuestos pesos={pesos} posicion={posicionMes} />}
              {id === 'metas' && <BloqueMetas pesos={pesos} />}
              {id === 'grafico' && <BloqueGrafico pesos={pesos} posicion={posicionMes} />}
              {id === 'tarjetas' && <BloqueTarjetas pesos={pesos} />}
            </section>
          ))}
        </div>
      )}

      <PanelElegirMes abierto={panelMes} alCerrar={() => setPanelMes(false)} />
      <PanelCuenta
        cuenta={cuentas.find((c) => c.id === cuentaAbierta)}
        abierto={panelCuenta}
        alCerrar={() => setPanelCuenta(false)}
        ocultos={ocultos}
      />
    </div>
  );
}
