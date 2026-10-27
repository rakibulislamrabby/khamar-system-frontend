import { C as LANDING } from '@/components/web-landing/theme';

/** Field Ledger tokens (Figma "00 · Cover & design system") plus dashboard-only ink shades. */
export const C = {
  ...LANDING,
  coralInk: '#B8382A',
  goldInk: '#B07A00',
  skyInk: '#2A62C9',
  violetInk: '#5B44D6',
  head: '#F6F9F7',
  overlay: 'rgba(8, 26, 19, 0.46)',
} as const;

export const FONT = 'Inter, "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif';

export const SIDEBAR_W = 264;
export const TOPBAR_H = 84;
export const RADIUS = 22;

export type Tone = 'green' | 'gold' | 'coral' | 'sky' | 'violet' | 'gray' | 'lime' | 'dark';

export const TONES: Record<Tone, { bg: string; fg: string; ink: string }> = {
  green: { bg: C.mint, fg: C.padma, ink: C.padma },
  gold: { bg: C.goldSoft, fg: C.gold, ink: C.goldInk },
  coral: { bg: C.coralSoft, fg: C.coral, ink: C.coralInk },
  sky: { bg: C.skySoft, fg: C.sky, ink: C.skyInk },
  violet: { bg: C.violetSoft, fg: C.violet, ink: C.violetInk },
  gray: { bg: '#EEF2EF', fg: C.sub, ink: C.sub },
  lime: { bg: C.limeSoft, fg: C.padma, ink: C.padma },
  dark: { bg: C.forest, fg: C.lime, ink: C.lime },
};
