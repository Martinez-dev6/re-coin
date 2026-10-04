// Gráficos en SVG propio (sin librería), como en los diseños: dona por categoría y barras por mes.
// Se tocan: tocar un segmento o una barra muestra su valor (pedido en "Advertencias sobre los
// diseños": los diseños son estáticos). Marcas finas, 2 px de separación entre segmentos y
// esquinas de 4 px arriba en las barras (guía de visualización).
import { cifraCorta, topeDelEje } from '../datos/graficos.js';
import './Graficos.css';

const RADIO = 80;
const GROSOR = 26;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const SEPARACION = 2; // px de fondo entre segmentos

// partes: [{ clave, valor, color, nombre }]. elegida: clave tocada (o null). centro: lo de adentro.
export function Dona({ partes, elegida, alElegir, centro, etiqueta }) {
  const total = partes.reduce((t, p) => t + p.valor, 0);
  let recorrido = 0;
  return (
    <div className="dona">
      <svg viewBox="0 0 200 200" role="img" aria-label={etiqueta}>
        <circle cx="100" cy="100" r={RADIO} className="dona-fondo" strokeWidth={GROSOR} />
        {total > 0 &&
          partes.map((p) => {
            const largo = (p.valor / total) * CIRCUNFERENCIA;
            const visible = partes.length > 1 ? Math.max(0, largo - SEPARACION) : largo;
            const desfase = -recorrido;
            recorrido += largo;
            const apagada = elegida && elegida !== p.clave;
            return (
              <circle
                key={p.clave}
                cx="100"
                cy="100"
                r={RADIO}
                className={'dona-parte' + (apagada ? ' apagada' : '')}
                stroke={p.color}
                strokeWidth={elegida === p.clave ? GROSOR + 4 : GROSOR}
                strokeDasharray={`${visible} ${CIRCUNFERENCIA - visible}`}
                strokeDashoffset={desfase}
                transform="rotate(-90 100 100)"
                onClick={() => alElegir(elegida === p.clave ? null : p.clave)}
              >
                <title>{p.nombre}</title>
              </circle>
            );
          })}
      </svg>
      <div className="dona-centro">{centro}</div>
    </div>
  );
}

const ANCHO = 320;
const ALTO = 150;
const IZQUIERDA = 34; // lugar para las cifras del eje
const ARRIBA = 18; // lugar para la etiqueta de la barra elegida
const ABAJO = 22; // lugar para los meses

// Rectángulo con las esquinas de arriba redondeadas (4 px) y la base recta sobre el eje.
function barra(x, y, ancho, alto) {
  const r = Math.min(4, ancho / 2, alto);
  if (alto <= 0) return '';
  return `M${x},${y + alto} V${y + r} Q${x},${y} ${x + r},${y} H${x + ancho - r} Q${x + ancho},${y} ${x + ancho},${y + r} V${y + alto} Z`;
}

// grupos: [{ clave, etiqueta, valores: [{ valor, color }] }] (una o dos barras por grupo).
// elegido: clave del grupo elegido (se le ve la cifra encima y el mes en negrita).
export function Barras({ grupos, elegido, alElegir, etiqueta }) {
  const maximo = Math.max(0, ...grupos.flatMap((g) => g.valores.map((v) => v.valor)));
  const tope = topeDelEje(maximo);
  const altoUtil = ALTO - ARRIBA - ABAJO;
  const y = (valor) => ARRIBA + altoUtil - (valor / tope) * altoUtil;
  const anchoGrupo = (ANCHO - IZQUIERDA) / grupos.length;
  const porGrupo = grupos[0]?.valores.length ?? 1;
  const anchoBarra = porGrupo === 1 ? Math.min(26, anchoGrupo * 0.55) : Math.min(16, anchoGrupo * 0.3);

  return (
    <svg className="barras" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={etiqueta}>
      {[0, tope / 2, tope].map((guia) => (
        <g key={guia}>
          <line x1={IZQUIERDA} x2={ANCHO} y1={y(guia)} y2={y(guia)} className="barras-guia" />
          <text x={IZQUIERDA - 6} y={y(guia) + 4} className="barras-eje" textAnchor="end">
            {guia === 0 ? '0' : cifraCorta(guia)}
          </text>
        </g>
      ))}
      {grupos.map((g, i) => {
        const centro = IZQUIERDA + anchoGrupo * i + anchoGrupo / 2;
        const totalAncho = anchoBarra * porGrupo + (porGrupo - 1) * 2;
        const esElegido = g.clave === elegido;
        const masAlto = Math.max(...g.valores.map((v) => v.valor));
        return (
          <g key={g.clave} className={'barras-grupo' + (esElegido ? ' elegido' : '')}>
            {g.valores.map((v, j) => {
              const x = centro - totalAncho / 2 + j * (anchoBarra + 2);
              return <path key={j} d={barra(x, y(v.valor), anchoBarra, y(0) - y(v.valor))} fill={v.color} />;
            })}
            {esElegido && porGrupo === 1 && masAlto > 0 && (
              <text x={centro} y={y(masAlto) - 6} className="barras-valor" textAnchor="middle">
                {cifraCorta(masAlto)}
              </text>
            )}
            <text x={centro} y={ALTO - 6} className="barras-mes" textAnchor="middle">
              {g.etiqueta}
            </text>
            {/* Zona para tocar: toda la columna, más grande que la barra. */}
            <rect
              x={centro - anchoGrupo / 2}
              y={0}
              width={anchoGrupo}
              height={ALTO}
              className="barras-toque"
              onClick={() => alElegir(g.clave)}
            >
              <title>{g.etiqueta}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
