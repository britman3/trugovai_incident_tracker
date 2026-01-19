import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        navy: '#0F2A3A',
        teal: '#1AA7A1',
        ice: '#F4F7F9',
        // Secondary
        slate: {
          700: '#4C5D6B',
        },
        mint: {
          300: '#71D1C8',
        },
        // Severity Colors
        severity: {
          critical: '#DC2626',
          high: '#FF6B6B',
          medium: '#F59E0B',
          low: '#7BC96F',
        },
        // Status Colors
        status: {
          open: '#FF6B6B',
          inProgress: '#F59E0B',
          resolved: '#7BC96F',
          closed: '#6B7280',
          escalated: '#DC2626',
          reopened: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        h1: ['44px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5' }],
        small: ['14px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        DEFAULT: '14px',
        button: '8px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
