export const colors = {
  background: '#F7F8FA',
  backgroundWarm: '#F3EFEA',
  primary: '#15171A',
  stress: '#FF6B6B',
  calm: '#5BC8A4',
  insight: '#5B6CFF',
  muted: '#9AA0A6',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF1F4',
  border: 'rgba(21, 23, 26, 0.08)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
  /** Space so the floating 2-min demo cue doesn't cover CTAs. */
  cue: 88,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 28,
  pill: 999,
} as const;

/** Soften background warmth as stress rises (0–100). */
export function stressWarmth(score: number): string {
  if (score < 50) return colors.background;
  if (score < 70) return '#F6F4F2';
  return colors.backgroundWarm;
}
