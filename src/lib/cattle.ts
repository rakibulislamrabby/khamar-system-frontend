import type { CowPurpose } from '@/types/api';

/** Farm-level cattle book. `beef` is fattening (মোটাতাজাকরণ). */
export type CattleLogic = 'dairy' | 'beef' | 'mixed';

export function cattleLogic(purpose?: CowPurpose | null): CattleLogic {
  if (purpose === 'beef') return 'beef';
  if (purpose === 'mixed' || purpose === 'breeding') return 'mixed';
  return 'dairy';
}

export function isFatteningAnimal(purpose?: CowPurpose | null) {
  return purpose === 'beef';
}

export function daysOnFeed(from?: string | null) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

export function weightGain(entry?: number | null, current?: number | null) {
  if (entry == null || current == null) return null;
  return Math.round((current - entry) * 10) / 10;
}
