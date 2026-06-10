/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cheapr: {
          yellow: '#E8A838',
          dark: '#222222',
          page: '#E8A838',
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
