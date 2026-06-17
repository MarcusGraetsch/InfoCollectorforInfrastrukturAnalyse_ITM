/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // HiSolutions brand colors
        hi: {
          navy: '#001B4E',       // primary dark navy
          blue: '#003087',       // medium blue
          accent: '#0057B8',     // accent blue
          light: '#4A90D9',      // light blue
          teal: '#00A3A6',       // teal accent
          gray: '#F4F6FA',       // light background
          slate: '#6B7A99',      // muted text
          dark: '#0A0F1E',       // near-black
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
