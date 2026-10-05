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
        brand: {
          DEFAULT: '#2c1547',
          soft: 'rgba(44, 21, 71, 0.12)',
          dark: '#8a4ed9',
        },
        highlight: {
          DEFAULT: '#f57021',
          soft: 'rgba(245, 112, 33, 0.16)',
        },
      },
    },
  },
  plugins: [],
}
