/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-en': ['Merriweather', 'serif'],
        'header-en': ['Playfair Display', 'serif'],
        'serif-ar': ['Amiri', 'serif'],
      },
    },
  },
  plugins: [],
}