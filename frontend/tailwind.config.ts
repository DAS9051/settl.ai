import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand-navy': {
          DEFAULT: '#033F63',
          light:   '#0a5a8a',
          dark:    '#022a43',
        },
        'brand-teal': {
          DEFAULT: '#28666e',
          light:   '#3a8a93',
          dark:    '#1b464c',
        },
        'brand-sage': {
          DEFAULT: '#7c9885',
          light:   '#a2b8a9',
          dark:    '#5a7362',
        },
        'brand-olive': {
          DEFAULT: '#b5b682',
          light:   '#d0d1a8',
          dark:    '#8e8f5e',
        },
        'brand-cream': {
          DEFAULT: '#f8fafc',
          light:   '#ffffff',
          dark:    '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
}

export default config
