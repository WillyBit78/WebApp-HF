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
        futsal: {
          navy: '#0b132b',
          blue: '#1c2541',
          lightBlue: '#3a506b',
          gold: '#f59e0b',
          goldHover: '#d97706',
          darkBg: '#090d16',
          cardDark: '#131b2e',
          cardLight: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
