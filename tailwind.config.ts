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
          primary: '#0B57D0',
          ink: '#1F1F1F',
          'ink-deep': '#041E49',
          leaf: '#1E8E3E',
          'leaf-deep': '#137333',
          sun: '#F9AB00',
          cream: '#F0F4F9',
          'cream-warm': '#E9EEF6',
          paper: '#FFFFFF',
          coral: '#D93025',
          line: '#C4C7C5',
          'line-soft': '#E3E3E3',
          mute: '#444746',
          dim: '#747775',
        },
      },
      fontFamily: {
        display: ['"Google Sans"', 'Roboto', 'Arial', 'sans-serif'],
        sans: ['"Google Sans Text"', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['"Google Sans Text"', 'Roboto', 'Arial', 'sans-serif'],
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
