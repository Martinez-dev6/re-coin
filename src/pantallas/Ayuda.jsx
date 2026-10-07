// Ayuda y soporte (design/html/Ayuda.html): preguntas frecuentes (se abren y cierran en la misma
// pantalla) y Acerca de. Sin "Escribir a soporte" ni "Novedades": la app es de uso personal y no
// hay un correo de soporte ni un registro de cambios para mostrar.
import { useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoAbajo, IconoInfo } from '../componentes/iconos.jsx';
import './Ayuda.css';
import { conNegritas } from '../utilidades/negritas.jsx';

// Si cambia cómo funciona algo de esto, cambiar también la respuesta.
const PREGUNTAS = [
  {
    pregunta: '¿Dónde se guardan mis datos?',
    respuesta:
      'Solo en este teléfono, dentro de la app. No se envían a ningún servidor. Si borras la app de la pantalla de inicio, se borran con ella: haz copias de seguridad desde Menú → Importar y exportar.',
  },
  {
    pregunta: '¿Cómo se calcula el saldo de una cuenta?',
    respuesta:
      'Es el saldo inicial más los ingresos y menos los gastos que ya están pagados. Lo pendiente no cuenta hasta que lo marques como pagado (tocándolo en Pendientes o tocando Pendiente en el detalle).',
  },
  {
    pregunta: '¿Qué es un movimiento pendiente?',
    respuesta:
      'Uno que aún no ha pasado por tu cuenta: los de fecha futura, los programados de este mes y las cuotas de tarjeta cuya factura no has pagado. Suman en los totales del mes, pero no en el saldo.',
  },
  {
    pregunta: '¿Las transferencias cuentan como gasto?',
    respuesta:
      'No. Solo mueven dinero entre tus cuentas, así que no aparecen en los ingresos ni en los gastos del mes ni en los gráficos. El pago de una tarjeta funciona igual.',
  },
  {
    pregunta: '¿Cómo funcionan las compras con tarjeta?',
    respuesta:
      'Una compra con tarjeta no toca tus cuentas: va a la factura de la tarjeta. Si es a cuotas, cada cuota va en su factura y cuenta como gasto en el mes en que se paga. Tus cuentas cambian cuando pagas la factura.',
  },
  {
    pregunta: '¿Cuándo se registran los programados?',
    respuesta:
      'Se crean al registrar un gasto, un ingreso o una transferencia con «… recurrente» prendido. Al abrir la app (o al volver a ella), cada fecha del mes en curso se crea como un movimiento pendiente; las de los meses siguientes se ven en Planes → Calendario. El iPhone no deja que la app trabaje cerrada, así que no se registran en segundo plano.',
  },
  {
    pregunta: '¿Cómo paso mis datos a otro teléfono?',
    respuesta:
      'En Menú → Importar y exportar toca Copia de seguridad y guarda el archivo (en Archivos, por correo o por WhatsApp). En el otro teléfono, instala la app y usa Restaurar copia con ese archivo.',
  },
  {
    pregunta: '¿Cómo instalo la app en el iPhone?',
    respuesta:
      'Ábrela en Safari, toca el botón Compartir y elige "Añadir a pantalla de inicio". Así se abre a pantalla completa, como cualquier app.',
  },
];

function Pregunta({ pregunta, respuesta }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className={'ayuda-pregunta' + (abierta ? ' abierta' : '')}>
      <button type="button" className="ayuda-pregunta-boton" aria-expanded={abierta} onClick={() => setAbierta((a) => !a)}>
        <span>{pregunta}</span>
        <IconoAbajo />
      </button>
      <div className="ayuda-respuesta">
        <div>
          <p>{conNegritas(respuesta)}</p>
        </div>
      </div>
    </div>
  );
}

export default function Ayuda() {
  return (
    <div>
      <CabeceraSubpagina titulo="Ayuda y soporte" volverA="/mi-espacio" />

      <div className="contenido ayuda-contenido">
        <h2 className="titulo-seccion">Preguntas frecuentes</h2>
        <div className="tarjeta ayuda-tarjeta">
          {PREGUNTAS.map((p) => (
            <Pregunta key={p.pregunta} {...p} />
          ))}
        </div>

        <h2 className="titulo-seccion">Acerca de</h2>
        <div className="tarjeta ayuda-tarjeta ayuda-acerca">
          <span className="icono-circulo ayuda-icono" data-tono="g">
            <IconoInfo tamano={18} />
          </span>
          <div className="ayuda-acerca-textos">
            <div className="ayuda-acerca-titulo">Re-Coin</div>
            <div className="ayuda-acerca-detalle">Versión {__COMPILACION__} · tus datos solo en este teléfono</div>
          </div>
        </div>
      </div>
    </div>
  );
}
