import type { IconName } from '@/components/dashboard/icons';
import type { Tone } from '@/components/dashboard/theme';
import type { Sale } from '@/types/api';

export type SaleKind = 'birds' | 'eggs' | 'milk' | 'other';

export function saleKind(s: Sale): SaleKind {
  const it = s.items?.[0];
  const name = (it?.itemName ?? '').toLowerCase();
  if (/egg|ডিম/.test(name) || it?.unit === 'tray' || it?.unit === 'dozen') return 'eggs';
  if (/milk|দুধ/.test(name) || it?.unit === 'liter') return 'milk';
  if (it?.referenceType === 'poultry_batch' || /broiler|bird|chick|layer|sonali|duck|মুরগি|হাঁস/.test(name)) return 'birds';
  return 'other';
}

export const KIND_VISUAL: Record<SaleKind, { icon: IconName; tone: Tone }> = {
  birds: { icon: 'bird', tone: 'lime' },
  eggs: { icon: 'egg', tone: 'gold' },
  milk: { icon: 'milk', tone: 'sky' },
  other: { icon: 'receipt', tone: 'green' },
};
