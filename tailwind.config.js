/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#1b3d2f',
          dark: '#122a21',
          light: '#25503e'
        },
        mustard: {
          DEFAULT: '#d4a017',
          light: '#e6c15a'
        },
        brick: {
          DEFAULT: '#a5372a',
          light: '#c14a3a'
        },
        chalk: '#f2ede2',
        busted: '#5a6b62'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        felt: 'inset 0 0 60px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
}
