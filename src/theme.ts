export const colors = {
  background: '#F7F7F5',
  backgroundWarm: '#F3F1EC',
  primary: '#15171A',
  stress: '#FF6B6B',
  calm: '#54C7A2',
  insight: '#7C83FD',
  changing: '#F4B860',
  muted: '#73777D',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF1F4',
  border: 'rgba(21, 23, 26, 0.10)',
  white: '#FFFFFF',
  dark: '#111214',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 28,
  pill: 999,
} as const;

export function stressWarmth(score: number): string {
  if (score < 50) return colors.background;
  if (score < 70) return '#F6F4F2';
  return colors.backgroundWarm;
}
