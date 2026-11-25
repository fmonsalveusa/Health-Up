// Health Up Design System — tokens centralizados
// Estilo inspirado en Material Design 3 (el lenguaje visual de las apps de Google):
// superficies claras, azul como color principal, tipografía Roboto y bordes redondeados.
// Los nombres (ink, leaf, cream…) se mantienen para no tocar cada pantalla.

export const HU = {
  // Color principal (botones, selección, tarjetas destacadas)
  primary: '#0B57D0',
  primaryContainer: '#D3E3FD',
  onPrimaryContainer: '#041E49',

  // Texto
  ink: '#1F1F1F',        // texto principal (on-surface)
  inkDeep: '#041E49',    // texto sobre fondos tonales
  mute: '#444746',       // texto secundario (on-surface-variant)
  dim: '#747775',        // texto deshabilitado / íconos inactivos (outline)

  // Semánticos
  leaf: '#1E8E3E',       // éxito / bajó de peso
  leafDeep: '#137333',
  sun: '#F9AB00',        // aviso
  coral: '#D93025',      // error / subió de peso

  // Superficies
  cream: '#F0F4F9',      // fondo de página y campos (surface-container)
  creamWarm: '#E9EEF6',  // surface-container-high
  paper: '#FFFFFF',      // tarjetas
  line: '#C4C7C5',       // bordes (outline-variant)
  lineSoft: '#E3E3E3',   // divisores suaves

  display: '"Google Sans", "Google Sans Text", Roboto, Arial, sans-serif',
  sans: '"Google Sans Text", Roboto, Arial, sans-serif',
  mono: '"Google Sans Text", Roboto, Arial, sans-serif',
} as const;

// Tone maps for FoodImg placeholder (pasteles tipo Material)
export const FOOD_TONES: Record<string, [string, string, string]> = {
  leaf:  ['#CEEAD6', '#81C995', '#1E8E3E'],
  navy:  ['#D3E3FD', '#7CACF8', '#0B57D0'],
  sun:   ['#FEEFC3', '#FDD663', '#E37400'],
  coral: ['#FAD2CF', '#F28B82', '#D93025'],
  cream: ['#E9EEF6', '#C4C7C5', '#747775'],
};
