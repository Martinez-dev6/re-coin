// Pantalla temporal del paso 1: sirve para comprobar en el iPhone la zona segura,
// la fuente y el modo instalado. Se reemplaza por Inicio en el paso 3.
import { useEffect, useState } from 'react';
import BarraEstado from '../componentes/BarraEstado.jsx';
import './Provisional.css';

function medirZonaSegura() {
  const sonda = document.createElement('div');
  sonda.style.cssText =
    'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(sonda);
  const estilo = getComputedStyle(sonda);
  const valores = { arriba: parseFloat(estilo.paddingTop), abajo: parseFloat(estilo.paddingBottom) };
  sonda.remove();
  return valores;
}

function estaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function Provisional() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const actualizar = () => setInfo({ ...medirZonaSegura(), instalada: estaInstalada() });
    actualizar();
    window.addEventListener('resize', actualizar);
    return () => window.removeEventListener('resize', actualizar);
  }, []);

  return (
    <div className="provisional">
      <BarraEstado color="var(--banner-bg)" />
      <header className="provisional-banner">
        <div className="provisional-fila">
          <span className="provisional-titulo">Sendo</span>
        </div>
        <p className="provisional-etiqueta">Saldo actual en cuentas</p>
        <p className="provisional-saldo">$ 0</p>
      </header>

      <main className="provisional-contenido">
        <section className="provisional-tarjeta">
          <h2>Paso 1: base del proyecto</h2>
          <p>Pantalla provisional. Sirve para revisar la zona segura y la fuente en el iPhone.</p>
          {info && (
            <dl>
              <dt>Zona segura arriba</dt>
              <dd>{info.arriba} px</dd>
              <dt>Zona segura abajo</dt>
              <dd>{info.abajo} px</dd>
              <dt>Abierta como</dt>
              <dd>{info.instalada ? 'App instalada' : 'Navegador'}</dd>
              <dt>Versión</dt>
              <dd>{__COMPILACION__}</dd>
            </dl>
          )}
        </section>
      </main>
    </div>
  );
}
