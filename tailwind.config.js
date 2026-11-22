/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          // Verde de marca (logo, selección del menú y rellenos de gráficas)
          primary: '#a9db2c',
          // Verde oscuro derivado de la marca: botones, líneas y barras de las gráficas.
          // Tiene contraste suficiente con texto blanco, el verde de marca no.
          acento: '#4d7c0f',
          // Verde intermedio para la serie secundaria de las gráficas (ej. "Ayer")
          suave: '#7cb342',
        },
        // Colores de estado (todos con contraste ≥ 4.5:1 sobre blanco)
        estado: {
          optimo: '#2563eb',
          aceptable: '#3a7d1b',
          peligro: '#dc2626',
        },
      },
      keyframes: {
        campana: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(14deg)' },
          '30%': { transform: 'rotate(-12deg)' },
          '45%': { transform: 'rotate(9deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        caer: {
          '0%': { transform: 'translateY(-12vh)' },
          '100%': { transform: 'translateY(112vh)' },
        },
        balanceo: {
          '0%': { transform: 'translateX(-28px) rotate(-30deg)' },
          '100%': { transform: 'translateX(28px) rotate(40deg)' },
        },
      },
      animation: {
        campana: 'campana 0.9s ease-in-out',
        caer: 'caer linear infinite',
        balanceo: 'balanceo ease-in-out infinite alternate',
      },
      fontFamily: {
        sans: [
          '"Segoe UI Variable Text"',
          '"Segoe UI"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['"Cascadia Mono"', 'Consolas', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
