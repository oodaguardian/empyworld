const daisyui = require('daisyui');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        empy: {
          pink: '#FF2D8B',
          'pink-dark': '#C4005E',
          'pink-light': '#FF76C2',
          purple: '#9B30FF',
          'purple-dark': '#5B0FAB',
          'purple-mid': '#7C3AED',
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
          'blue-dark': '#1E1B4B',
          black: '#160020',
          'black-mid': '#200030',
          yellow: '#FFD700',
          'yellow-light': '#FFF8DC',
          magenta: '#E91E8C',
        },
      },
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.8s ease-out',
        'bounce-logo': 'bounceLogo 1s ease-in-out infinite alternate',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'card-pop': 'cardPop 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'heart-beat': 'heartBeat 1.2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'drift': 'drift 6s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceLogo: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(-30px) scale(1.1)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        cardPop: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255,45,139,0.4), 0 0 20px rgba(155,48,255,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(255,45,139,0.7), 0 0 50px rgba(155,48,255,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.10)' },
          '60%': { transform: 'scale(1)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) translateX(8px) rotate(5deg)' },
          '66%': { transform: 'translateY(-8px) translateX(-8px) rotate(-5deg)' },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        empytv: {
          "primary": "#FF2D8B",
          "secondary": "#9B30FF",
          "accent": "#60A5FA",
          "neutral": "#200030",
          "base-100": "#160020",
          "base-200": "#200030",
          "base-300": "#2D0050",
          "info": "#3B82F6",
          "success": "#A855F7",
          "warning": "#FF76C2",
          "error": "#FF2D8B",
        },
      },
    ],
  },
};
