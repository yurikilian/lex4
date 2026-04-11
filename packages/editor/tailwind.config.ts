/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      width: {
        a4: '794px',
      },
      height: {
        a4: '1123px',
      },
    },
  },
  plugins: [],
};
