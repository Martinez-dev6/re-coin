import { Route, Routes } from 'react-router-dom';
import Apariencia from './pantallas/Apariencia.jsx';
import MiEspacio from './pantallas/MiEspacio.jsx';
import Pendiente from './pantallas/Pendiente.jsx';
import Provisional from './pantallas/Provisional.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/mi-espacio" element={<MiEspacio />} />
      <Route path="/mi-espacio/apariencia" element={<Apariencia />} />
      <Route path="/pendiente/:pantalla" element={<Pendiente />} />
      <Route path="*" element={<Provisional />} />
    </Routes>
  );
}
