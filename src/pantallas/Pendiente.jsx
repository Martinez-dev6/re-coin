// Destino temporal de las filas de Mi espacio cuya pantalla aún no está construida.
import { useParams } from 'react-router-dom';
import CabeceraSubpagina from '../componentes/CabeceraSubpagina.jsx';

const TITULOS = {
  perfil: 'Perfil',
  'pantalla-inicio': 'Pantalla de inicio',
  cuentas: 'Cuentas',
  tarjetas: 'Tarjetas de crédito',
  categorias: 'Categorías',
  etiquetas: 'Etiquetas',
  graficos: 'Gráficos',
  rendimiento: 'Rendimiento',
  'importar-exportar': 'Importar y exportar',
  recordatorio: 'Recordatorio diario',
  ajustes: 'Ajustes',
  ayuda: 'Ayuda y soporte',
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
