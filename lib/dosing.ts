import type { DoseLog, DosingOrder } from './types';
import { localDateStr, parseLocalDate } from './dates';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Semana de tratamiento (1-based) de la orden en una fecha dada. */
export function getWeekNumber(order: DosingOrder, at: Date = new Date()): number {
  const start = parseLocalDate(order.ordered_at);
  return Math.max(1, Math.floor((at.getTime() - start.getTime()) / (DAY_MS * 7)) + 1);
}

export function calcDoseForWeek(order: DosingOrder, week: number): number {
  return Math.min(order.start_units + (order.increment_units || 0) * (week - 1), order.max_units || 999);
}

export function calcMgForUnits(order: DosingOrder, units: number): number {
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
  if (order) {
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
}

/** Inventario del vial de la orden; null si la orden no tiene vial_units. */
export function getVialStatus(order: DosingOrder | null, doseLogs: DoseLog[], next: NextDose | null): VialStatus | null {
  if (!order || !order.vial_units) return null;
  const used = doseLogs
    .filter(d => d.order_id === order.id)
    .reduce((s, d) => s + (d.dose_units || 0), 0);
  const remaining = Math.max(0, order.vial_units - used);
  const nextUnits = next?.units || calcDoseForWeek(order, getWeekNumber(order));
  const dosesLeft = nextUnits > 0 ? Math.floor(remaining / nextUnits) : 0;
  let runOutDate: Date | null = null;
  if (dosesLeft > 0) {
    runOutDate = new Date(next?.date || new Date());
    runOutDate.setDate(runOutDate.getDate() + 7 * (dosesLeft - 1));
  }
  return { total: order.vial_units, used, remaining, dosesLeft, runOutDate, low: dosesLeft <= 2 };
}

export interface MaxWeeksStatus {
  week: number;
  maxWeeks: number;
  weeksLeft: number;  // 0 = última semana, negativo = excedida
  warn: boolean;      // última semana o excedida
}

export function getMaxWeeksStatus(order: DosingOrder | null): MaxWeeksStatus | null {
  if (!order || !order.max_weeks) return null;
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
