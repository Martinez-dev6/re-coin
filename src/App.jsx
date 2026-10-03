import { Navigate, Route, Routes } from 'react-router-dom';
import ConPestanas from './componentes/ConPestanas.jsx';
import Apariencia from './pantallas/Apariencia.jsx';
import Inicio from './pantallas/Inicio.jsx';
import MiEspacio from './pantallas/MiEspacio.jsx';
import Pendiente from './pantallas/Pendiente.jsx';
import Planes from './pantallas/Planes.jsx';
import Transacciones from './pantallas/Transacciones.jsx';

export default function App() {
  return (
    <Routes>
      {/* Con barra inferior */}
      <Route element={<ConPestanas />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/transacciones" element={<Transacciones />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/planes/:seccion" element={<Planes />} />
        <Route path="/mi-espacio" element={<MiEspacio />} />
        <Route path="/mi-espacio/apariencia" element={<Apariencia />} />
        <Route path="/pendiente/:pantalla" element={<Pendiente />} />
      </Route>

      {/* Formularios: sin barra inferior */}
      <Route path="/nuevo/:pantalla" element={<Pendiente formulario />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
