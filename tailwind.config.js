/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        padma: {
          DEFAULT: '#006A4E',
          soft: '#E3F3EC',
          dark: '#004C38',
        },
        paddy: '#1F8A5B',
        leaf: '#3FAF7A',
        jute: '#D4A017',
        clay: '#C8102E',
        rice: '#F2F7F4',
        mist: '#E4EFE8',
        soil: '#14261D',
        ink: '#1A2E24',
        muted: '#5C7266',
        line: '#D5E3DA',
        danger: '#B42318',
        warning: '#B54708',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
