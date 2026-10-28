import { copy, type DashCopy } from '@/components/dashboard/copy';
import type { Lang } from '@/components/dashboard/format';
import { useLocale } from '@/providers/locale-provider';

export function useDash(): { c: DashCopy; lang: Lang } {
  const { locale } = useLocale();
  return { c: copy[locale], lang: locale };
}
