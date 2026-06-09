/**
 * PRISMA Design Tokens — Mobile
 * Mirrors the web PRISMA design system for consistent cross-platform branding.
 * Use these tokens everywhere instead of hardcoded color/spacing values.
 */

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:        "#0a0a12",   // deepest surface
  surface:           "#0f0f1a",   // card / sheet backgrounds
  surfaceElevated:   "#161625",   // modals, popovers
  surfaceOverlay:    "#1d1d2e",   // hover states

  // ── Borders ───────────────────────────────────────────────────────────────
  border:            "#2a2a3d",
  borderSubtle:      "#1e1e2e",

  // ── Text ──────────────────────────────────────────────────────────────────
  foreground:        "#e8e8f0",   // primary text
  muted:             "#6b6b8a",   // secondary / placeholder
  faint:             "#3a3a52",   // disabled / very subtle

  // ── Accent (violet) ───────────────────────────────────────────────────────
  accent:            "#8b5cf6",   // primary CTA
  accentSubtle:      "#8b5cf614", // tinted backgrounds
  accentHover:       "#7c3aed",

  // ── Division colors (13 industry verticals) ───────────────────────────────
  divisions: {
    saas:            "#8b5cf6",
    ecommerce:       "#f59e0b",
    fashion:         "#ec4899",
    fintech:         "#10b981",
    health:          "#06b6d4",
    media:           "#f97316",
    gaming:          "#a855f7",
    education:       "#3b82f6",
    realestate:      "#84cc16",
    industrial:      "#6b7280",
    b2b:             "#0ea5e9",
    social:          "#22c55e",
    hospitality:     "#ef4444",
  },

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:           "#22c55e",
  warning:           "#f59e0b",
  error:             "#ef4444",
  info:              "#3b82f6",
} as const;

export const typography = {
  // Font families — load via expo-font
  display:  "Inter_700Bold",
  body:     "Inter_400Regular",
  medium:   "Inter_500Medium",
  semibold: "Inter_600SemiBold",

  // Size scale
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  "2xl": 30,
  "3xl": 36,
  "4xl": 48,

  // Line heights
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.75,
} as const;

export const spacing = {
  "0":   0,
  "1":   4,
  "2":   8,
  "3":   12,
  "4":   16,
  "5":   20,
  "6":   24,
  "8":   32,
  "10":  40,
  "12":  48,
  "16":  64,
  "20":  80,
} as const;

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  "2xl": 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const animation = {
  fast:   150,
  normal: 250,
  slow:   400,
} as const;
