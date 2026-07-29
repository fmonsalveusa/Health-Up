// Health Up Design System — tokens centralizados
// Usamos estos para inline styles donde Tailwind no alcanza (SVGs, gradientes dinámicos)

export const HU = {
  ink: '#1E3A5F',
  inkDeep: '#142744',
  leaf: '#6BA368',
  leafDeep: '#4F8452',
  sun: '#E9C46A',
  cream: '#FAFAF7',
  creamWarm: '#F3EFE6',
  paper: '#FFFFFF',
  line: 'rgba(30,58,95,0.10)',
  lineSoft: 'rgba(30,58,95,0.06)',
  mute: 'rgba(30,58,95,0.55)',
  dim: 'rgba(30,58,95,0.35)',
  coral: '#E76F51',

  display: '"Fraunces", "Playfair Display", Georgia, serif',
  sans: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

// Tone maps for FoodImg placeholder
export const FOOD_TONES: Record<string, [string, string, string]> = {
  leaf:  ['#D4E4C8', '#6BA368', '#4F8452'],
  navy:  ['#D6E0EC', '#6B8CAE', '#1E3A5F'],
  sun:   ['#F5E4B8', '#E9C46A', '#B08A3A'],
  coral: ['#F5D4C8', '#E76F51', '#B04A30'],
  cream: ['#F3EFE6', '#D6CFB8', '#9E9373'],
};
