/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sony: {
          dark: '#0B0B0C',
          card: '#141416',
          border: '#222226',
          subtle: '#333338',
          accent: '#A9C8FF',
          'accent-glow': 'rgba(169, 200, 255, 0.15)',
          text: '#EDEDED',
          muted: '#8E8E93',
          dim: '#55555B',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        widest: '0.25em',
        superwide: '0.4em',
      },
    },
  },
  plugins: [],
};
