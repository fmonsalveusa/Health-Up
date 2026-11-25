'use client';

import { HU } from '@/lib/design';

// Color de la etiqueta según la dosis, para distinguir plumas de distinta potencia
// de un vistazo (paleta propia de la app, no la del fabricante).
const DOSE_COLORS: [number, string][] = [
  [2.5, '#747775'],
  [5, '#8E44AD'],
  [7.5, '#1E8E3E'],
  [10, '#E37400'],
  [12.5, '#0B57D0'],
  [15, '#C2185B'],
];

export function penColor(mg: number): string {
  const match = DOSE_COLORS.find(([d]) => Math.abs(d - mg) < 0.01);
  return match ? match[1] : HU.primary;
}

/** Pluma autoinyectora de una dosis (vista lateral) con la dosis en la etiqueta. */
export function PenVisual({ mg, used = false }: { mg: number; used?: boolean }) {
  const c = penColor(mg);
  return (
    <svg viewBox="0 0 360 80" style={{ width: '100%', height: 80 }} role="img" aria-label={`Pluma de ${mg} mg`}>
      <defs>
        <linearGradient id="penBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#EEF1F5" />
          <stop offset="1" stopColor="#D5DAE1" />
        </linearGradient>
      </defs>
      {/* Botón de activación (extremo trasero) */}
      <rect x="14" y="28" width="24" height="24" rx="6" fill={c} />
      {/* Cuerpo */}
      <rect x="34" y="16" width="250" height="48" rx="22" fill="url(#penBody)" stroke="#C4C7C5" strokeWidth="1.2" />
      {/* Etiqueta de color con la dosis */}
      <rect x="70" y="16" width="120" height="48" fill={c} />
      <text x="130" y="47" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" fontFamily="Roboto, Arial, sans-serif">
        {mg} mg
      </text>
      {/* Ventana de inspección: medicamento visible (sin usar) o indicador gris (usada) */}
      <rect x="206" y="30" width="50" height="20" rx="6" fill={used ? '#9AA0A6' : '#DCEBFF'} stroke="#C4C7C5" />
      {!used && <rect x="210" y="34" width="42" height="12" rx="4" fill="#BBD5FB" />}
      {/* Base (extremo de la aguja, con tapa) */}
      <rect x="278" y="22" width="62" height="36" rx="12" fill="#5F6368" />
      <rect x="334" y="28" width="12" height="24" rx="5" fill="#3C4043" />
    </svg>
  );
}
