/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0E0E11',
          card: '#16161C',
          elevated: '#1E1E26',
        },
        accent: {
          purple: '#6C5CE7',
          teal: '#00F5D4',
          'purple-hover': '#7D6FF0',
          'purple-dim': 'rgba(108,92,231,0.15)',
        },
        border: {
          glass: 'rgba(255,255,255,0.06)',
          subtle: 'rgba(255,255,255,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(108,92,231,0.3)',
        'glow-purple-lg': '0 0 60px rgba(108,92,231,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #6C5CE7, #8B7CF7)',
        'gradient-teal': 'linear-gradient(135deg, #00F5D4, #00C9B1)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(108,92,231,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,245,212,0.08) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
