import { Navigate, Route, Routes } from 'react-router-dom';
import ConPestanas from './componentes/ConPestanas.jsx';
import Apariencia from './pantallas/Apariencia.jsx';
import Categorias from './pantallas/Categorias.jsx';
import Cuentas from './pantallas/Cuentas.jsx';
import FormularioCategoria from './pantallas/FormularioCategoria.jsx';
import FormularioCuenta from './pantallas/FormularioCuenta.jsx';
import ImportarExportar from './pantallas/ImportarExportar.jsx';
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
        <Route path="/mi-espacio/cuentas" element={<Cuentas />} />
        <Route path="/mi-espacio/categorias" element={<Categorias />} />
        <Route path="/mi-espacio/importar-exportar" element={<ImportarExportar />} />
        <Route path="/pendiente/:pantalla" element={<Pendiente />} />
      </Route>

      {/* Formularios: sin barra inferior */}
      <Route path="/nuevo/:pantalla" element={<Pendiente formulario />} />
      <Route path="/cuentas/:id" element={<FormularioCuenta />} />
      <Route path="/categorias/:id" element={<FormularioCategoria />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
