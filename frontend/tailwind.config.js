/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta oficial del Gobierno de Chile (framework.digital.gob.cl).
      // Disponibles como clases: bg-gov-primary, text-gov-tertiary, etc.
      colors: {
        gov: {
          primary: '#006FB3',
          'primary-dark': '#004A80',
          'primary-light': '#E6F3FB',
          secondary: '#FE6565',
          tertiary: '#0A132D',
          accent: '#A8B7C7',
          neutral: '#EEEEEE',
          'gray-a': '#4A4A4A',
          'gray-b': '#8A8A8A',
          black: '#111111',
          green: '#2D717C',
        },
        // Estados semánticos de trámite.
        estado: {
          'pendiente-bg': '#FFF8E1',
          'pendiente-text': '#795500',
          'aprobado-bg': '#E8F5E9',
          'aprobado-text': '#1B5E20',
          'rechazado-bg': '#FFEBEE',
          'rechazado-text': '#B71C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
