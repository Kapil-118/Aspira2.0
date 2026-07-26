/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0B0F19',
        darkCard: '#151D30',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        glassBg: 'rgba(21, 29, 48, 0.7)',
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        secondary: {
          500: '#A855F7',
          600: '#9333EA',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(99, 102, 241, 0.35)',
      }
    },
  },
  plugins: [],
}
