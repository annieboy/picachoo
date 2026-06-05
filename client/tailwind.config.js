/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'shutter-flash': {
          '0%':   { opacity: '0' },
          '10%':  { opacity: '0.85' },
          '100%': { opacity: '0' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '70%':  { transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'draw-check': {
          '0%':   { strokeDashoffset: '60' },
          '100%': { strokeDashoffset: '0' },
        },
        'confetti-fall': {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(60px) rotate(720deg)', opacity: '0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      animation: {
        'shutter-flash': 'shutter-flash 0.4s ease-out forwards',
        'pop-in':        'pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'draw-check':    'draw-check 0.4s ease-out 0.3s forwards',
        'confetti-fall': 'confetti-fall 1s ease-in forwards',
        'fade-up':       'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot':     'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
