import type { DoseLog, DosingOrder } from './types';
import { localDateStr, parseLocalDate } from './dates';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Semana de tratamiento (1-based) de la orden en una fecha dada. */
export function getWeekNumber(order: DosingOrder, at: Date = new Date()): number {
  const start = parseLocalDate(order.ordered_at);
  return Math.max(1, Math.floor((at.getTime() - start.getTime()) / (DAY_MS * 7)) + 1);
}

/** Pluma autoinyectora de una dosis: dosis fija en mg, sin unidades. */
export const isPen = (order: DosingOrder | null | undefined) => order?.device === 'pen';

/** Dosis fija (mg) de una orden de pluma. */
export const penDoseMg = (order: DosingOrder) => Number(order.start_mg) || 0;

/** Unidades a inyectar en una semana (jeringa). Las plumas no usan unidades → 0. */
export function calcDoseForWeek(order: DosingOrder, week: number): number {
  if (isPen(order)) return 0;
  return Math.min(order.start_units + (order.increment_units || 0) * (week - 1), order.max_units || 999);
}

/** Texto de la dosis actual: '5 mg' (pluma) o '85u · 15 mg' (jeringa). */
export function formatOrderDose(order: DosingOrder): string {
  if (isPen(order)) return `${penDoseMg(order)} mg`;
  const units = calcDoseForWeek(order, getWeekNumber(order));
  return `${units}u · ${calcMgForUnits(order, units)} mg`;
}

export function calcMgForUnits(order: DosingOrder, units: number): number {
  if (isPen(order)) return penDoseMg(order);
  // start_mg / start_units es la relación exacta; concentration_mg_per_unit puede venir redondeada
  if (order.start_mg && order.start_units) return Math.round(units * (order.start_mg / order.start_units) * 100) / 100;
  if (order.concentration_mg_per_unit) return Math.round(units * order.concentration_mg_per_unit * 100) / 100;
  return 0;
}

/** Días enteros entre dos fechas locales (b - a). */
function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / DAY_MS);
}

export function doseDate(d: DoseLog): Date {
  return d.scheduled_for ? parseLocalDate(d.scheduled_for) : new Date(d.taken_at);
}

export interface NextDose {
  date: Date;
  daysUntil: number;      // negativo = atrasada
  label: string;          // 'Hoy', 'Mañana', 'En 3 días', 'Atrasada 2 días'
  units: number | null;
  mg: number | null;
}

/** Próxima dosis semanal: 7 días después de la última registrada. */
export function getNextDose(lastDose: DoseLog | null, order: DosingOrder | null): NextDose | null {
  if (!lastDose) return null;
  const date = doseDate(lastDose);
  date.setDate(date.getDate() + 7);
  const daysUntil = daysBetween(new Date(), date);
  const label =
    daysUntil === 0 ? 'Hoy' :
    daysUntil === 1 ? 'Mañana' :
    daysUntil > 1 ? `En ${daysUntil} días` :
    `Atrasada ${-daysUntil} día${daysUntil === -1 ? '' : 's'}`;
  let units: number | null = null, mg: number | null = null;
  if (order && isPen(order)) {
    mg = penDoseMg(order);
  } else if (order) {
    units = calcDoseForWeek(order, getWeekNumber(order, date));
    mg = calcMgForUnits(order, units);
  }
  return { date, daysUntil, label, units, mg };
}

export interface VialStatus {
  total: number;
  used: number;
  remaining: number;
  dosesLeft: number;       // dosis completas que quedan con la dosis siguiente
  runOutDate: Date | null; // fecha estimada de la última dosis posible
  low: boolean;            // quedan 2 dosis o menos
  pens: boolean;           // true: total/used/remaining son plumas; false: unidades
}

/** Inventario de la orden (unidades del vial o plumas de la caja); null si no se indicó. */
export function getVialStatus(order: DosingOrder | null, doseLogs: DoseLog[], next: NextDose | null): VialStatus | null {
  if (!order || !order.vial_units) return null;
  const orderDoses = doseLogs.filter(d => d.order_id === order.id);
  const pens = isPen(order);
  // Pluma: cada dosis registrada gasta una pluma. Jeringa: se suman las unidades.
  const used = pens ? orderDoses.length : orderDoses.reduce((s, d) => s + (d.dose_units || 0), 0);
  const remaining = Math.max(0, order.vial_units - used);
  const nextUnits = pens ? 1 : next?.units || calcDoseForWeek(order, getWeekNumber(order));
  const dosesLeft = nextUnits > 0 ? Math.floor(remaining / nextUnits) : 0;
  let runOutDate: Date | null = null;
  if (dosesLeft > 0) {
    runOutDate = new Date(next?.date || new Date());
    runOutDate.setDate(runOutDate.getDate() + 7 * (dosesLeft - 1));
  }
  return { total: order.vial_units, used, remaining, dosesLeft, runOutDate, low: dosesLeft <= (pens ? 1 : 2), pens };
}

export interface MaxWeeksStatus {
  week: number;
  maxWeeks: number;
  weeksLeft: number;  // 0 = última semana, negativo = excedida
  warn: boolean;      // última semana o excedida
}

export function getMaxWeeksStatus(order: DosingOrder | null): MaxWeeksStatus | null {
  // Las plumas se controlan por cantidad en la caja, no por semanas máximas
  if (!order || !order.max_weeks || isPen(order)) return null;
  const week = getWeekNumber(order);
  const weeksLeft = order.max_weeks - week;
  return { week, maxWeeks: order.max_weeks, weeksLeft, warn: weeksLeft <= 0 };
}

/** Descarga un .ics con un evento semanal recurrente para la próxima dosis. */
export function downloadDoseReminder(next: NextDose, medication: string, hour = 9) {
  const d = next.daysUntil < 0 ? new Date() : next.date; // si está atrasada, empieza hoy
  const ymd = localDateStr(d).replace(/-/g, '');
  const hh = String(hour).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Health Up//Recordatorio//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:healthup-dose-${stamp}@healthup`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${ymd}T${hh}0000`,
    'DURATION:PT15M',
    'RRULE:FREQ=WEEKLY',
    `SUMMARY:Inyección ${medication}`,
    'DESCRIPTION:Revisa tu dosis de esta semana y regístrala en Health Up.',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Inyección ${medication}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recordatorio-dosis.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fmtShortDate = (d: Date) =>
  d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
