'use client';

import { HU, FOOD_TONES } from '@/lib/design';

// ── Icon ──────────────────────────────────────────────────
const ICON_PATHS: Record<string, string> = {
  flame: 'M12 2s2 4 2 6a2 2 0 11-4 0c0-1-1-2-1-2s-4 3-4 8a7 7 0 1014 0c0-5-5-8-7-12z',
  leaf: 'M20 4C12 4 4 8 4 16c0 2 1 4 2 4 4 0 14-4 14-16z M4 20s4-6 10-10',
  scale: 'M4 7h16l-2 12H6L4 7z M9 11h6',
  heart: 'M12 20s-7-4-7-10a4 4 0 017-2 4 4 0 017 2c0 6-7 10-7 10z',
  plus: 'M12 5v14M5 12h14',
  check: 'M4 12l5 5L20 6',
  chev: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  cal: 'M4 7h16v14H4zM4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M8 3v4M16 3v4',
  syringe: 'M14 4l6 6M12 6l6 6-8 8-3 1 1-3 8-8zM3 21l4-4',
  bolt: 'M13 3L4 14h7l-1 7 9-11h-7l1-7z',
  user: 'M4 21v-1a6 6 0 0116 0v1M12 12a4 4 0 110-8 4 4 0 010 8z',
  home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z',
  book: 'M4 4h6a4 4 0 014 4v12a4 4 0 00-4-4H4V4zM20 4h-6a4 4 0 00-4 4v12a4 4 0 014-4h6V4z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z',
  bell: 'M6 8a6 6 0 0112 0v5l2 3H4l2-3V8zM10 19a2 2 0 004 0',
  bag: 'M6 7h12l-1 13H7L6 7zM9 7V5a3 3 0 016 0v2',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  target: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 17a5 5 0 110-10 5 5 0 010 10zM12 13a1 1 0 110-2 1 1 0 010 2z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3',
  drop: 'M12 3s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2.1-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 00-2.1 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 000 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 002.1 1.2l.4 2.6h4l.4-2.6a7 7 0 002.1-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2z',
  veg: 'M6 20s-2-6 2-10 10-2 10-2 0 6-4 10-8 2-8 2zM6 20l8-8',
  star: 'M12 3l3 6 6 1-5 4 2 7-6-3-6 3 2-7-5-4 6-1 3-6z',
  play: 'M6 4v16l14-8L6 4z',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
}

export function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d={ICON_PATHS[name] || ''} />
    </svg>
  );
}

// ── Button ──────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'leaf' | 'ghost';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

const SIZE_MAP = { sm: { h: 36, px: 14, fs: 13 }, md: { h: 48, px: 18, fs: 15 }, lg: { h: 56, px: 22, fs: 16 } };
const VAR_MAP = {
  primary: { bg: HU.ink, color: '#fff', border: 'none' },
  secondary: { bg: HU.paper, color: HU.ink, border: `1px solid ${HU.line}` },
  leaf: { bg: HU.leaf, color: '#fff', border: 'none' },
  ghost: { bg: 'transparent', color: HU.ink, border: 'none' },
};

export function Btn({ children, variant = 'primary', size = 'md', icon, onClick, disabled, loading, className, type = 'button', style }: BtnProps) {
  const s = SIZE_MAP[size], v = VAR_MAP[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={className}
      style={{
        height: s.h, padding: `0 ${s.px}px`, borderRadius: s.h / 2,
        background: v.bg, color: v.color, border: v.border,
        fontFamily: HU.sans, fontSize: s.fs, fontWeight: 600, letterSpacing: -0.1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent', ...style,
      }}>
      {loading && <span style={{ width: s.fs, height: s.fs, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
      {!loading && icon && <Icon name={icon} size={s.fs + 3} stroke={2} />}
      {children}
    </button>
  );
}

// ── Ring gauge ───────────────────────────────────────────────
interface RingProps {
  size?: number;
  stroke?: number;
  value?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}

export function Ring({ size = 60, stroke = 6, value = 0.6, color = HU.leaf, track = HU.lineSoft, children }: RingProps) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={C} strokeDashoffset={C * (1 - value)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// ── Macro bar ────────────────────────────────────────────────
export function MacroBar({ p = 30, c = 40, f = 30, h = 6 }: { p?: number; c?: number; f?: number; h?: number }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: h, borderRadius: h, overflow: 'hidden', background: HU.lineSoft }}>
      <div style={{ width: `${p}%`, background: HU.ink, transition: 'width 0.4s' }} />
      <div style={{ width: `${c}%`, background: HU.leaf, transition: 'width 0.4s' }} />
      <div style={{ width: `${f}%`, background: HU.sun, transition: 'width 0.4s' }} />
    </div>
  );
}

// ── FoodImg placeholder ──────────────────────────────────────
export function FoodImg({ label = '', tone = 'leaf', ratio = '4/3', rounded = 0, style = {} }: {
  label?: string; tone?: string; ratio?: string; rounded?: number; style?: React.CSSProperties;
}) {
  const [a, b, c] = FOOD_TONES[tone] || FOOD_TONES.leaf;
  const patId = `dots-${tone}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div style={{
      position: 'relative', aspectRatio: ratio, width: '100%', overflow: 'hidden',
      borderRadius: rounded, background: `radial-gradient(120% 120% at 20% 10%, ${a} 0%, ${b} 60%, ${c} 100%)`, ...style,
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: .35 }}>
        <defs><pattern id={patId} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill={c} /></pattern></defs>
        <rect width="100%" height="100%" fill={`url(#${patId})`} />
      </svg>
      <svg viewBox="0 0 100 75" style={{ position: 'absolute', inset: '15% 10%', width: '80%', height: '70%' }} preserveAspectRatio="xMidYMid meet">
        <ellipse cx="50" cy="40" rx="38" ry="28" fill={c} opacity=".25" />
        <ellipse cx="50" cy="38" rx="32" ry="22" fill={b} opacity=".55" />
        <ellipse cx="50" cy="36" rx="26" ry="16" fill={a} opacity=".85" />
        <circle cx="38" cy="34" r="4" fill={c} opacity=".5" />
        <circle cx="55" cy="32" r="3" fill={c} opacity=".45" />
      </svg>
      {label && (
        <div style={{
          position: 'absolute', left: 10, bottom: 10,
          fontFamily: HU.mono, fontSize: 9, letterSpacing: .6, textTransform: 'uppercase',
          color: HU.inkDeep, background: 'rgba(255,255,255,.82)', padding: '3px 7px', borderRadius: 2,
        }}>{label}</div>
      )}
    </div>
  );
}

// ── Chip ─────────────────────────────────────────────────────
export function Chip({ children, active = false, onClick, style = {} }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100,
      background: active ? HU.ink : 'transparent', color: active ? '#fff' : HU.ink,
      border: `1px solid ${active ? HU.ink : HU.line}`,
      fontFamily: HU.sans, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

// ── TabBar ───────────────────────────────────────────────────
const TABS = [
  { k: 'home', label: 'Hoy', icon: 'home', href: '/home' },
  { k: 'plan', label: 'Plan', icon: 'cal', href: '/plan' },
  { k: 'recipes', label: 'Recetas', icon: 'book', href: '/recipes' },
  { k: 'track', label: 'Progreso', icon: 'chart', href: '/track' },
  { k: 'profile', label: 'Perfil', icon: 'user', href: '/profile' },
];

export function TabBar({ active = 'home' }: { active?: string }) {
  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, height: 82,
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${HU.lineSoft}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
      paddingTop: 10, zIndex: 40,
    }}>
      {TABS.map(t => (
        <a key={t.k} href={t.href} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1,
          textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
        }}>
          <Icon name={t.icon} size={22} color={t.k === active ? HU.ink : HU.dim} stroke={t.k === active ? 2.2 : 1.6} />
          <div style={{ fontFamily: HU.sans, fontSize: 10, fontWeight: t.k === active ? 600 : 500, color: t.k === active ? HU.ink : HU.dim }}>{t.label}</div>
        </a>
      ))}
    </nav>
  );
}
