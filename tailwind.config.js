/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'mail-bg': '#f2f6fc',
        'mail-hover': '#e8f0fe',
        'mail-selected': '#c2d7ff',
        'mail-unread': '#202124',
        'mail-read': '#5f6368',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
