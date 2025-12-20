/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './types.ts',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e3ebe5',
          200: '#c5d8cc',
          300: '#9bbdae',
          400: '#729d8d',
          500: '#548271',
          600: '#41685a',
          700: '#36544a',
          800: '#2e453e',
          900: '#273a34',
        },
        sand: {
          50: '#fbfaf8',
          100: '#f5f2ec',
          200: '#ebe3d6',
          300: '#decbb6',
          400: '#cead90',
          500: '#c39270',
          600: '#b67d5d',
        },
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
