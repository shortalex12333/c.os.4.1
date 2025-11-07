/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Dark Mode Background Colors
        'celeste-dark': {
          'primary': '#0A0A0B',     // Deep space black
          'secondary': '#0F0F10',   // Void
          'tertiary': '#18181B',    // Carbon
          'hover': '#27272A',       // Graphite hover
          'active': '#3F3F46',      // Active state
        },
        // Dark Mode Text Colors
        'celeste-text': {
          'primary': '#FAFAFA',     // Pure white
          'secondary': '#E4E4E7',   // Pearl
          'muted': '#A1A1AA',       // Ash
          'disabled': '#71717A',    // Smoke
        },
        // Brand Colors
        'celeste-brand': {
          'primary': '#8B5CF6',     // Electric Violet
          'hover': '#7C3AED',       // Deep Violet
          'light': '#A78BFA',       // Soft Violet
          'accent': '#EC4899',      // Hot Pink
        },
        // System Colors
        'celeste-system': {
          'success': '#10B981',
          'warning': '#FBBF24',
          'error': '#EF4444',
          'info': '#3B82F6',
        },
        // Category Colors
        'celeste-cat': {
          'sales': '#10B981',
          'marketing': '#8B5CF6',
          'operations': '#3B82F6',
          'finance': '#FBBF24',
          'mindset': '#EC4899',
          'strategy': '#F97316',
        },
      },
      fontFamily: {
        'eloquia': ['Eloquia', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        'chat-xs': '0.75rem',     // 12px
        'chat-sm': '0.875rem',    // 14px
        'chat-base': '1rem',      // 16px
        'chat-lg': '1.125rem',    // 18px
        'chat-xl': '1.25rem',     // 20px
        'chat-2xl': '1.5rem',     // 24px
        'chat-3xl': '1.875rem',   // 30px
        'chat-4xl': '2.25rem',    // 36px
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'word-appear': 'wordAppear 0.1s ease-out forwards',
        'cursor-blink': 'cursorBlink 1s infinite',
        'typing-dot': 'typingDot 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' }
        },
        wordAppear: {
          'to': { opacity: '1' }
        },
        cursorBlink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        },
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '30%': { transform: 'translateY(-10px)', opacity: '1' }
        }
      },
      boxShadow: {
        'dark-sm': '0 2px 4px rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 12px rgba(0, 0, 0, 0.6)',
        'dark-lg': '0 10px 30px rgba(0, 0, 0, 0.7)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.4)',
      },
    },
  },
  plugins: [],
}
