'use client';

import { HU } from '@/lib/design';
import { Icon } from '@/components/ui';
import type { DoseLog, DosingOrder } from '@/lib/types';
import {
  getNextDose, getVialStatus, getMaxWeeksStatus, downloadDoseReminder, fmtShortDate,
} from '@/lib/dosing';

interface Props {
  order: DosingOrder | null;
  doseLogs: DoseLog[];      // ordenados del más reciente al más antiguo
  medication: string;
  dark?: boolean;           // sobre fondo oscuro (Home) o claro (Progreso)
}

/** Próxima dosis, inventario del vial y alerta de semanas máximas. */
export function DoseStatus({ order, doseLogs, medication, dark = false }: Props) {
  const next = getNextDose(doseLogs[0] || null, order);
  const vial = getVialStatus(order, doseLogs, next);
  const maxW = getMaxWeeksStatus(order);

  const fg = dark ? '#fff' : HU.ink;
  const sub = dark ? 'rgba(255,255,255,.65)' : HU.mute;
  const rowBg = dark ? 'rgba(255,255,255,.12)' : HU.cream;

  // Sobre la tarjeta azul se usan variantes claras para que se lean
  const warnC = dark ? '#FFB4AB' : HU.coral;
  const cautionC = dark ? '#FDD663' : '#B06000';
  const okC = dark ? '#6DD58C' : HU.leaf;
  const nextColor = !next ? fg : next.daysUntil < 0 ? warnC : next.daysUntil === 0 ? cautionC : fg;

  const alertRow = (color: string, icon: string, text: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, background: `${color}22`, border: `1px solid ${color}55` }}>
      <Icon name={icon} size={14} color={color} stroke={2} />
      <div style={{ fontFamily: HU.sans, fontSize: 12, color: fg, lineHeight: 1.4 }}>{text}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Próxima dosis */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: rowBg }}>
        <Icon name="clock" size={18} color={nextColor} stroke={2} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: HU.sans, fontSize: 11, fontWeight: 500, color: sub, letterSpacing: .3 }}>Próxima dosis</div>
          {next ? (
            <div style={{ fontFamily: HU.sans, fontSize: 14, fontWeight: 600, color: nextColor, marginTop: 1 }}>
              {next.label} <span style={{ fontWeight: 400, color: sub }}>· {fmtShortDate(next.date)}</span>
              {next.units != null
                ? <span style={{ fontWeight: 400, color: sub }}> · {next.units}u ({next.mg} mg)</span>
                : next.mg != null && <span style={{ fontWeight: 400, color: sub }}> · {next.mg} mg</span>}
            </div>
          ) : (
            <div style={{ fontFamily: HU.sans, fontSize: 13, color: sub, marginTop: 1 }}>Registra tu primera inyección</div>
          )}
        </div>
        {next && (
          <button
            type="button"
            onClick={() => downloadDoseReminder(next, medication)}
            title="Agregar recordatorio semanal a tu calendario"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 100, border: `1px solid ${dark ? 'rgba(255,255,255,.3)' : HU.line}`, background: 'transparent', color: fg, fontFamily: HU.sans, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="bell" size={12} color={fg} stroke={2} /> Recordar
          </button>
        )}
      </div>

      {/* Inventario del vial */}
      {vial && (
        <div style={{ padding: '10px 12px', borderRadius: 12, background: rowBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontFamily: HU.sans, fontSize: 11, fontWeight: 500, color: sub, letterSpacing: .3 }}>{vial.pens ? 'Plumas en la caja' : 'Vial'}</div>
            <div style={{ fontFamily: HU.mono, fontSize: 11, color: fg }}>
              {vial.pens
                ? <><strong>{vial.remaining}</strong> <span style={{ color: sub }}>de {vial.total}</span></>
                : <><strong>{vial.remaining}u</strong> <span style={{ color: sub }}>de {vial.total}u</span></>}
            </div>
          </div>
          {vial.pens ? (
            // Una "pluma" por cada una de la caja: llenas = disponibles
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: vial.total }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < vial.remaining ? (vial.low ? warnC : okC) : dark ? 'rgba(255,255,255,.15)' : HU.lineSoft }} />
              ))}
            </div>
          ) : (
            <div style={{ height: 6, borderRadius: 3, background: dark ? 'rgba(255,255,255,.15)' : HU.lineSoft, overflow: 'hidden' }}>
              <div style={{ width: `${(vial.remaining / vial.total) * 100}%`, height: '100%', background: vial.low ? warnC : okC, transition: 'width .4s' }} />
            </div>
          )}
          <div style={{ fontFamily: HU.sans, fontSize: 12, color: vial.low ? warnC : sub, marginTop: 6, fontWeight: vial.low ? 600 : 400 }}>
            {vial.pens
              ? vial.remaining === 0
                ? 'No te quedan plumas — pide tu reorden.'
                : `Te ${vial.remaining === 1 ? 'queda 1 pluma' : `quedan ${vial.remaining} plumas`}${vial.runOutDate ? ` (hasta ${fmtShortDate(vial.runOutDate)})` : ''}${vial.low ? ' — pide tu reorden.' : ''}`
              : vial.dosesLeft === 0
                ? 'No alcanza para la próxima dosis — pide tu reorden.'
                : `Alcanza para ${vial.dosesLeft} dosis${vial.runOutDate ? ` (hasta ${fmtShortDate(vial.runOutDate)})` : ''}${vial.low ? ' — pide tu reorden.' : ''}`}
          </div>
        </div>
      )}

      {/* Semanas máximas */}
      {maxW?.warn && alertRow(
        warnC, 'bell',
        maxW.weeksLeft === 0
          ? <>Última semana de esta orden (semana {maxW.week} de {maxW.maxWeeks}). Consulta tu siguiente orden.</>
          : <>Llevas {maxW.week} semanas con esta orden; el máximo indicado es {maxW.maxWeeks}. Consulta con tu proveedor.</>
      )}
      {maxW && maxW.weeksLeft === 1 && alertRow(
        cautionC, 'clock',
        <>Queda 1 semana de esta orden (máx. {maxW.maxWeeks} semanas).</>
      )}
    </div>
  );
}
