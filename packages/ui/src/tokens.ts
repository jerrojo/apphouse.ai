// =============================================================================
// packages/ui/src/tokens.ts
// design tokens — single source of truth for colors, spacing, typography, radii
// =============================================================================

export const colors = {
  // brand
  brand: {
    primary: '#111827',    // gray-900
    accent: '#2563eb',     // blue-600
    surface: '#ffffff',
    background: '#f9fafb', // gray-50
  },

  // therapeutic color system (ui agent philosophy)
  therapy: {
    trust: '#3b82f6',      // blue-500
    energy: '#f97316',     // orange-500
    calm: '#22c55e',       // green-500
    premium: '#a855f7',    // purple-500
    focus: '#06b6d4',      // cyan-500
    warmth: '#ef4444',     // red-500
  },

  // agent colors
  agents: {
    ux: { bg: '#faf5ff', text: '#7c3aed' },       // purple
    wireframes: { bg: '#eff6ff', text: '#2563eb' }, // blue
    ui: { bg: '#fdf2f8', text: '#db2777' },         // pink
    dev: { bg: '#fefce8', text: '#ca8a04' },        // yellow
    data: { bg: '#f0fdf4', text: '#16a34a' },       // green
    ai: { bg: '#ecfeff', text: '#0891b2' },         // cyan
    sales: { bg: '#fff7ed', text: '#ea580c' },      // orange
    cfo: { bg: '#ecfdf5', text: '#059669' },        // emerald
    pm: { bg: '#eef2ff', text: '#4f46e5' },         // indigo
  },

  // status
  status: {
    draft: '#9ca3af',
    cooking: '#f59e0b',
    live: '#22c55e',
    paused: '#6b7280',
    archived: '#d1d5db',
  },

  // neutrals
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
  32: '128px',
} as const;

export const radii = {
  none: '0px',        // sharp / corporate / serious
  sm: '4px',          // professional / clean
  md: '8px',          // friendly / modern (default)
  lg: '12px',         // playful / approachable
  xl: '16px',         // soft / welcoming
  '2xl': '24px',      // cards / containers
  full: '9999px',     // pills / bubbles / organic
} as const;

export const borders = {
  subtle: '1px',      // copy / dividers
  attention: '3px',   // notifications / highlights
  warning: '5px',     // critical / warnings
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '7xl': '4.5rem',   // 72px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const;

export const motion = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    cooking: '2000ms',  // cooking animation cycle
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;
