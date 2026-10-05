// Lista de cuentas con el saldo total (design/capturas/Cuentas.png).
import { useRef, useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoFlecha, IconoMas } from '../componentes/iconos.jsx';
import { IconoPorNombre } from '../componentes/iconosPorNombre.jsx';
import PanelCuenta from '../componentes/PanelCuenta.jsx';
import { saldoTotal, tipoCuenta } from '../datos/cuentas.js';
import { useDatos } from '../datos/DatosContext.jsx';
import { estiloIconoCuenta } from '../tema/colores.js';
import { formatearPesos } from '../utilidades/formato.js';
import { useFilasAnimadas } from '../utilidades/movimiento.js';
import './Cuentas.css';
import { abrirVentana } from '../estado/ventanas.js';

export default function Cuentas() {
  const { cuentas, cargando } = useDatos();
  const nueva = () => abrirVentana('cuenta');
  const lista = useRef(null);
  useFilasAnimadas(lista);
  // La cuenta tocada: su ventana (PanelCuenta).
  const [cuentaAbierta, setCuentaAbierta] = useState(null);
  const [panelCuenta, setPanelCuenta] = useState(false);

  return (
    <div>
      <CabeceraSubpagina
        titulo="Cuentas"
        volverA="/mi-espacio"
        derecha={
          <button type="button" className="boton-banner" aria-label="Nueva cuenta" onClick={nueva}>
            <IconoMas />
          </button>
        }
      >
        <div className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">Saldo total</div>
          <div className="cabecera-cifra-valor">{cargando ? ' ' : formatearPesos(saldoTotal(cuentas))}</div>
          <div className="cabecera-cifra-nota">
            {cuentas.length === 1 ? '1 cuenta' : `${cuentas.length} cuentas`}
          </div>
        </div>
      </CabeceraSubpagina>

      <div className="contenido cuentas-contenido">
        {cuentas.length > 0 && (
          <div ref={lista} className="tarjeta cuentas-lista">
            {cuentas.map((cuenta) => (
              <button
                key={cuenta.id}
                data-clave={cuenta.id}
                type="button"
                className="cuentas-fila"
                onClick={() => {
                  setCuentaAbierta(cuenta.id);
                  setPanelCuenta(true);
                }}
              >
                <span className="icono-circulo grande" style={estiloIconoCuenta(cuenta.color)}>
                  <IconoPorNombre nombre={cuenta.icono} tamano={20} />
                </span>
                <span className="cuentas-textos">
                  <span className="cuentas-nombre">{cuenta.nombre}</span>
                  <span className="cuentas-detalle">
                    {tipoCuenta(cuenta.tipo).corto}
                    {!cuenta.incluirEnSaldo && ' · Fuera del saldo'}
                  </span>
                </span>
                <span className={'cuentas-saldo' + (cuenta.saldo < 0 ? ' negativo' : '')}>
                  {formatearPesos(cuenta.saldo)}
                </span>
                <span className="cuentas-flecha">
                  <IconoFlecha />
                </span>
              </button>
            ))}
          </div>
        )}

        {!cargando && (
          <button type="button" className="cuentas-nueva" onClick={nueva}>
            <IconoMas tamano={18} />
            Nueva cuenta
          </button>
        )}
      </div>

      <PanelCuenta
        cuenta={cuentas.find((c) => c.id === cuentaAbierta)}
        abierto={panelCuenta}
        alCerrar={() => setPanelCuenta(false)}
      />
    </div>
  );
}
