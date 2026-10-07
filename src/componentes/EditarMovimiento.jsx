// Editar un movimiento en una ventana flotante sobre su detalle (pedido del dueño, Sesión 9: primero
// solo transferencias, luego todos). Gasto, ingreso, transferencia y gasto con tarjeta, con las mismas
// filas y paneles del formulario (CamposMovimiento.jsx), sin el corazón de favoritos, sin "Gasto
// recurrente" y sin las opciones "Nueva…". La hora solo sale si el movimiento la tiene (en su fecha de
// siempre la conserva; con la fecha de hoy, "Ahora"; otro día, sin hora). Al cambiar la fecha, Pagado
// y la factura no cambian solos. Guardar lleva la animación de "listo" (BotonExito) y después se
// cierra.
// movimiento: el que se edita; se queda mientras la ventana se va.
import { useEffect, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { mismosDatos } from '../utilidades/sinCambios.js';
import { faltante, guardarMovimiento, horaDe } from '../datos/movimientos.js';
import { cambiaLaSerie, editarEnSerie } from '../datos/programados.js';
import { diaYMes, horaActual, hoyTexto, textoHora } from '../utilidades/fechas.js';
import BotonExito from './BotonExito.jsx';
import { FilasMovimiento, PanelesMovimiento } from './CamposMovimiento.jsx';
import { Campo, EntradaHora, MontoEditable } from './Formulario.jsx';
import { IconoCheck, IconoReloj } from './iconos.jsx';
import PanelInferior from './PanelInferior.jsx';
import VentanaFlotante from './VentanaFlotante.jsx';

const IconoHora = (p) => <IconoReloj tamano={18} grosor={2} {...p} />;

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
  const { programados } = useDatos();
  const [datos, setDatos] = useState(() => desde(m));
  // De un programado que sigue existiendo: al guardar un cambio que comparte con la serie, se
  // pregunta a cuáles aplicarlo (Sesión 9, pedido del dueño), como al eliminar.
  const enSerie = Boolean(m.programadoId && programados.some((p) => p.id === m.programadoId));
  const [modoSerie, setModoSerie] = useState('solo');
  // Los de CamposMovimiento o 'serie'.
  const [panel, setPanel] = useState(null);
  const [aviso, setAviso] = useState(null);
  const cambiar = (cambios) => setDatos((d) => ({ ...d, ...cambios }));
  const { tipo } = datos;
  const conTarjeta = tipo === 'gastoTarjeta';
  const [titulo, textoGuardar] = TITULOS[tipo] ?? TITULOS.gasto;

  // Cada vez que se abre, parte del movimiento como está guardado.
  useEffect(() => {
    if (!abierto) return;
    setDatos(desde(m));
    setAviso(null);
    setModoSerie('solo');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo al abrir.
  }, [abierto]);

  const cambiarFecha = (fecha) =>
    cambiar({ fecha, hora: fecha === m.fecha ? horaDe(m) : fecha === hoyTexto() ? 'ahora' : null });

  const guardar = () => {
    const falta = faltante(datos);
    if (falta) {
      setAviso(falta.texto);
      if (falta.campo !== 'valor') setPanel(falta.campo === 'categoriaId' ? 'categoria' : falta.campo);
      return false;
    }
    setAviso(null);
    if (enSerie && cambiaLaSerie(m, datos)) {
      setPanel('serie');
      return false;
    }
    return guardarMovimiento(m.id, datos);
  };
  const OPCIONES_SERIE = [
    { valor: 'solo', titulo: 'Solo este', detalle: `El del ${diaYMes(m.fecha)}. Los demás quedan igual.` },
    {
      valor: 'siguientes',
      titulo: 'Este y los siguientes',
      detalle: 'También los que vienen y aún no se pagan, y lo que se registre después.',
    },
    { valor: 'todos', titulo: 'Toda la serie', detalle: 'Todos los que aún no se pagan, también los de antes. Lo pagado no cambia.' },
  ];

  const campos = { datos, setDatos, panel, setPanel };

  return (
    <>
      <VentanaFlotante
        abierto={abierto}
        alCerrar={alCerrar}
        titulo={titulo}
        tono={conTarjeta ? 'gasto' : tipo}
        arriba={<MontoEditable etiqueta="Valor" valor={datos.valor} alCambiar={(valor) => cambiar({ valor })} />}
      >
        <FilasMovimiento
          {...campos}
          cambiarFecha={cambiarFecha}
          despuesDeFecha={
            datos.hora && (
              <Campo Icono={IconoHora} etiqueta="Hora">
                <EntradaHora
                  valor={datos.hora === 'ahora' ? horaActual() : datos.hora}
                  texto={datos.hora === 'ahora' ? 'Ahora' : textoHora(datos.hora)}
                  alCambiar={(hora) => cambiar({ hora })}
                />
              </Campo>
            )
          }
        />
        {aviso && (
          <p key={aviso} className="movimiento-aviso" role="status">
            {aviso}
          </p>
        )}
        <BotonExito
          className={'boton-principal guardar-' + (conTarjeta ? 'gasto' : tipo)}
          disabled={mismosDatos(datos, desde(m))}
          alTocar={guardar}
          alTerminar={alCerrar}
        >
          {textoGuardar}
        </BotonExito>
      </VentanaFlotante>

      {/* ¿A cuáles aplicar el cambio? Solo si es de una serie y cambió algo que comparte con ella. */}
      <PanelInferior abierto={panel === 'serie'} alCerrar={() => setPanel(null)} titulo="Se repite: ¿a cuáles aplicar el cambio?">
        <div role="radiogroup" aria-label="A cuáles aplicar el cambio" className="eliminar-programado">
          {OPCIONES_SERIE.map((o) => {
            const marcada = o.valor === modoSerie;
            return (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={marcada}
                className="panel-opcion eliminar-programado-opcion"
                onClick={() => setModoSerie(o.valor)}
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
          className={'boton-principal guardar-' + (conTarjeta ? 'gasto' : tipo)}
          alTocar={() => editarEnSerie(m, datos, modoSerie)}
          alTerminar={() => {
            setPanel(null);
            alCerrar();
          }}
        >
          Guardar
        </BotonExito>
      </PanelInferior>

      {/* Paneles de elección: encima de la ventana (se montan después, así quedan arriba). */}
      <PanelesMovimiento {...campos} />
    </>
  );
}
