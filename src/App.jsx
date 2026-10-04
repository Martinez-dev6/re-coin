import { Navigate, Route, Routes } from 'react-router-dom';
import BarraNavegacion from './componentes/BarraNavegacion.jsx';
import ConPestanas from './componentes/ConPestanas.jsx';
import TransicionPantallas from './componentes/TransicionPantallas.jsx';
import Ajustes from './pantallas/Ajustes.jsx';
import Apariencia from './pantallas/Apariencia.jsx';
import Ayuda from './pantallas/Ayuda.jsx';
import Busqueda from './pantallas/Busqueda.jsx';
import Categorias from './pantallas/Categorias.jsx';
import Cuentas from './pantallas/Cuentas.jsx';
import DetalleMovimiento from './pantallas/DetalleMovimiento.jsx';
import Etiquetas from './pantallas/Etiquetas.jsx';
import Factura from './pantallas/Factura.jsx';
import FormularioCategoria from './pantallas/FormularioCategoria.jsx';
import FormularioCuenta from './pantallas/FormularioCuenta.jsx';
import FormularioEtiqueta from './pantallas/FormularioEtiqueta.jsx';
import FormularioMeta from './pantallas/FormularioMeta.jsx';
import FormularioMovimiento, { FormularioProgramado } from './pantallas/FormularioMovimiento.jsx';
import FormularioPresupuesto from './pantallas/FormularioPresupuesto.jsx';
import FormularioTarjeta from './pantallas/FormularioTarjeta.jsx';
import Graficos from './pantallas/Graficos.jsx';
import ImportarExportar from './pantallas/ImportarExportar.jsx';
import Inicio from './pantallas/Inicio.jsx';
import MiEspacio from './pantallas/MiEspacio.jsx';
import Pendiente from './pantallas/Pendiente.jsx';
import Pendientes from './pantallas/Pendientes.jsx';
import Perfil from './pantallas/Perfil.jsx';
import Planes from './pantallas/Planes.jsx';
import Rendimiento from './pantallas/Rendimiento.jsx';
import Tarjetas from './pantallas/Tarjetas.jsx';
import Transacciones from './pantallas/Transacciones.jsx';

// Si se agrega un formulario, una pantalla sin barra o una pestaña, actualizar también
// FORMULARIOS, SIN_BARRA y PESTANAS en TransicionPantallas.jsx (deciden la animación y si se
// muestra la barra inferior).
export default function App() {
  return (
    <TransicionPantallas barra={<BarraNavegacion />}>
      <Routes>
        {/* Con barra inferior */}
        <Route element={<ConPestanas />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/transacciones" element={<Transacciones />} />
          <Route path="/transacciones/buscar" element={<Busqueda />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/planes/:seccion" element={<Planes />} />
          <Route path="/mi-espacio" element={<MiEspacio />} />
          <Route path="/mi-espacio/apariencia" element={<Apariencia />} />
          <Route path="/mi-espacio/cuentas" element={<Cuentas />} />
          <Route path="/mi-espacio/tarjetas" element={<Tarjetas />} />
          <Route path="/mi-espacio/categorias" element={<Categorias />} />
          <Route path="/mi-espacio/etiquetas" element={<Etiquetas />} />
          <Route path="/mi-espacio/graficos" element={<Graficos />} />
          <Route path="/mi-espacio/rendimiento" element={<Rendimiento />} />
          <Route path="/mi-espacio/importar-exportar" element={<ImportarExportar />} />
          <Route path="/mi-espacio/perfil" element={<Perfil />} />
          <Route path="/mi-espacio/ajustes" element={<Ajustes />} />
          <Route path="/mi-espacio/ayuda" element={<Ayuda />} />
          <Route path="/pendiente/:pantalla" element={<Pendiente />} />
        </Route>

        {/* Sin barra inferior: el detalle de un movimiento y los formularios */}
        <Route path="/movimientos/:id" element={<DetalleMovimiento />} />
        <Route path="/pendientes" element={<Pendientes />} />
        <Route path="/nuevo/:pantalla" element={<FormularioMovimiento />} />
        <Route path="/movimientos/:id/editar" element={<FormularioMovimiento />} />
        <Route path="/cuentas/:id" element={<FormularioCuenta />} />
        <Route path="/categorias/:id" element={<FormularioCategoria />} />
        <Route path="/etiquetas/:id" element={<FormularioEtiqueta />} />
        <Route path="/tarjetas/:id" element={<FormularioTarjeta />} />
        <Route path="/facturas/:tarjetaId/:mes" element={<Factura />} />
        <Route path="/presupuestos/:id" element={<FormularioPresupuesto />} />
        <Route path="/metas/:id" element={<FormularioMeta />} />
        <Route path="/programados/:id" element={<FormularioProgramado />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransicionPantallas>
  );
}
