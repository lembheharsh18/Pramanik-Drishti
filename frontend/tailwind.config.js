/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#07111F',
          50: '#0B1728',
          100: '#102033',
          200: '#172B42',
          300: '#223853',
          400: '#2D4968',
        },
        primary: {
          DEFAULT: '#1D4ED8',
          light: '#60A5FA',
          dark: '#1E40AF',
          glow: 'rgba(29, 78, 216, 0.18)',
        },
        accent: {
          emerald: '#14B8A6',
          'emerald-dark': '#0F766E',
          'emerald-glow': 'rgba(20, 184, 166, 0.16)',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          glow: 'rgba(220, 38, 38, 0.18)',
        },
        warning: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          glow: 'rgba(217, 119, 6, 0.16)',
        },
        ink: {
          DEFAULT: '#F1F5F9',
          muted: '#A7B3C6',
          faint: '#718096',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease both',
        'fade-in-up-d1': 'fadeInUp 0.6s ease 100ms both',
        'fade-in-up-d2': 'fadeInUp 0.6s ease 200ms both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.8s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 6s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float-orb': 'floatOrb 8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { left: '-50%' },
          '48%, 100%': { left: '120%' },
        },
        gradientFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        floatOrb: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(30px, -20px)' },
          '66%': { transform: 'translate(-20px, 15px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-primary': '0 8px 20px rgba(29, 78, 216, 0.22)',
        'glow-emerald': '0 8px 20px rgba(20, 184, 166, 0.18)',
        'glow-danger': '0 8px 20px rgba(220, 38, 38, 0.18)',
        'glow-warning': '0 8px 20px rgba(217, 119, 6, 0.18)',
        'glass': '0 10px 24px rgba(0, 0, 0, 0.18)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
