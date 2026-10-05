/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Los tokens de color institucional (bg, surface, text, accent...) ya no
  // usan dark: — se calculan continuamente vía variables CSS (ver
  // src/theme/). Esto se deja solo para los indicadores semánticos
  // universales (verde/rojo/ámbar de Tailwind) que sí siguen usando
  // dark:, alternados por useTemaAdaptativo según si la franja actual es
  // "noche" — ver ese hook.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema adaptativo: estos tokens leen variables CSS (triplete "r g b")
        // que el hook useTemaAdaptativo recalcula según la hora del día —
        // ver src/theme/. El patrón rgb(var(..) / <alpha-value>) es el que
        // recomienda Tailwind para que /opacidad siga funcionando con
        // variables CSS (ej. "bg-surface/60").
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-soft': 'rgb(var(--color-bg-soft) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-on-bg': 'rgb(var(--color-text-on-bg) / <alpha-value>)',
        'text-muted-on-bg': 'rgb(var(--color-text-muted-on-bg) / <alpha-value>)',
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--color-brand-strong) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-strong': 'rgb(var(--color-accent-strong) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
