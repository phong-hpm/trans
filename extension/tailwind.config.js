// tailwind.config.js — JIT scans all source files for used class names

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
