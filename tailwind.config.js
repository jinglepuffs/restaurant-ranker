/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF7',
          100: '#FFF8F0',
          200: '#FCEBDA',
          300: '#F5DCBE',
        },
        warm: {
          400: '#E89B5D',
          500: '#D4632A',
          600: '#A85020',
          700: '#8A4F1F',
          800: '#6B3410',
          900: '#4A2308',
        },
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
