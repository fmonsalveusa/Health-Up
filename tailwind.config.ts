import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hu: {
          ink: '#1E3A5F',
          'ink-deep': '#142744',
          leaf: '#6BA368',
          'leaf-deep': '#4F8452',
          sun: '#E9C46A',
          cream: '#FAFAF7',
          'cream-warm': '#F3EFE6',
          paper: '#FFFFFF',
          coral: '#E76F51',
          line: 'rgba(30,58,95,0.10)',
          'line-soft': 'rgba(30,58,95,0.06)',
          mute: 'rgba(30,58,95,0.55)',
          dim: 'rgba(30,58,95,0.35)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'hu': '16px',
        'hu-lg': '20px',
        'hu-xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
