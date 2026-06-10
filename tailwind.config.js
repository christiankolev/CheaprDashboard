/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cheapr: {
          yellow: '#F5A200',
          dark: '#222222',
          page: '#F5A200',
        },
      },
      fontFamily: {
        outfit: ['Outfit-Variable', 'Outfit-Bold', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
