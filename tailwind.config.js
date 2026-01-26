/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lucis': {
          'bg': '#ffffff',
          'bg-alt': '#f8f9fa',
          'bg-tertiary': '#f1f3f5',
          'text': '#1a1a2e',
          'text-secondary': '#4a5568',
          'text-muted': '#718096',
          'border': '#e2e8f0',
          'border-medium': '#cbd5e0',
          'accent': '#2d3748',
          'accent-hover': '#1a202c',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'lucis': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'lucis-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'lucis-xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
