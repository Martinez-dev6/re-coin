// Rendimiento (/mi-espacio/rendimiento): balance del mes (ingresos − gastos), ingresos y gastos de
// los últimos 6 meses y una tabla de los últimos 3. design/capturas/Rendimiento.png
// El mes es el elegido en Inicio y Transacciones; tocar un mes en el gráfico lo elige.
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import Deslizar from '../componentes/Deslizar.jsx';
import { Barras } from '../componentes/Graficos.jsx';
import { IconoGastoDiagonal, IconoIngresoDiagonal } from '../componentes/iconos.jsx';
import { useDatos } from '../datos/DatosContext.jsx';
import { mesCorto, textoMes, totalDelMes, ventanaDeMeses } from '../datos/graficos.js';
import { useMes } from '../estado/MesContext.jsx';
import { nombreMes } from '../utilidades/fechas.js';
import { formatearPesos } from '../utilidades/formato.js';
import './Graficos.css';

// Con signo: "+ $ 1.284.300" o "- $ 300.000" (en cero, sin signo).
const conSigno = (valor) => (valor === 0 ? '' : valor < 0 ? '- ' : '+ ') + formatearPesos(Math.abs(valor));

export default function Rendimiento() {
  const { anio, mes, elegir } = useMes();
  const { movimientosPorMes } = useDatos();
  const elegido = textoMes(anio, mes);
  const totales = (m) => {
    const ingresos = totalDelMes(movimientosPorMes, 'ingreso', m);
    const gastos = totalDelMes(movimientosPorMes, 'gasto', m);
    return { ingresos, gastos, balance: ingresos - gastos };
  };
  const delMes = totales(elegido);
  const meses = ventanaDeMeses(elegido);
  // La tabla: el mes elegido y los dos anteriores.
  const tabla = meses.slice(0, meses.indexOf(elegido) + 1).slice(-3);
  const ahorro = delMes.ingresos > 0 ? Math.round((delMes.balance / delMes.ingresos) * 100) : 0;

  let frase = 'Sin ingresos ni gastos este mes.';
  if (delMes.ingresos > 0 && delMes.balance >= 0) frase = `Ahorraste el ${ahorro} % de tus ingresos`;
  else if (delMes.balance < 0) frase = `Gastaste ${formatearPesos(-delMes.balance)} más de lo que entró`;

  return (
    <div>
      <CabeceraSubpagina titulo="Rendimiento" volverA="/mi-espacio">
        <Deslizar posicion={anio * 12 + mes} distancia={16} className="cabecera-cifra">
          <div className="cabecera-cifra-etiqueta">Balance de {nombreMes(mes, false)}</div>
          <div className="cabecera-cifra-valor">{conSigno(delMes.balance)}</div>
          <div className="cabecera-cifra-nota">{frase}</div>
        </Deslizar>
      </CabeceraSubpagina>

      <Deslizar posicion={anio * 12 + mes} className="contenido graficos-contenido">
        <div className="rendimiento-totales">
          <div className="tarjeta rendimiento-total">
            <div className="rendimiento-total-etiqueta">
              <IconoIngresoDiagonal tamano={14} style={{ color: 'var(--income)' }} />
              Ingresos
            </div>
            <div className="rendimiento-total-valor">{formatearPesos(delMes.ingresos)}</div>
          </div>
          <div className="tarjeta rendimiento-total">
            <div className="rendimiento-total-etiqueta">
              <IconoGastoDiagonal tamano={14} style={{ color: 'var(--expense)' }} />
              Gastos
            </div>
            <div className="rendimiento-total-valor">{formatearPesos(delMes.gastos)}</div>
          </div>
        </div>

        <div className="tarjeta graficos-tarjeta">
          <div className="graficos-cabeza">
            <h2>Ingresos y gastos</h2>
            <span>Últimos 6 meses</span>
          </div>
          <div className="rendimiento-leyenda">
            <span>
              <i style={{ background: 'var(--income)' }} />
              Ingresos
            </span>
            <span>
              <i style={{ background: 'var(--expense)' }} />
              Gastos
            </span>
          </div>
          <Barras
            etiqueta="Ingresos y gastos de los últimos 6 meses"
            elegido={elegido}
            alElegir={(m) => elegir(Number(m.slice(0, 4)), Number(m.slice(5)) - 1)}
            grupos={meses.map((m) => {
              const t = totales(m);
              return {
                clave: m,
                etiqueta: mesCorto(m),
                valores: [
                  { valor: t.ingresos, color: 'var(--income)' },
                  { valor: t.gastos, color: 'var(--expense)' },
                ],
              };
            })}
          />
          <p className="graficos-nota">Toca un mes para verlo.</p>
        </div>

        <div className="tarjeta graficos-tarjeta">
          <table className="rendimiento-tabla">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((m) => {
                const t = totales(m);
                return (
                  <tr key={m}>
                    <td>{mesCorto(m)}</td>
                    <td>{formatearPesos(t.ingresos).replace('$ ', '')}</td>
                    <td>{formatearPesos(t.gastos).replace('$ ', '')}</td>
                    <td className={t.balance < 0 ? 'negativo' : t.balance > 0 ? 'positivo' : undefined}>
                      {conSigno(t.balance).replace('$ ', '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Deslizar>
    </div>
  );
}
