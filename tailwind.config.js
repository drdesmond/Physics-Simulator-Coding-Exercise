/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        flash: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        flow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        flash: 'flash 1s infinite',
        flow: 'flow 3s ease-in-out infinite',
      },
      backgroundImage: {
        'flow-gradient':
          'linear-gradient(90deg, #b45309 0%, #d97706 25%, #f59e0b 50%, #d97706 75%, #b45309 100%)',
        'flow-highlight':
          'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
