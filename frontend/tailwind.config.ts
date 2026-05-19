import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette (from mockups)
        charcoal: '#2C2C2A',
        beige: '#F5F4EF',

        // Status colors
        success: '#22C55E',
        warning: '#F97316',
        error: '#DC2626',

        // Secondary/Alternate
        'error-light': '#EF4444',
        'success-alt': '#4CAF50',
        'warning-alt': '#FF9800',
        'error-alt': '#E53935',

        // UI colors
        'dark-scanner': '#0D0D0D',
        'map-light': '#93C5FD',
        'map-lighter': '#BFDBFE',
        'border-subtle': 'rgba(0,0,0,0.07)',
        'border-light': 'rgba(0,0,0,0.12)',

        // Semantic naming
        primary: '#2C2C2A',
        secondary: '#9CA3AF',
        accent: '#F5F4EF',

        // Background variations
        'bg-app': '#F5F4EF',
        'bg-surface': '#FFFFFF',
        'bg-subtle': '#EEEDE8',
        'bg-light': '#F9FAFB',
        'bg-lighter': '#FAFAFA',
      },

      fontSize: {
        xs: ['9px', { lineHeight: '1.2' }],
        'xs-sm': ['10px', { lineHeight: '1.2' }],
        sm: ['11px', { lineHeight: '1.4' }],
        base: ['12px', { lineHeight: '1.4' }],
        'base-lg': ['13px', { lineHeight: '1.5' }],
        'base-xl': ['14px', { lineHeight: '1.5' }],
        lg: ['15px', { lineHeight: '1.6' }],
        'lg-xl': ['16px', { lineHeight: '1.6' }],
        'lg-2xl': ['17px', { lineHeight: '1.5' }],
        xl: ['18px', { lineHeight: '1.5' }],
        '2xl': ['20px', { lineHeight: '1.2' }],
        '3xl': ['22px', { lineHeight: '1.2' }],
        '4xl': ['28px', { lineHeight: '1.1' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        'extra-bold': '800',
      },

      spacing: {
        'xs': '3px',
        'xs-sm': '4px',
        'xs-md': '5px',
        'xs-lg': '6px',
        'sm': '8px',
        'sm-md': '10px',
        'md': '12px',
        'md-lg': '14px',
        'lg': '16px',
        'lg-xl': '18px',
        'lg-2xl': '20px',
        'xl': '24px',
        'xl-2xl': '28px',
        'xl-3xl': '32px',
      },

      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '14px',
        'xl': '20px',
        'full': '9999px',
      },

      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.08)',
        'subtle-md': '0 1px 4px rgba(0,0,0,0.06)',
        'sm': '0 2px 8px rgba(0,0,0,0.1)',
        'md': '0 4px 12px rgba(0,0,0,0.1)',
        'md-lg': '0 4px 12px rgba(0,0,0,0.15)',
        'lg': '0 8px 24px rgba(0,0,0,0.25)',
        'glow-green': '0 0 8px #22C55E',
        'glow-green-md': '0 0 10px 2px rgba(34,197,94,0.5)',
        'glow-blue': '0 2px 10px rgba(59,130,246,0.6)',
      },

      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.5' },
        },
        'pulse-scale-gps': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.08)', opacity: '0.3' },
        },
        scanline: {
          '0%, 100%': { top: '6%' },
          '50%': { top: '88%' },
        },
        'rotate-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(18px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(-18px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'pulse': 'pulse 1.4s ease-in-out infinite',
        'pulse-scale': 'pulse-scale 1.2s ease-in-out infinite',
        'pulse-scale-gps': 'pulse-scale-gps 2s ease-in-out infinite',
        'scanline': 'scanline 2.6s ease-in-out infinite',
        'spin-slow': 'rotate-spin 0.8s linear infinite',
        'slide-in-right': 'slide-in-right 0.22s ease-in-out',
        'slide-out-left': 'slide-out-left 0.22s ease-in-out',
        'fade-in-up': 'fade-in-up 0.4s ease-in-out',
      },
    },

    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
    },
  },

  plugins: [],
} satisfies Config;
