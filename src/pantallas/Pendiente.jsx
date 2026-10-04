// Destino temporal de los botones cuya pantalla aún no está construida.
import { useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';

const TITULOS = {
  perfil: 'Perfil',
  'pantalla-inicio': 'Pantalla de inicio',
  recordatorio: 'Recordatorio diario',
  ajustes: 'Ajustes',
  ayuda: 'Ayuda y soporte',
  busqueda: 'Buscar',
  filtros: 'Filtros',
  'nuevo-presupuesto': 'Nuevo presupuesto',
  'nueva-meta': 'Nueva meta',
  'nuevo-programado': 'Nuevo programado',
  aportar: 'Aportar a la meta',
};

export default function Pendiente() {
  const { pantalla } = useParams();

  return (
    <div>
      <CabeceraSubpagina titulo={TITULOS[pantalla] ?? 'Pendiente'} volverA="/mi-espacio" />
      <div className="contenido">
        <div className="tarjeta" style={{ marginTop: 16, padding: '18px 16px', color: 'var(--muted)', fontSize: 14 }}>
          Esta pantalla todavía no está construida.
        </div>
      </div>
    </div>
  );
}
