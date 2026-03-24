/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-variant': '#d9dde0',
        error: '#b31b25',
        'primary-container': '#67f4cd',
        background: '#f5f7f9',
        'tertiary-container': '#00cefe',
        tertiary: '#00647c',
        'inverse-primary': '#70fdd5',
        'outline-variant': '#abadaf',
        'on-secondary-container': '#005c52',
        surface: '#f5f7f9',
        'primary-fixed-dim': '#56e6bf',
        'on-tertiary-fixed-variant': '#004a5d',
        secondary: '#00675c',
        'surface-container-lowest': '#ffffff',
        'secondary-container': '#47fce4',
        'on-primary-container': '#005947',
        'tertiary-fixed': '#00cefe',
        'error-dim': '#9f0519',
        'surface-bright': '#f5f7f9',
        'surface-dim': '#d0d5d8',
        'on-secondary-fixed': '#004840',
        'on-surface-variant': '#595c5e',
        'on-primary-fixed-variant': '#00644f',
        primary: '#006853',
        'error-container': '#fb5151',
        'on-secondary-fixed-variant': '#00675c',
        'on-error-container': '#570008',
        'secondary-dim': '#005a50',
        'on-tertiary-fixed': '#002935',
        'on-error': '#ffefee',
        'inverse-surface': '#0b0f10',
        'surface-container-high': '#dfe3e6',
        'secondary-fixed': '#47fce4',
        'secondary-fixed-dim': '#2dedd6',
        'on-surface': '#2c2f31',
        'primary-dim': '#005b48',
        outline: '#747779',
        'tertiary-dim': '#00576d',
        'on-tertiary': '#e2f6ff',
        'tertiary-fixed-dim': '#00c0ec',
        'on-tertiary-container': '#004051',
        'surface-container-highest': '#d9dde0',
        'surface-container-low': '#eef1f3',
        'on-primary-fixed': '#004536',
        'on-primary': '#c5ffe9',
        'surface-container': '#e5e9eb',
        'on-secondary': '#c0fff3',
        'on-background': '#2c2f31',
        'surface-tint': '#006853',
        'primary-fixed': '#67f4cd',
        'inverse-on-surface': '#9a9d9f'
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'PingFang SC', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'PingFang SC', 'sans-serif'],
        label: ['Plus Jakarta Sans', 'PingFang SC', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '1.5rem',
        full: '9999px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
};
