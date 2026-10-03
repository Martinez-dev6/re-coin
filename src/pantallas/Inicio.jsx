import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraEstado from '../componentes/BarraEstado.jsx';
import {
  IconoAbajo,
  IconoBanco,
  IconoBilletera,
  IconoEfectivo,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoMas,
  IconoOjo,
  IconoOjoTachado,
  IconoPerfil,
} from '../componentes/iconos.jsx';
import { PanelElegirMes } from '../componentes/SelectorMes.jsx';
import { CUENTAS, MOVIMIENTOS } from '../datos/prueba.js';
import { useMes } from '../estado/MesContext.jsx';
import { useSaldosOcultos } from '../estado/useSaldosOcultos.js';
import { enMes, nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Inicio.css';

const ICONO_CUENTA = { banco: IconoBanco, billetera: IconoBilletera, efectivo: IconoEfectivo };
const OCULTO = '$ •••••';

const sumar = (lista) => lista.reduce((total, m) => total + m.valor, 0);

export default function Inicio() {
  const navegar = useNavigate();
  const { anio, mes } = useMes();
  const [ocultos, alternarOcultos] = useSaldosOcultos();
  const [panelMes, setPanelMes] = useState(false);
  const pesos = (valor) => (ocultos ? OCULTO : formatearPesos(valor));

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
  const saldo = CUENTAS.reduce((total, c) => total + c.saldo, 0);
  const tituloMes = nombreMes(mes) + (anio !== new Date().getFullYear() ? ` ${anio}` : '');

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
      <BarraEstado color="var(--banner-bg)" />

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
            {tituloMes}
            <IconoAbajo />
          </button>
          {botonOjo}
        </div>
        <div className="inicio-saldo-etiqueta">Saldo actual en cuentas</div>
        <div className="inicio-saldo">{pesos(saldo)}</div>
        <div className="inicio-resumen">
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
        </div>
      </header>

      <div className="inicio-contenido">
        <h2 className="inicio-titulo">Pendientes y alertas</h2>
        <div className="inicio-pendientes">
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
        </div>

        <div className="inicio-cuentas-cabeza">
          <h2 className="inicio-titulo">Cuentas</h2>
          <button type="button" className="boton-texto inicio-nueva-cuenta" onClick={() => navegar('/pendiente/cuentas')}>
            + Nueva cuenta
          </button>
        </div>
        <div className="inicio-cuentas">
          {CUENTAS.map(({ id, nombre, tipo, saldo: saldoCuenta }) => {
            const Icono = ICONO_CUENTA[tipo] ?? IconoBanco;
            return (
              <div key={id} className="inicio-cuenta">
                <span className="icono-circulo grande">
                  <Icono />
                </span>
                <div className="inicio-cuenta-textos">
                  <div className="inicio-cuenta-nombre">{nombre}</div>
                  <div className="inicio-cuenta-saldo">{pesos(saldoCuenta)}</div>
                </div>
                <button
                  type="button"
                  className="inicio-cuenta-mas"
                  aria-label={`Agregar movimiento a ${nombre}`}
                  onClick={() => navegar('/nuevo/gasto')}
                >
                  <IconoMas />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <PanelElegirMes abierto={panelMes} alCerrar={() => setPanelMes(false)} />
    </div>
  );
}
