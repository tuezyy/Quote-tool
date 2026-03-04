/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Brand orange — matches logo (#F47920)
        wood: {
          50:  '#fff5eb',
          100: '#fee9cc',
          200: '#fdd09a',
          300: '#fcaf61',
          400: '#fb8e37',
          500: '#f47920',
          600: '#e06010',
          700: '#ba4c0c',
          800: '#963d0b',
          900: '#7a3209',
          950: '#421604',
        },
        // Brand navy — matches logo (#1B2F5E)
        navy: {
          50:  '#eef2f9',
          100: '#d5def0',
          200: '#aabae1',
          300: '#7a93cb',
          400: '#4f6fb5',
          500: '#3754a0',
          600: '#2a4189',
          700: '#223574',
          800: '#1d2d63',
          900: '#1b2f5e',
          950: '#0f1b38',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'marquee': 'marquee 35s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
