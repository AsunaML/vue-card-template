/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vue: {
          green: '#42b883',
          dark: '#369870',
        }
      },
      fontFamily: {
        'sans': ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      }
    },
  },
  plugins: [],
}