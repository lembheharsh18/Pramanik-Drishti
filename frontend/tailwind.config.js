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
          DEFAULT: '#0A0E1A',
          50: '#0D1225',
          100: '#111630',
          200: '#161C3D',
          300: '#1E2548',
          400: '#252D55',
        },
        primary: {
          DEFAULT: '#6C5CE7',
          light: '#A29BFE',
          dark: '#5A4BD1',
          glow: 'rgba(108, 92, 231, 0.25)',
        },
        accent: {
          emerald: '#00D9A6',
          'emerald-dark': '#00B88C',
          'emerald-glow': 'rgba(0, 217, 166, 0.20)',
        },
        danger: {
          DEFAULT: '#FF4757',
          dark: '#E63E4D',
          glow: 'rgba(255, 71, 87, 0.25)',
        },
        warning: {
          DEFAULT: '#FFB74D',
          dark: '#FF9800',
          glow: 'rgba(255, 183, 77, 0.20)',
        },
        ink: {
          DEFAULT: '#E8E9F0',
          muted: '#8B8FA3',
          faint: '#5A5F75',
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
        'glow-primary': '0 0 20px rgba(108, 92, 231, 0.3)',
        'glow-emerald': '0 0 20px rgba(0, 217, 166, 0.3)',
        'glow-danger': '0 0 20px rgba(255, 71, 87, 0.3)',
        'glow-warning': '0 0 20px rgba(255, 183, 77, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
