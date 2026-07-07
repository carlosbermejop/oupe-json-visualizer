/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'bg-green-600',
    'hover:bg-green-700',
    'bg-red-600',
    'hover:bg-red-700',
  ],
  plugins: [],
}
