/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#C9A961', // זהב חם ורך שמתאים ללוגו
        'gold-dark': '#B8860B', // זהב כהה יותר
        'gold-light': '#DAA520', // זהב בהיר יותר
        ivory: '#F9F6EE',
        'ivory-light': '#FFF7E8',
        candle: '#E4C9A3',
        'candle-light': '#D6B8A2',
        sage: '#C7C3B4',
        'sage-dark': '#A3A28C',
        'black-lux': '#0B0B0B',
      },
      backgroundImage: {
        // תמונות רקע - כל התמונות נמצאות ב-public/
        'packages-bg': "url('/packages-bg.jpg')",
        'fireplace-bg': "url('/fireplace-bg.png')",
        'waxpearls-bg': "url('/wax-pearls-bg.png')",
        // גרדיאנטים יוקרתיים
        'gold-black': 'linear-gradient(to bottom, #D4AF37, #0B0B0B)',
        'ivory-gradient': 'linear-gradient(to bottom, #FFF7E8, #F9F6EE)',
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(212, 175, 55, 0.1)',
        'gold': '0 4px 16px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
}

