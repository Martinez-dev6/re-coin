// DATOS DE PRUEBA (paso 3): inventados, solo para ver las pestañas con contenido.
// Tienen la forma del modelo de datos previsto para que reemplazarlos por la base de
// datos (Dexie, pasos 4–7) cambie el origen y no las pantallas.

export const CUENTAS = [
  { id: 'c1', nombre: 'Cuenta bancaria', tipo: 'banco', saldo: 912400 },
  { id: 'c2', nombre: 'Billetera digital', tipo: 'billetera', saldo: 358900 },
  { id: 'c3', nombre: 'Efectivo', tipo: 'efectivo', saldo: 13000 },
];

// color: letra del par --cat-X / --cat-X-soft del tema; null = gris neutro.
export const CATEGORIAS = {
  alimentos: { nombre: 'Alimentos', icono: 'carrito', color: 'b' },
  transporte: { nombre: 'Transporte', icono: 'gasolina', color: 'a' },
  educacion: { nombre: 'Educación', icono: 'libro', color: 'c' },
  servicios: { nombre: 'Servicios', icono: 'rayo', color: 'd' },
  otros: { nombre: 'Otros', icono: 'cuadricula', color: null },
  trabajo: { nombre: 'Trabajo', icono: 'ingreso', color: null },
};

// tipo: 'gasto' | 'ingreso' | 'transferencia'. fecha: AAAA-MM-DD.
// Solo movimientos ya ocurridos: los programados futuros viven en PROGRAMADOS y se
// vuelven movimientos al llegar su fecha (se calcula al abrir la app, paso 7).
export const MOVIMIENTOS = [
  { id: 'm1', tipo: 'gasto', valor: 30000, descripcion: 'Mercado', categoriaId: 'alimentos', cuentaId: 'c2', fecha: '2026-10-02', pagado: false, programado: true },
  { id: 'm2', tipo: 'gasto', valor: 50000, descripcion: 'Gasolina', categoriaId: 'transporte', cuentaId: 'c2', fecha: '2026-10-02', pagado: false, programado: true },
  { id: 'm3', tipo: 'gasto', valor: 66300, descripcion: 'Curso en línea', categoriaId: 'educacion', cuentaId: 'c1', fecha: '2026-10-01', pagado: true },
  { id: 'm4', tipo: 'gasto', valor: 288800, descripcion: 'Internet y celular', categoriaId: 'servicios', cuentaId: 'c1', fecha: '2026-10-01', pagado: true },
  { id: 'm5', tipo: 'gasto', valor: 39700, descripcion: 'Mercado', categoriaId: 'alimentos', cuentaId: 'c2', fecha: '2026-10-01', pagado: true },
  { id: 'm6', tipo: 'ingreso', valor: 2680000, descripcion: 'Salario', categoriaId: 'trabajo', cuentaId: 'c1', fecha: '2026-10-01', pagado: true },
  { id: 'm7', tipo: 'transferencia', valor: 100000, descripcion: 'A la billetera', cuentaId: 'c1', cuentaDestinoId: 'c2', fecha: '2026-10-01', pagado: true },
  { id: 'm8', tipo: 'ingreso', valor: 250000, descripcion: 'Pago de cliente', categoriaId: 'trabajo', cuentaId: 'c1', fecha: '2026-10-03', pagado: false },
  { id: 'm10', tipo: 'gasto', valor: 50000, descripcion: 'Gasolina', categoriaId: 'transporte', cuentaId: 'c2', fecha: '2026-09-30', pagado: true, programado: true },
  { id: 'm11', tipo: 'gasto', valor: 42000, descripcion: 'Mercado', categoriaId: 'alimentos', cuentaId: 'c2', fecha: '2026-09-28', pagado: true },
  { id: 'm12', tipo: 'ingreso', valor: 2680000, descripcion: 'Salario', categoriaId: 'trabajo', cuentaId: 'c1', fecha: '2026-09-01', pagado: true },
];

// Presupuestos del mes (octubre 2026). "gastado" va fijo para mostrar todos los estados
// (al día, casi al límite, excedido); en el paso 7 se calculará con los movimientos.
export const PRESUPUESTOS = [
  { id: 'p1', categoriaId: 'alimentos', limite: 650000, gastado: 521400 },
  { id: 'p2', categoriaId: 'transporte', limite: 500000, gastado: 480000 },
  { id: 'p3', categoriaId: 'servicios', limite: 280000, gastado: 288800 },
  { id: 'p4', categoriaId: 'educacion', limite: 300000, gastado: 66300 },
  { id: 'p5', categoriaId: 'otros', limite: 700000, gastado: 479200 },
];

export const METAS = [
  { id: 'g1', nombre: 'Fondo de emergencia', icono: 'escudo', color: 'b', objetivo: 3000000, ahorrado: 1200000, fechaLimite: '2027-06-30' },
  { id: 'g2', nombre: 'Laptop nueva', icono: 'portatil', color: 'c', objetivo: 2000000, ahorrado: 800000, fechaLimite: '2026-12-31' },
  { id: 'g3', nombre: 'Viaje', icono: 'avion', color: 'a', objetivo: 1500000, ahorrado: 150000, fechaLimite: '2027-03-31' },
];

// Movimientos programados: próxima fecha y frecuencia.
export const PROGRAMADOS = [
  { id: 'r1', tipo: 'gasto', valor: 30000, descripcion: 'Mercado', categoriaId: 'alimentos', proxima: '2026-10-02', frecuencia: 'semana', pagado: false },
  { id: 'r2', tipo: 'gasto', valor: 50000, descripcion: 'Gasolina', categoriaId: 'transporte', proxima: '2026-10-02', frecuencia: 'semana', pagado: false },
  { id: 'r3', tipo: 'ingreso', valor: 440000, descripcion: 'Ingreso freelance', categoriaId: 'trabajo', proxima: '2026-10-15', frecuencia: 'mes' },
  { id: 'r4', tipo: 'gasto', valor: 66300, descripcion: 'Curso en línea', categoriaId: 'educacion', proxima: '2026-10-28', frecuencia: 'mes' },
];
