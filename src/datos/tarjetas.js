// Tarjetas de crédito: facturas, cuotas, cupo usado y guardado.
// Decidido por el dueño (2026-10-03):
// - Un gasto con tarjeta no toca las cuentas: suma a las facturas de la tarjeta. Las cuentas
//   cambian solo al pagar una factura (movimiento 'pagoTarjeta', que resta de la cuenta).
// - Cada cuota va en su factura: $ 300.000 en 3 cuotas = $ 100.000 en 3 facturas seguidas.
// - Cambiado el mismo día, tras probarlo: cada cuota cuenta como gasto en el mes en que se paga
//   su factura (y está pendiente hasta pagarla), no en el mes de la compra. Ver cuotasComoGastos.
// Una factura se nombra por el mes en que se paga: 'AAAA-MM'.
import { aFecha, diasHasta, horaActual, hoyTexto, MESES, sumarMeses } from '../utilidades/fechas.js';
import { db, nuevoId, ordenAlFinal } from './db.js';

export { sumarMeses };

const dos = (n) => String(n).padStart(2, '0');

// "Octubre" (o "Enero 2027" si no es de este año).
export function nombreFactura(mes) {
  const [anio, m] = mes.split('-').map(Number);
  const nombre = MESES[m - 1].charAt(0).toUpperCase() + MESES[m - 1].slice(1);
  return anio === new Date().getFullYear() ? nombre : `${nombre} ${anio}`;
}

const diasDelMes = (anio, mes) => new Date(anio, mes, 0).getDate();

// Factura a la que va una compra hecha en 'fecha' (el mes en que se paga). Entra en el corte que
// cierra ese mes si fue hasta el día de cierre, si no en el siguiente; ese corte se paga el mismo
// mes si el día de pago va después del cierre, si no el mes siguiente.
export function facturaDeFecha(tarjeta, fecha) {
  const d = aFecha(fecha);
  const cierre = Math.min(tarjeta.diaCierre, diasDelMes(d.getFullYear(), d.getMonth() + 1));
  const mes = fecha.slice(0, 7);
  const mesCierre = d.getDate() <= cierre ? mes : sumarMeses(mes, 1);
  return tarjeta.diaPago > tarjeta.diaCierre ? mesCierre : sumarMeses(mesCierre, 1);
}

// Día en que vence la factura de 'mes' ('AAAA-MM-DD'): el día de pago de ese mes (o el último
// día, si el mes es más corto).
export function fechaPagoFactura(tarjeta, mes) {
  const [anio, m] = mes.split('-').map(Number);
  return `${mes}-${dos(Math.min(tarjeta.diaPago, diasDelMes(anio, m)))}`;
}

// Día en que cerró (o cierra) el corte de la factura de 'mes': ese mes si el pago va después del
// cierre, si no el mes anterior.
export function fechaCierreFactura(tarjeta, mes) {
  const mesCierre = tarjeta.diaPago > tarjeta.diaCierre ? mes : sumarMeses(mes, -1);
  const [anio, m] = mesCierre.split('-').map(Number);
  return `${mesCierre}-${dos(Math.min(tarjeta.diaCierre, diasDelMes(anio, m)))}`;
}

// Cuándo vence una factura: "23 días", "Mañana", "Hoy" o "Vencida".
export function textoVence(tarjeta, mes) {
  const dias = diasHasta(fechaPagoFactura(tarjeta, mes));
  if (dias > 1) return `${dias} días`;
  if (dias === 1) return 'Mañana';
  if (dias === 0) return 'Hoy';
  return 'Vencida';
}

// Cuotas de una compra: [{ mes, valor, numero }]. Lo que no da exacto va en la primera.
export function cuotasDe(m) {
  const n = Math.max(1, m.cuotas ?? 1);
  const base = Math.floor(m.valor / n);
  return Array.from({ length: n }, (_, i) => ({
    mes: sumarMeses(m.factura, i),
    valor: base + (i === 0 ? m.valor - base * n : 0),
    numero: i + 1,
  }));
}

// Estado de cada tarjeta a partir de los movimientos:
// { usado, facturas: Map(mes → { mes, total, pagado, cuotas: [{ movimiento, numero, valor }], pagos }) }
export function resumenTarjetas(tarjetas, movimientos) {
  const resumen = new Map(tarjetas.map((t) => [t.id, { usado: 0, facturas: new Map() }]));
  const factura = (tarjetaId, mes) => {
    const facturas = resumen.get(tarjetaId)?.facturas;
    if (!facturas) return null;
    if (!facturas.has(mes)) facturas.set(mes, { mes, total: 0, pagado: 0, cuotas: [], pagos: [] });
    return facturas.get(mes);
  };
  for (const m of movimientos) {
    if (m.tipo === 'gastoTarjeta') {
      for (const cuota of cuotasDe(m)) {
        const f = factura(m.tarjetaId, cuota.mes);
        if (!f) continue;
        f.total += cuota.valor;
        f.cuotas.push({ movimiento: m, numero: cuota.numero, valor: cuota.valor });
      }
    } else if (m.tipo === 'pagoTarjeta') {
      const f = factura(m.tarjetaId, m.factura);
      if (!f) continue;
      f.pagado += m.valor;
      f.pagos.push(m);
    }
  }
  for (const r of resumen.values()) {
    for (const f of r.facturas.values()) r.usado += Math.max(0, f.total - f.pagado);
  }
  return resumen;
}

// Cada compra con tarjeta como una línea por cuota, con fecha del día en que vence su factura y
// pagada si esa factura ya se pagó. Así cuenta como gasto (y pendiente) en el mes en que se paga.
// La línea lleva movimientoId (la compra), cuota (1, 2…) y factura (la de esa cuota).
export function cuotasComoGastos(movimientos, tarjetaPorId) {
  const lineas = [];
  for (const m of movimientos) {
    if (m.tipo !== 'gastoTarjeta') continue;
    const tarjeta = tarjetaPorId(m.tarjetaId);
    for (const cuota of cuotasDe(m)) {
      lineas.push({
        ...m,
        id: `${m.id}-${cuota.numero}`,
        movimientoId: m.id,
        cuota: cuota.numero,
        factura: cuota.mes,
        valor: cuota.valor,
        fecha: tarjeta ? fechaPagoFactura(tarjeta, cuota.mes) : `${cuota.mes}-01`,
        pagado: Boolean(tarjeta && facturaPagada(tarjeta.facturas.get(cuota.mes) ?? { total: 0 })),
      });
    }
  }
  return lineas;
}

// Facturas con algo, de la más nueva a la más vieja.
export const facturasOrdenadas = (resumen) =>
  [...(resumen?.facturas.values() ?? [])].filter((f) => f.total > 0 || f.pagado > 0).sort((a, b) => b.mes.localeCompare(a.mes));

export const facturaPagada = (f) => f.total > 0 && f.pagado >= f.total;

// La próxima factura por pagar (la más vieja sin pagar), o null.
export function proximaFactura(resumen) {
  const pendientes = facturasOrdenadas(resumen).filter((f) => f.total > f.pagado);
  return pendientes.at(-1) ?? null;
}

// datos: { nombre, cupo, diaCierre, diaPago, cuentaPagoId, icono }. Sin id = tarjeta nueva.
export async function guardarTarjeta(id, datos) {
  const dia = (n) => Math.min(31, Math.max(1, Math.round(n) || 1));
  const campos = {
    nombre: datos.nombre.trim() || 'Tarjeta',
    cupo: Math.max(0, Math.round(datos.cupo) || 0),
    diaCierre: dia(datos.diaCierre),
    diaPago: dia(datos.diaPago),
    cuentaPagoId: datos.cuentaPagoId ?? null,
    icono: datos.icono,
    // Color del ícono: uno de los 10 colores del tema o null (el del tema), como en las cuentas.
    color: datos.color ?? null,
  };
  if (id) {
    await db.tarjetas.update(id, campos);
    return id;
  }
  const nueva = { ...campos, id: nuevoId(), orden: ordenAlFinal() };
  await db.tarjetas.add(nueva);
  return nueva.id;
}

// Se borran también sus compras y pagos, en una sola operación. El panel avisa cuántos son.
export function eliminarTarjeta(id) {
  return db.transaction('rw', db.tarjetas, db.movimientos, db.programados, async () => {
    await db.movimientos.where('tarjetaId').equals(id).delete();
    // Y sus gastos programados (suscripciones), que ya no tendrían a qué factura ir.
    await db.programados.filter((p) => p.tarjetaId === id).delete();
    await db.tarjetas.delete(id);
  });
}

// Paga lo que falta de una factura desde una cuenta, con fecha de hoy.
// valor: lo que se paga, si no es todo lo que falta (se cambió en "¿Ya lo pagaste?"); con menos, la
// factura queda con el resto pendiente.
export async function pagarFactura(tarjeta, factura, cuentaId, fecha, valor = factura.total - factura.pagado) {
  if (valor <= 0) return;
  await db.movimientos.add({
    id: nuevoId(),
    tipo: 'pagoTarjeta',
    valor,
    descripcion: '',
    categoriaId: null,
    cuentaId,
    cuentaDestinoId: null,
    tarjetaId: tarjeta.id,
    factura: factura.mes,
    fecha,
    hora: fecha === hoyTexto() ? horaActual() : null,
    pagado: true,
    etiquetaIds: [],
    observacion: '',
    creado: Date.now(),
  });
}
