/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        msme: {
          blue: '#0B3B75',
          orange: '#F97316',
          green: '#15803D'
        }
      }
    }
  },
  plugins: []
};
