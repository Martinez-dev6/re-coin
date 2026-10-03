// Pesos colombianos: "$ 1.284.300" (punto de miles, sin decimales).
// Se arma a mano y no con Intl porque en español Intl no agrupa los números de 4 cifras
// ("1500" en vez de "1.500").
export function formatearPesos(valor) {
  const entero = Math.round(Math.abs(valor));
  const conPuntos = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (valor < 0 && entero !== 0 ? '-' : '') + '$ ' + conPuntos;
}
