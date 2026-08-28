/**
 * Khamar design tokens — Bangladesh farm vernacular.
 * Padma green + harvest gold + cool rice mist (not cream/terracotta defaults).
 */

import { Platform } from 'react-native';

export const Palette = {
  padma: '#006A4E',
  paddy: '#1F8A5B',
  leaf: '#3FAF7A',
  jute: '#D4A017',
  clay: '#C8102E',
  rice: '#F2F7F4',
  mist: '#E4EFE8',
  soil: '#14261D',
  ink: '#1A2E24',
  muted: '#5C7266',
  white: '#FFFFFF',
  line: '#D5E3DA',
  danger: '#B42318',
  warning: '#B54708',
} as const;

export const Colors = {
  light: {
    text: Palette.ink,
    textSecondary: Palette.muted,
    background: Palette.rice,
    backgroundElement: Palette.white,
    backgroundSelected: Palette.mist,
    primary: Palette.padma,
    primarySoft: '#E3F3EC',
    accent: Palette.jute,
    danger: Palette.danger,
    border: Palette.line,
    success: Palette.paddy,
    cardShadow: 'rgba(20, 38, 29, 0.08)',
  },
  dark: {
    text: '#E8F2EC',
    textSecondary: '#9BB0A4',
    background: '#0D1712',
    backgroundElement: '#16241C',
    backgroundSelected: '#1E3228',
    primary: '#3FAF7A',
    primarySoft: '#1A3328',
    accent: '#E0B84A',
    danger: '#F97066',
    border: '#24382E',
    success: '#3FAF7A',
    cardShadow: 'rgba(0, 0, 0, 0.35)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    display: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    display: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    display: 'System',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    display: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 40,
  eight: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 88, android: 72 }) ?? 72;
export const MaxContentWidth = 860;
