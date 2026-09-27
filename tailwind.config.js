/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs de maitrise (rouge -> vert)
        mastery: {
          0: '#ef4444', // rouge - inconnu
          1: '#f97316', // orange fonce - tres faible
          2: '#f59e0b', // ambre - fragile
          3: '#eab308', // jaune - correct
          4: '#84cc16', // vert clair - presque
          5: '#22c55e', // vert - maitrise
        },
        brand: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        reading: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
