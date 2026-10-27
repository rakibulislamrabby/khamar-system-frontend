/** South Asian digit grouping: 121350 -> 1,21,350 (matches the Figma money style). */
export function groupBd(value: number) {
  const neg = value < 0;
  const [int, frac] = Math.abs(Math.round(value * 100) / 100).toString().split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const body = rest ? `${rest},${last3}` : last3;
  return `${neg ? '-' : ''}${body}${frac ? `.${frac.slice(0, 2)}` : ''}`;
}

export function bdt(value: number | null | undefined, opts: { sign?: boolean } = {}) {
  const v = Math.round(Number(value ?? 0));
  const sign = opts.sign && v > 0 ? '+' : v < 0 ? '-' : '';
  return `${sign}৳${groupBd(Math.abs(v))}`;
}

export function num(value: number | null | undefined, digits = 0) {
  const v = Number(value ?? 0);
  if (!Number.isFinite(v)) return '0';
  if (digits === 0) return groupBd(Math.round(v));
  return groupBd(Math.round(v * 10 ** digits) / 10 ** digits);
}

/** Axis labels: 120000 -> 1.2L, 90000 -> 90k. */
export function compact(value: number) {
  const v = Math.abs(value);
  if (v >= 10_000_000) return `${trim(value / 10_000_000)}Cr`;
  if (v >= 100_000) return `${trim(value / 100_000)}L`;
  if (v >= 1_000) return `${trim(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function trim(v: number) {
  return (Math.round(v * 10) / 10).toString();
}

export function pct(value: number | null | undefined, digits = 1) {
  const v = Number(value ?? 0);
  return `${Number.isFinite(v) ? v.toFixed(digits) : '0'}%`;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const MONTHS_LONG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_LONG_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

export type Lang = 'en' | 'bn';

export function toDate(value?: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function monthName(m: number, lang: Lang, long = false) {
  return (long ? (lang === 'bn' ? MONTHS_LONG_BN : MONTHS_LONG_EN) : lang === 'bn' ? MONTHS_BN : MONTHS_EN)[m];
}

/** "26 Oct" */
export function dayMonth(value: string | Date | null | undefined, lang: Lang) {
  const d = toDate(value);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${monthName(d.getMonth(), lang)}`;
}

/** "26 Oct 2026" */
export function fullDate(value: string | Date | null | undefined, lang: Lang) {
  const d = toDate(value);
  if (!d) return '—';
  return `${dayMonth(d, lang)} ${d.getFullYear()}`;
}

export function isoDay(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function daysBetween(from?: string | Date | null, to: Date = new Date()) {
  const d = toDate(from);
  if (!d) return 0;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function relativeTime(value: string | Date | null | undefined, lang: Lang) {
  const d = toDate(value);
  if (!d) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  const bn = lang === 'bn';
  if (mins < 1) return bn ? 'এইমাত্র' : 'Just now';
  if (mins < 60) return bn ? `${mins} মিনিট আগে` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return bn ? `${hrs} ঘণ্টা আগে` : `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return bn ? 'গতকাল' : 'Yesterday';
  if (days < 7) return bn ? `${days} দিন আগে` : `${days} days ago`;
  return dayMonth(d, lang);
}

export function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function titleCase(value?: string | null) {
  if (!value) return '—';
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  if (typeof document === 'undefined') return;
  const body = rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
