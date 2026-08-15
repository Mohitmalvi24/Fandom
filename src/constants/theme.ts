/**
 * Centralized design tokens for the Fanon Comic Reader.
 * Dark-first, comic-themed aesthetic.
 */

export const Colors = {
  // Base palette
  background: '#0a0a0f',
  surface: '#141420',
  surfaceElevated: '#1c1c2e',
  surfaceHover: '#252540',

  // Accent
  primary: '#7c5cff',
  primaryMuted: '#5a3fd6',
  primaryGlow: 'rgba(124, 92, 255, 0.15)',
  secondary: '#ff6b9d',
  secondaryMuted: '#d94f7e',

  // Text
  textPrimary: '#f0eef6',
  textSecondary: '#9d99b0',
  textMuted: '#6b6580',

  // Semantic
  error: '#ff4757',
  errorBg: 'rgba(255, 71, 87, 0.12)',
  warning: '#ffa502',
  warningBg: 'rgba(255, 165, 2, 0.12)',
  success: '#2ed573',
  successBg: 'rgba(46, 213, 115, 0.12)',

  // Borders
  border: '#2a2a3e',
  borderSubtle: '#1e1e30',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1e1e30',
  skeletonHighlight: '#2a2a3e',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 999,
} as const;

export const Typography = {
  displayLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  displayMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

/** Max image height the API can return (used for zoom cap calculation) */
export const MAX_IMAGE_HEIGHT = 6000;

/** Max zoom scale: 4x is reasonable for 6000px images on most screens */
export const MAX_ZOOM_SCALE = 4;
export const MIN_ZOOM_SCALE = 1;
