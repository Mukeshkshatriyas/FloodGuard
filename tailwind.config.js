/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./maps/**/*.{js,jsx,ts,tsx}",
    "./charts/**/*.{js,jsx,ts,tsx}",
    "./tables/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Geist — precise, technical, calm. Matches the control-room character.
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Graphite ramp — deepest to lightest surface, with hairline and text roles.
        // Exact tokens from the unslop tokens.md dark/graphite column.
        g: {
          950: '#0f0f10',   // Sidebar, deepest chrome
          900: '#141415',   // Page background
          800: '#19191b',   // Card surface
          700: '#232325',   // Raised — active row, input bg
          600: '#2e2e30',   // Subtle hover
          border: 'rgba(237,237,237,0.08)', // Hairline = primary text at 8%
          line:   '#2a2a2d',              // Explicit hairline colour for borders
        },
        text: {
          primary:   '#ededed',
          secondary: '#a1a1a6',
          muted:     '#85858b',
        },
        // Accent: teal — taken from the world (radar, rivers, map overlays).
        // Desaturated, calm — not neon cyan.
        accent: {
          DEFAULT: '#2dd4bf', // teal-400 — clear, readable, less electric than cyan
          dim:     '#0d9488', // teal-600 — for text on dark backgrounds
        },
        // Semantic — toned to sit inside the graphite ramp
        ok:   { DEFAULT: '#4cc38a', dim: '#166534' },
        warn: { DEFAULT: '#f59e0b', dim: '#92400e' },
        risk: { DEFAULT: '#e5484d', dim: '#7f1d1d' },
      },
      boxShadow: {
        // Surface steps — no colored glows
        card: '0 1px 0 rgba(237,237,237,0.04) inset, 0 0 0 1px rgba(237,237,237,0.06)',
        float: '0 8px 24px rgba(0,0,0,0.4)',
        // Inset top highlight for primary buttons on dark
        btn: 'inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      borderRadius: {
        control: '8px',
        card:    '12px',
        panel:   '16px',
      },
      fontSize: {
        // Ops type scale: 12 meta / 13 base / 14-15 section heads / 20 page title
        // Only the risk number breaks this scale (handled inline).
        '2xs': ['11px', { lineHeight: '16px' }],
        'xs':  ['12px', { lineHeight: '18px' }],
        'sm':  ['13px', { lineHeight: '20px' }],
        'base':['13px', { lineHeight: '20px' }],
        'md':  ['14px', { lineHeight: '20px' }],
        'lg':  ['15px', { lineHeight: '22px' }],
        'xl':  ['17px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
      },
      transitionTimingFunction: {
        // One easing curve for everything
        ui: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    }
  },
  plugins: []
};
