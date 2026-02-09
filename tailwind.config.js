/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          'blurple': '#5865F2',
          'blurple-dark': '#4752C4',
          'green': '#57F287',
          'yellow': '#FEE75C',
          'fuchsia': '#EB459E',
          'red': '#ED4245',
          'dark': '#2C2F33',
          'darker': '#23272A',
          'darkest': '#1E1F22',
          'gray': '#4F545C',
          'light-gray': '#96989D',
        },
        github: {
          'dark': '#0D1117',
          'darker': '#010409',
          'border': '#30363D',
        }
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(88, 101, 242, 0.5)',
        'glow-green': '0 0 20px rgba(87, 242, 135, 0.5)',
        'glow-red': '0 0 20px rgba(237, 66, 69, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(88, 101, 242, 0.3)',
        'neon': '0 0 10px rgba(88, 101, 242, 0.8), 0 0 40px rgba(88, 101, 242, 0.6)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
