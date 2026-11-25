'use client';

import { useState } from 'react';
import { HU } from '@/lib/design';
import { kgToLbs } from '@/lib/nutrition';
import { parseLocalDate } from '@/lib/dates';
import type { WeightLog } from '@/lib/types';

type Range = '1M' | '3M' | '6M' | 'Todo';
const RANGE_DAYS: Record<Range, number | null> = { '1M': 30, '3M': 91, '6M': 182, Todo: null };
const DAY_MS = 1000 * 60 * 60 * 24;

// Colores claros para leer bien sobre la tarjeta azul
const ON_BLUE = { line: '#FFFFFF', good: '#6DD58C', bad: '#FFB4AB', goal: '#6DD58C' };

interface Props {
  logs: WeightLog[];      // del más reciente al más antiguo
  targetLbs: number;
}

/** Gráfico de peso con eje de tiempo real, selector de rango y línea de meta. */
export function WeightChart({ logs, targetLbs }: Props) {
  const [range, setRange] = useState<Range>('3M');

  // Un punto por día (el registro más reciente de ese día), en orden cronológico
  const seen = new Set<string>();
  const daily = logs
    .filter(l => (seen.has(l.logged_at) ? false : (seen.add(l.logged_at), true)))
    .map(l => ({ date: parseLocalDate(l.logged_at), lbs: kgToLbs(l.weight) }))
    .reverse();

  if (daily.length < 2) return null;

  const days = RANGE_DAYS[range];
  const cutoff = days ? Date.now() - days * DAY_MS : -Infinity;
  let data = daily.filter(d => d.date.getTime() >= cutoff);
  // Si el rango deja menos de 2 puntos, incluir el último anterior al rango como punto de partida
  if (data.length < 2) data = daily.slice(-2);

  const first = data[0], last = data[data.length - 1];
  const change = Math.round((last.lbs - first.lbs) * 10) / 10;
  const changePct = Math.round((change / first.lbs) * 1000) / 10;

  const values = data.map(d => d.lbs);
  let min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(max - min, 4);
  // Meta visible sólo si está cerca de los datos; si está lejos, aplanaría la curva
  const showGoal = targetLbs > 0 && targetLbs >= min - span && targetLbs <= max + span;
  if (showGoal) { min = Math.min(min, targetLbs); max = Math.max(max, targetLbs); }
  min -= 2; max += 2;
  const yRange = max - min || 1;

  const W = 340, H = 100, padL = 8, padR = 30, padY = 16;
  const chartW = W - padL - padR, chartH = H - padY * 2;
  const t0 = first.date.getTime(), t1 = last.date.getTime();
  const tSpan = t1 - t0 || 1;
  const x = (d: Date) => padL + ((d.getTime() - t0) / tSpan) * chartW;
  const y = (lbs: number) => padY + (1 - (lbs - min) / yRange) * chartH;

  const points = data.map((d, i) => ({
    ...d,
    x: x(d.date), y: y(d.lbs),
    pct: i > 0 ? Math.round(((d.lbs - data[i - 1].lbs) / data[i - 1].lbs) * 1000) / 10 : 0,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${H - 4} L${points[0].x},${H - 4} Z`;

  // Etiquetas de fecha: como máximo 5, repartidas
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));
  const showPct = points.length <= 10;
  const fmt = (d: Date) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(RANGE_DAYS) as Range[]).map(r => (
            <button key={r} type="button" onClick={() => setRange(r)} style={{
              padding: '3px 9px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: range === r ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.1)',
              color: range === r ? HU.primary : 'rgba(255,255,255,.8)',
              fontFamily: HU.mono, fontSize: 10, fontWeight: 700,
            }}>{r}</button>
          ))}
        </div>
        <div style={{ fontFamily: HU.mono, fontSize: 11, fontWeight: 700, color: change < 0 ? ON_BLUE.good : change > 0 ? ON_BLUE.bad : 'rgba(255,255,255,.7)' }}>
          {change > 0 ? '+' : ''}{change} lbs ({change > 0 ? '+' : ''}{changePct}%)
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', maxHeight: 160 }}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ON_BLUE.line} stopOpacity="0.3" />
            <stop offset="1" stopColor={ON_BLUE.line} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f, i) => {
          const gy = padY + (1 - f) * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="rgba(255,255,255,.18)" strokeWidth="0.5" />
              <text x={W - 2} y={gy + 3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,.6)" fontFamily="Roboto, sans-serif">{Math.round(min + f * yRange)}</text>
            </g>
          );
        })}

        {showGoal && (
          <g>
            <line x1={padL} y1={y(targetLbs)} x2={W - padR} y2={y(targetLbs)} stroke={ON_BLUE.goal} strokeWidth="1.2" strokeDasharray="4 3" />
            <text x={padL + 2} y={y(targetLbs) - 3} fontSize="8" fill={ON_BLUE.goal} fontWeight="700" fontFamily="Roboto, sans-serif">META {targetLbs}</text>
          </g>
        )}

        <path d={areaD} fill="url(#wg)" />
        <path d={pathD} fill="none" stroke={ON_BLUE.line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          // fecha cada `labelEvery` puntos, sin encimarse con la última
          const lastX = points[points.length - 1].x;
          const showDate = isLast || (i % labelEvery === 0 && lastX - p.x >= 40);
          return (
            <g key={i}>
              {(showPct || isLast || i === 0) && (
                <circle cx={p.x} cy={p.y} r={isLast ? 4 : 2.5} fill={isLast ? ON_BLUE.line : HU.primary} stroke={ON_BLUE.line} strokeWidth="1.5" />
              )}
              {showPct && i > 0 && p.pct !== 0 && (
                <g>
                  <rect x={p.x - 14} y={p.y - 15} width="28" height="11" rx="3" fill={p.pct < 0 ? HU.leaf : HU.coral} />
                  <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="7" fill="#fff" fontWeight="700" fontFamily="Roboto, sans-serif">
                    {p.pct > 0 ? '+' : ''}{p.pct}%
                  </text>
                </g>
              )}
              {showDate && (
                <text x={p.x} y={H + 12} textAnchor={i === 0 ? 'start' : isLast ? 'end' : 'middle'} fontSize="7" fill="rgba(255,255,255,.7)" fontFamily="Roboto, sans-serif">
                  {fmt(p.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {!showGoal && targetLbs > 0 && (
        <div style={{ textAlign: 'right', fontFamily: HU.mono, fontSize: 9, color: ON_BLUE.goal, opacity: .9, padding: '0 4px 4px' }}>
          Meta {targetLbs} lbs ↓ fuera del gráfico
        </div>
      )}
    </div>
  );
}
