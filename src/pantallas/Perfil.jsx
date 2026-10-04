// Perfil (design/html/Perfil.html): nombre y foto, guardados en el teléfono (estado/ajustes.js).
// Sin correo: mientras todo se guarde solo en este teléfono no tendría ningún uso. Llegará con
// la sincronización.
import { useRef, useState } from 'react';
import Avatar from '../componentes/Avatar.jsx';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';
import { IconoBasura, IconoCamara, IconoInfo, IconoPerfil, IconoSincronizar } from '../componentes/iconos.jsx';
import PanelInferior from '../componentes/PanelInferior.jsx';
import { cambiarAjustes, prepararFoto, useAjustes } from '../estado/ajustes.js';
import './Perfil.css';

export default function Perfil() {
  const { nombre, foto } = useAjustes();
  const [panelFoto, setPanelFoto] = useState(false);
  const [error, setError] = useState('');
  const selector = useRef(null);

  const elegirFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ''; // para poder elegir la misma otra vez
    if (!archivo) return;
    try {
      const lista = await prepararFoto(archivo);
      setError(cambiarAjustes({ foto: lista }) ? '' : 'No se pudo guardar la foto en el teléfono.');
    } catch {
      setError('No se pudo leer esa imagen. Prueba con otra.');
    }
  };

  // Sin foto, el toque abre directo el selector del iPhone (debe ser dentro del toque).
  const tocarFoto = () => (foto ? setPanelFoto(true) : selector.current?.click());

  return (
    <div>
      <CabeceraSubpagina titulo="Perfil" volverA="/mi-espacio">
        <div className="perfil-cabecera">
          <button type="button" className="perfil-foto" aria-label={foto ? 'Cambiar foto' : 'Agregar foto'} onClick={tocarFoto}>
            <Avatar tamano={84} />
            <span className="perfil-camara">
              <IconoCamara />
            </span>
          </button>
          <div className="perfil-nombre">{nombre.trim() || 'Tu nombre'}</div>
        </div>
      </CabeceraSubpagina>

      <input ref={selector} type="file" accept="image/*" hidden onChange={elegirFoto} />

      <div className="contenido perfil-contenido">
        {error && <p className="perfil-error">{error}</p>}

        <div className="tarjeta perfil-tarjeta">
          <label className="perfil-fila">
            <span className="icono-circulo perfil-icono" data-tono="g">
              <IconoPerfil tamano={18} />
            </span>
            <span className="perfil-fila-etiqueta">Nombre</span>
            <input
              className="perfil-entrada"
              value={nombre}
              placeholder="Escribe tu nombre"
              maxLength={40}
              autoComplete="name"
              enterKeyHint="done"
              onChange={(evento) => cambiarAjustes({ nombre: evento.target.value })}
              onBlur={() => cambiarAjustes({ nombre: nombre.trim() })}
              onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
            />
          </label>
        </div>

        <h2 className="titulo-seccion">Tus datos</h2>
        <div className="tarjeta perfil-tarjeta">
          <div className="perfil-fila perfil-fila-alta">
            <span className="icono-circulo grande" data-tono="b">
              <IconoSincronizar />
            </span>
            <span className="perfil-fila-textos">
              <span className="perfil-fila-titulo">Sincronizar dispositivos</span>
              <span className="perfil-fila-detalle">Usar la app en varios equipos</span>
            </span>
            <span className="perfil-fila-valor">Próximamente</span>
          </div>
        </div>
        <p className="perfil-nota">
          <IconoInfo />
          Por ahora todo se guarda en este teléfono. Haz una copia de seguridad desde Importar y exportar.
        </p>
      </div>

      <PanelInferior abierto={panelFoto} alCerrar={() => setPanelFoto(false)} titulo="Foto">
        <button
          type="button"
          className="panel-opcion"
          onClick={() => {
            setPanelFoto(false);
            selector.current?.click();
          }}
        >
          <span className="icono-circulo grande" data-tono="c">
            <IconoCamara tamano={20} />
          </span>
          <span className="panel-opcion-textos">
            <span className="panel-opcion-titulo">Cambiar foto</span>
          </span>
        </button>
        <button
          type="button"
          className="panel-opcion"
          onClick={() => {
            cambiarAjustes({ foto: null });
            setPanelFoto(false);
          }}
        >
          <span className="icono-circulo grande perfil-icono-quitar">
            <IconoBasura tamano={20} />
          </span>
          <span className="panel-opcion-textos">
            <span className="panel-opcion-titulo perfil-quitar">Quitar foto</span>
          </span>
        </button>
      </PanelInferior>
    </div>
  );
}
