// Aviso de copia de seguridad arriba en Inicio (cuándo sale: avisoDeCopia en respaldo.js).
// "Hacer copia" abre el menú de compartir ahí mismo; al hacerla o al tocar "Ahora no", la
// tarjeta se encoge y se va.
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useDatos } from '../datos/DatosContext.jsx';
import { avisoDeCopia, exportarCopia, leerDatos, posponerAvisoCopia } from '../datos/respaldo.js';
import { useAjustes } from '../estado/ajustes.js';
import { IconoEscudoCheck } from './iconos.jsx';
import './AvisoCopia.css';

const SALIDA_MS = 320; // igual que la transición de .aviso-copia en AvisoCopia.css

const plural = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;

export default function AvisoCopia() {
  const { movimientos } = useDatos();
  const aviso = avisoDeCopia(movimientos, useAjustes());
  // Mientras se encoge sigue mostrando lo último que dijo.
  const ultimo = useRef(aviso);
  if (aviso) ultimo.current = aviso;
  const [saliendo, setSaliendo] = useState(false);

  if (!aviso && !saliendo) return null;
  return <Tarjeta aviso={aviso ?? ultimo.current} saliendo={saliendo} setSaliendo={setSaliendo} />;
}

// Aparte para leer todos los datos (y tenerlos listos para compartir sin esperas: Safari solo
// abre el menú justo después del toque) únicamente mientras el aviso se ve.
function Tarjeta({ aviso, saliendo, setSaliendo }) {
  const datos = useLiveQuery(leerDatos);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  // Primero se encoge; al terminar se guarda el cambio que lo quita.
  const irse = (alTerminar) => {
    setSaliendo(true);
    setTimeout(() => {
      alTerminar?.();
      setSaliendo(false);
    }, SALIDA_MS);
  };

  const copiar = async () => {
    setOcupado(true);
    setError(false);
    try {
      // exportarCopia guarda la fecha de la copia: el aviso deja de tocar. Se mantiene en
      // pantalla mientras se encoge (ver AvisoCopia).
      if (await exportarCopia(datos)) irse();
    } catch {
      setError(true);
    } finally {
      setOcupado(false);
    }
  };

  const texto =
    aviso.dias === null
      ? 'Aún no tienes ninguna copia. Si borras la app o cambias de iPhone, tus datos se pierden.'
      : `Tu última copia fue hace ${plural(aviso.dias, 'día', 'días')} y desde entonces registraste ${plural(aviso.nuevos, 'movimiento', 'movimientos')}.`;

  return (
    <div className={'aviso-copia' + (saliendo ? ' saliendo' : '')} inert={saliendo || undefined}>
      <div className="aviso-copia-interior">
        <div className="tarjeta aviso-copia-tarjeta">
          <div className="aviso-copia-cabeza">
            <span className="icono-circulo grande" data-tono="g">
              <IconoEscudoCheck />
            </span>
            <div className="aviso-copia-textos">
              <h2 className="aviso-copia-titulo">Haz una copia de seguridad</h2>
              <p className="aviso-copia-texto">{texto}</p>
              {error && <p className="aviso-copia-error">No se pudo crear la copia. Inténtalo de nuevo.</p>}
            </div>
          </div>
          <div className="aviso-copia-botones">
            <button type="button" className="aviso-copia-ahora-no" onClick={() => irse(posponerAvisoCopia)}>
              Ahora no
            </button>
            <button type="button" className="aviso-copia-hacer" onClick={copiar} disabled={ocupado || !datos}>
              Hacer copia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
