// Destino temporal de los botones cuya pantalla aún no está construida.
import { useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';

const TITULOS = {
  perfil: 'Perfil',
  'pantalla-inicio': 'Pantalla de inicio',
  tarjetas: 'Tarjetas de crédito',
  etiquetas: 'Etiquetas',
  graficos: 'Gráficos',
  rendimiento: 'Rendimiento',
  recordatorio: 'Recordatorio diario',
  ajustes: 'Ajustes',
  ayuda: 'Ayuda y soporte',
  busqueda: 'Buscar',
  filtros: 'Filtros',
  'nuevo-presupuesto': 'Nuevo presupuesto',
  'nueva-meta': 'Nueva meta',
  'nuevo-programado': 'Nuevo programado',
  aportar: 'Aportar a la meta',
  // Formularios del menú "+" (ruta /nuevo/…)
  ingreso: 'Nuevo ingreso',
  gasto: 'Nuevo gasto',
  'gasto-tarjeta': 'Gasto con tarjeta',
  transferencia: 'Nueva transferencia',
};

export default function Pendiente({ formulario = false }) {
  const { pantalla } = useParams();

  return (
    <div>
      <CabeceraSubpagina titulo={TITULOS[pantalla] ?? 'Pendiente'} volverA={formulario ? '/' : '/mi-espacio'} />
      <div className="contenido">
        <div className="tarjeta" style={{ marginTop: 16, padding: '18px 16px', color: 'var(--muted)', fontSize: 14 }}>
          Esta pantalla todavía no está construida.
        </div>
      </div>
    </div>
  );
}
