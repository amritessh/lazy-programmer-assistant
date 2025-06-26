// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        // Secondary colors (sass pink)
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843'
        },
        // Dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: [
          'Fira Code',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'monospace'
        ]
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        gradient: 'gradient 3s ease infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5px)' },
          '50%': { transform: 'translateY(0)' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-secondary':
          'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.5)',
        'glow-secondary': '0 0 20px rgba(236, 72, 153, 0.5)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.5)'
      }
    }
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          'backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      };
      addUtilities(newUtilities);
    }
  ],
  darkMode: 'class'
};
