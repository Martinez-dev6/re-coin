// Importar y exportar (design/capturas/ImportarExportar.png): exportar los movimientos a Excel y
// a CSV, la copia de seguridad y restaurarla. "Importar desde Excel o CSV" queda para después
// (decisión del dueño, 2026-10-03).
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoBajar, IconoCsv, IconoEscudoCheck, IconoExcel, IconoFlecha, IconoInfo } from '../componentes/iconos.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { exportarCsv, exportarExcel } from '../datos/exportar.js';
import { exportarCopia, leerCopia, leerDatos, restaurarCopia } from '../datos/respaldo.js';
import './ImportarExportar.css';

const plural = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;

// tono: color del ícono en "Predeterminado" (ver comunes.css).
function Fila({ Icono, tono, titulo, detalle, alTocar, ocupado }) {
  return (
    <button type="button" className="respaldo-fila" onClick={alTocar} disabled={ocupado}>
      <span className="icono-circulo grande" data-tono={tono}>
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

  // Excel o CSV de todos los movimientos. Sin esperas antes de compartir (Safari solo deja justo
  // después del toque): los datos ya están leídos.
  const exportarMovimientos = async (exportarComo) => {
    if (!datos?.movimientos?.length) {
      setAviso({ texto: 'Aún no tienes movimientos para exportar.', error: true });
      return;
    }
    setOcupado(true);
    setAviso(null);
    try {
      if (await exportarComo(datos)) setAviso({ texto: 'Archivo listo.' });
    } catch {
      setAviso({ texto: 'No se pudo crear el archivo. Inténtalo de nuevo.', error: true });
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
            Icono={IconoExcel}
            tono="f"
            titulo="Exportar a Excel"
            detalle="Archivo .xlsx con todos tus movimientos"
            alTocar={() => exportarMovimientos(exportarExcel)}
            ocupado={ocupado || !datos}
          />
          <Fila
            Icono={IconoCsv}
            tono="b"
            titulo="Exportar a CSV"
            detalle="Para abrir en cualquier hoja de cálculo"
            alTocar={() => exportarMovimientos(exportarCsv)}
            ocupado={ocupado || !datos}
          />
          <Fila
            Icono={IconoEscudoCheck}
            tono="g"
            titulo="Copia de seguridad"
            detalle="Guarda tus cuentas, categorías y movimientos"
            alTocar={exportar}
            ocupado={ocupado || !datos}
          />
        </div>

        <h2 className="titulo-seccion">Importar</h2>
        <div className="tarjeta respaldo-grupo">
          <Fila
            Icono={IconoBajar}
            tono="d"
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
            {plural(resumen.cuentas, 'cuenta', 'cuentas')}, {plural(resumen.categorias, 'categoría', 'categorías')} y{' '}
            {plural(resumen.movimientos, 'movimiento', 'movimientos')}. Lo que
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
