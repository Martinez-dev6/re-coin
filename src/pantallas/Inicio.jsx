import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import {
  IconoAbajo,
  IconoBilletera,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoMas,
  IconoOjo,
  IconoOjoTachado,
  IconoPerfil,
} from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import { PanelElegirMes } from '../componentes/SelectorMes.jsx';
import { saldoTotal } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { useMes } from '../estado/MesContext.jsx';
import { useSaldosOcultos } from '../estado/useSaldosOcultos.js';
import { estiloIconoCuenta } from '../tema/colores.js';
import { enMes, nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import { useFilasAnimadas } from '../utilidades/movimiento.js';
import './Inicio.css';

const OCULTO = '$ •••••';

// Los movimientos llegan en el paso 5; mientras tanto, ninguno.
const MOVIMIENTOS = [];

const sumar = (lista) => lista.reduce((total, m) => total + m.valor, 0);

export default function Inicio() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const { cuentas, cargando } = useDatos();
  const sinCuentas = !cargando && cuentas.length === 0;
  const [ocultos, alternarOcultos] = useSaldosOcultos();
  const [panelMes, setPanelMes] = useState(false);
  const pesos = (valor) => (ocultos ? OCULTO : formatearPesos(valor));
  const listaCuentas = useRef(null);
  useFilasAnimadas(listaCuentas);

  // Barra compacta: aparece cuando el banner grande sale de la pantalla al hacer scroll.
  const banner = useRef(null);
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    const revisar = () => setCompacta((banner.current?.getBoundingClientRect().bottom ?? 0) < 120);
    window.addEventListener('scroll', revisar, { passive: true });
    revisar();
    return () => window.removeEventListener('scroll', revisar);
  }, []);

  const delMes = MOVIMIENTOS.filter((m) => enMes(m.fecha, anio, mes));
  const ingresos = delMes.filter((m) => m.tipo === 'ingreso');
  const gastos = delMes.filter((m) => m.tipo === 'gasto');
  const gastosPendientes = gastos.filter((m) => !m.pagado);
  const ingresosPendientes = ingresos.filter((m) => !m.pagado);
  const saldo = saldoTotal(cuentas);
  const tituloMes = nombreMes(mes) + (anio !== new Date().getFullYear() ? ` ${anio}` : '');
  // Al elegir otro mes, lo que depende del mes entra deslizándose desde ese lado.
  const posicionMes = anio * 12 + mes;

  const botonPerfil = (
    <button type="button" className="boton-banner" aria-label="Perfil" onClick={() => navegar('/pendiente/perfil')}>
      <IconoPerfil />
    </button>
  );
  const botonOjo = (
    <button
      type="button"
      className="boton-banner"
      aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
      onClick={alternarOcultos}
    >
      {ocultos ? <IconoOjoTachado /> : <IconoOjo />}
    </button>
  );

  return (
    <div className="inicio">
      <BarraEstado />

      <div className={'inicio-compacta' + (compacta ? ' visible' : '')} aria-hidden={!compacta}>
        <div className="banner inicio-compacta-banner">
          <div className="inicio-fila">
            {botonPerfil}
            <div className="inicio-compacta-centro">
              <span>Saldo actual</span>
              <strong>{pesos(saldo)}</strong>
            </div>
            {botonOjo}
          </div>
        </div>
      </div>


      <header ref={banner} className="banner inicio-banner">
        <div className="inicio-fila">
          {botonPerfil}
          <button type="button" className="inicio-mes" aria-label="Cambiar mes" onClick={() => setPanelMes(true)}>
            <Deslizar as="span" posicion={posicionMes} distancia={16}>
              {tituloMes}
            </Deslizar>
            <IconoAbajo />
          </button>
          {botonOjo}
        </div>
        <div className="inicio-saldo-etiqueta">Saldo actual en cuentas</div>
        <div className="inicio-saldo">{cargando ? '\u00a0' : pesos(saldo)}</div>
        {!sinCuentas && (
          <Deslizar posicion={posicionMes} distancia={16} className="inicio-resumen">
            <div className="inicio-resumen-dato">
              <span className="inicio-resumen-icono" style={{ color: 'var(--income-on-white)' }}>
                <IconoFlechaArriba />
              </span>
              <div>
                <div className="inicio-resumen-etiqueta">Ingresos</div>
                <div className="inicio-resumen-valor">{pesos(sumar(ingresos))}</div>
              </div>
            </div>
            <div className="inicio-resumen-dato">
              <span className="inicio-resumen-icono" style={{ color: 'var(--expense-on-white)' }}>
                <IconoFlechaAbajo />
              </span>
              <div>
                <div className="inicio-resumen-etiqueta">Gastos</div>
                <div className="inicio-resumen-valor">{pesos(sumar(gastos))}</div>
              </div>
            </div>
          </Deslizar>
        )}
      </header>

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
          <h2 className="inicio-titulo">Pendientes y alertas</h2>
          <Deslizar posicion={posicionMes} className="inicio-pendientes">
            <button type="button" className="tarjeta inicio-pendiente" onClick={() => navegar('/transacciones')}>
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
            <button type="button" className="tarjeta inicio-pendiente" onClick={() => navegar('/transacciones')}>
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

          <div className="inicio-cuentas-cabeza">
            <h2 className="inicio-titulo">Cuentas</h2>
            <button type="button" className="boton-texto inicio-nueva-cuenta" onClick={() => navegar('/cuentas/nueva')}>
              + Nueva cuenta
            </button>
          </div>
          <div ref={listaCuentas} className="inicio-cuentas">
            {cuentas.map(({ id, nombre, icono, color, saldo: saldoCuenta }) => (
              <div key={id} data-clave={id} className="inicio-cuenta">
                {/* Toda la fila (menos el "+") abre la cuenta, como en Mi espacio → Cuentas. */}
                <button type="button" className="inicio-cuenta-abrir" onClick={() => navegar('/cuentas/' + id)}>
                  <span className="icono-circulo grande" style={estiloIconoCuenta(color)}>
                    <IconoPorNombre nombre={icono} tamano={20} />
                  </span>
                  <span className="inicio-cuenta-textos">
                    <span className="inicio-cuenta-nombre">{nombre}</span>
                    <span className="inicio-cuenta-saldo">{pesos(saldoCuenta)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="inicio-cuenta-mas"
                  aria-label={`Agregar movimiento a ${nombre}`}
                  onClick={() => navegar('/nuevo/gasto')}
                >
                  <IconoMas />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <PanelElegirMes abierto={panelMes} alCerrar={() => setPanelMes(false)} />
    </div>
  );
}
