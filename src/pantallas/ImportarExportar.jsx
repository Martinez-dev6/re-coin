// Importar y exportar (design/capturas/ImportarExportar.png). Por ahora solo la copia de
// seguridad y restaurarla; Excel y CSV llegan en el paso 8.
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoBajar, IconoEscudoCheck, IconoFlecha, IconoInfo } from '../componentes/iconos.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { exportarCopia, leerCopia, leerDatos, restaurarCopia } from '../datos/respaldo.js';
import './ImportarExportar.css';

const plural = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;

function Fila({ Icono, titulo, detalle, alTocar, ocupado }) {
  return (
    <button type="button" className="respaldo-fila" onClick={alTocar} disabled={ocupado}>
      <span className="icono-circulo grande">
        <Icono />
      </span>
      <span className="respaldo-textos">
        <span className="respaldo-titulo">{titulo}</span>
        <span className="respaldo-detalle">{detalle}</span>
      </span>
      <span className="respaldo-flecha">
        <IconoFlecha />
      </span>
    </button>
  );
}

export default function ImportarExportar() {
  const archivo = useRef(null);
  const datos = useLiveQuery(leerDatos);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null); // { texto, error }
  const [porRestaurar, setPorRestaurar] = useState(null); // { copia, resumen }

  const exportar = async () => {
    setOcupado(true);
    setAviso(null);
    try {
      if (await exportarCopia(datos)) setAviso({ texto: 'Copia lista. Guárdala fuera del teléfono (Archivos, iCloud, correo…).' });
    } catch {
      setAviso({ texto: 'No se pudo crear la copia. Inténtalo de nuevo.', error: true });
    } finally {
      setOcupado(false);
    }
  };

  const elegirArchivo = async (evento) => {
    const elegido = evento.target.files?.[0];
    evento.target.value = ''; // para poder elegir el mismo archivo otra vez
    if (!elegido) return;
    setAviso(null);
    try {
      setPorRestaurar(await leerCopia(elegido));
    } catch (error) {
      setAviso({ texto: error.message, error: true });
    }
  };

  const restaurar = async () => {
    const { copia } = porRestaurar;
    setPorRestaurar(null);
    setOcupado(true);
    try {
      await restaurarCopia(copia);
      setAviso({ texto: 'Copia restaurada.' });
    } catch {
      setAviso({ texto: 'No se pudo restaurar. Tus datos no cambiaron.', error: true });
    } finally {
      setOcupado(false);
    }
  };

  const resumen = porRestaurar?.resumen;

  return (
    <div>
      <CabeceraSubpagina titulo="Importar y exportar" volverA="/mi-espacio" />

      <div className="contenido">
        <h2 className="titulo-seccion">Exportar</h2>
        <div className="tarjeta respaldo-grupo">
          <Fila
            Icono={IconoEscudoCheck}
            titulo="Copia de seguridad"
            detalle="Guarda tus cuentas y categorías"
            alTocar={exportar}
            ocupado={ocupado || !datos}
          />
        </div>

        <h2 className="titulo-seccion">Importar</h2>
        <div className="tarjeta respaldo-grupo">
          <Fila
            Icono={IconoBajar}
            titulo="Restaurar copia"
            detalle="Reemplaza los datos actuales"
            alTocar={() => archivo.current?.click()}
            ocupado={ocupado}
          />
        </div>
        <input ref={archivo} type="file" accept=".json,application/json" hidden onChange={elegirArchivo} />

        <p className="respaldo-nota">
          <IconoInfo />
          <span>Restaurar una copia reemplaza lo que tengas ahora. Haz una copia antes.</span>
        </p>

        {aviso && (
          <p key={aviso.texto} className={'respaldo-aviso' + (aviso.error ? ' error' : '')} role="status">
            {aviso.texto}
          </p>
        )}
      </div>

      <PanelInferior abierto={Boolean(porRestaurar)} alCerrar={() => setPorRestaurar(null)} titulo="¿Restaurar la copia?">
        {resumen && (
          <p className="panel-texto">
            Copia del {resumen.creada.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} con{' '}
            {plural(resumen.cuentas, 'cuenta', 'cuentas')} y {plural(resumen.categorias, 'categoría', 'categorías')}. Lo que
            tienes ahora en el teléfono se reemplaza.
          </p>
        )}
        <button type="button" className="boton-peligro" onClick={restaurar}>
          Restaurar
        </button>
        <button type="button" className="boton-secundario" onClick={() => setPorRestaurar(null)}>
          Cancelar
        </button>
      </PanelInferior>
    </div>
  );
}
