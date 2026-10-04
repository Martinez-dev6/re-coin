// Foto del perfil, o sus iniciales, o el ícono de persona si aún no hay nombre.
// Va sobre el banner (Inicio, Mi espacio, Perfil): fondo translúcido del banner.
import { iniciales, useAjustes } from '../estado/ajustes.js';
import { IconoPerfil } from './iconos.jsx';
import './Avatar.css';

export default function Avatar({ tamano = 44, className = '' }) {
  const { nombre, foto } = useAjustes();
  const letras = iniciales(nombre);
  return (
    <span
      className={'avatar ' + className}
      style={{ width: tamano, height: tamano, fontSize: Math.round(tamano / 3) }}
      aria-hidden="true"
    >
      {foto ? <img src={foto} alt="" /> : letras || <IconoPerfil tamano={Math.round(tamano * 0.45)} />}
    </span>
  );
}
