import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        empy: {
          pink: '#FF69B4',
          'pink-dark': '#FF1493',
          blue: '#4A90D9',
          'blue-dark': '#1E3A5F',
          black: '#1A1A2E',
          yellow: '#FFD700',
          'yellow-light': '#FFF8DC',
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
        'card-pop': 'cardPop 0.3s ease-out',
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
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        empytv: {
          "primary": "#FF69B4",
          "secondary": "#4A90D9",
          "accent": "#FFD700",
          "neutral": "#1A1A2E",
          "base-100": "#0F0F23",
          "base-200": "#1A1A2E",
          "base-300": "#252547",
          "info": "#4A90D9",
          "success": "#36D399",
          "warning": "#FFD700",
          "error": "#F87272",
        },
      },
    ],
  },
};
