/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Inari Group — Liquid Glass, Lima Edition ─────────────
        bg:               '#F2EFE9',   // warm parchment
        'bg-deep':        '#1A1714',   // charcoal cálido — login left

        // Surface rgba (glass — usar con .glass/.glass-raised/.glass-frost)
        surface:          'rgba(255,255,255,0.65)',
        'surface-raised': 'rgba(255,255,255,0.85)',
        'surface-frost':  'rgba(242,239,233,0.80)',

        border:           'rgba(26,23,20,0.08)',
        'border-hover':   'rgba(26,23,20,0.14)',

        'text-primary':   '#1D1D1F',
        'text-secondary': '#6E6E73',
        'text-muted':     '#AEAEB2',
        'text-cream':     '#F2EFE9',

        accent:           '#E8572A',
        'accent-hover':   '#C94A1F',
        'accent-light':   '#FEF0EB',
        amber:            '#FF9500',
        ok:               '#34C759',
        danger:           '#FF3B30',
        warn:             '#FF9500',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs:    ['0.75rem',   { lineHeight: '1rem' }],
        sm:    ['0.875rem',  { lineHeight: '1.25rem' }],
        base:  ['1rem',      { lineHeight: '1.5rem' }],
        lg:    ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.5rem' }],
        '5xl': ['3rem',      { lineHeight: '1.08' }],
        '6xl': ['3.75rem',   { lineHeight: '1' }],
        '7xl': ['4.5rem',    { lineHeight: '0.98' }],
        '8xl': ['5rem',      { lineHeight: '0.98' }],
      },
      borderRadius: {
        none:    '0',
        sm:      '6px',
        DEFAULT: '10px',
        md:      '10px',
        lg:      '12px',
        xl:      '16px',
        '2xl':   '20px',
        card:    '16px',
        btn:     '12px',
        input:   '10px',
        badge:   '6px',
        full:    '9999px',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        normal:   '0',
        wide:     '0.04em',
        wider:    '0.10em',
        widest:   '0.18em',
      },
      boxShadow: {
        glass:       '0 8px 32px rgba(26,23,20,0.06), 0 2px 8px rgba(26,23,20,0.04)',
        'glass-hover':'0 16px 48px rgba(26,23,20,0.10), 0 4px 12px rgba(26,23,20,0.06)',
        accent:      '0 8px 24px rgba(232,87,42,0.28), 0 2px 6px rgba(232,87,42,0.18)',
        'accent-lg': '0 10px 28px rgba(232,87,42,0.34), 0 3px 8px rgba(232,87,42,0.22)',
        'inner-spec':'inset 0 0 0 0.5px rgba(255,255,255,0.85)',
        sm:          '0 1px 4px rgba(26,23,20,0.06)',
        md:          '0 4px 16px rgba(26,23,20,0.08)',
        lg:          '0 8px 32px rgba(26,23,20,0.10)',
      },
      animation: {
        'fade-in':    'fadeIn 220ms ease-out both',
        'slide-up':   'slideUp 220ms ease-out both',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
        'drift1':     'drift1 14s ease-in-out infinite',
        'drift2':     'drift2 16s ease-in-out infinite',
        'drift3':     'drift3 18s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.05)' },
        },
        drift1: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(80px,60px) scale(1.08)' },
        },
        drift2: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(-60px,-40px) scale(1.05)' },
        },
        drift3: {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)' },
          '50%':      { transform: 'translate(-44%,-58%) scale(1.10)' },
        },
      },
    },
  },
  plugins: [],
}
