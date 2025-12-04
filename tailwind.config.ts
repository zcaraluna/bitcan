import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E5090',
          dark: '#1a3a70',
          light: '#4a6eb0',
        },
        secondary: {
          DEFAULT: '#1a3a70',
          dark: '#0f2550',
          light: '#2a4a80',
        },
        background: {
          DEFAULT: '#eff1f4',
          light: '#f8f9fb',
        },
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '0.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;


