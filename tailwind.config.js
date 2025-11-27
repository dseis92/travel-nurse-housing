/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bgTop: '#EAF3FF',
          bgBottom: '#E3D4FF',
          purple: '#8F63FF',
          purpleSoft: '#A682FF',
          teal: '#32E4C2',
          orange: '#FF9F4C',
          pink: '#FF66C4',
          yellow: '#FFE177',
          textDark: '#1D1033',
          textMuted: '#747D9F',
        },
      },
      boxShadow: {
        soft: '0 20px 40px rgba(45,35,80,0.25)',
        softInner: '-6px -6px 16px rgba(255,255,255,0.9)',
      },
      borderRadius: {
        huge: '32px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
