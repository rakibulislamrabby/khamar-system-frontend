import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { authApi, dashboardApi, domainApi, inventoryApi, organizationApi } from '@/api';
import { daysBetween, monthName, toDate, type Lang } from '@/components/dashboard/format';
import type { Tone } from '@/components/dashboard/theme';
import type { IconName } from '@/components/dashboard/icons';
import { resolveId } from '@/lib/ids';
import type { Cost, InventoryItem, PoultryBatch, Sale } from '@/types/api';

const STALE = 30_000;

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, staleTime: STALE });
export const useSales = () => useQuery({ queryKey: ['sales', 'all'], queryFn: inventoryApi.allSales, staleTime: STALE });
export const useCosts = () => useQuery({ queryKey: ['costs', 'all'], queryFn: () => inventoryApi.allCosts(), staleTime: STALE });
export const useBatches = () => useQuery({ queryKey: ['poultry-batches', 'all'], queryFn: domainApi.allPoultryBatches, staleTime: STALE });
export const useCows = () => useQuery({ queryKey: ['cows', 'all'], queryFn: domainApi.allCows, staleTime: STALE });
export const useFarms = () => useQuery({ queryKey: ['farms', 'all'], queryFn: organizationApi.allFarms, staleTime: STALE });
export const useSheds = () => useQuery({ queryKey: ['sheds', 'all'], queryFn: () => organizationApi.allSheds(), staleTime: STALE });
export const useCustomers = () => useQuery({ queryKey: ['customers', 'all'], queryFn: organizationApi.allCustomers, staleTime: STALE });
export const useSuppliers = () => useQuery({ queryKey: ['suppliers', 'all'], queryFn: organizationApi.allSuppliers, staleTime: STALE });
export const useItems = () => useQuery({ queryKey: ['inventory', 'all'], queryFn: inventoryApi.allItems, staleTime: STALE });
export const usePurchases = () => useQuery({ queryKey: ['purchases', 'all'], queryFn: inventoryApi.allPurchases, staleTime: STALE });
export const useCategories = () => useQuery({ queryKey: ['cost-categories'], queryFn: inventoryApi.listCostCategories, staleTime: 5 * 60_000 });
export const useOrg = () => useQuery({ queryKey: ['organization'], queryFn: organizationApi.get, staleTime: STALE });
export const useUsers = (enabled = true) => useQuery({ queryKey: ['users', 'all'], queryFn: authApi.listUsers, staleTime: STALE, enabled });
export const useEggs = () => useQuery({ queryKey: ['eggs', 'recent'], queryFn: domainApi.recentEggs, staleTime: STALE });
export const useMilk = () => useQuery({ queryKey: ['milk', 'recent'], queryFn: domainApi.recentMilk, staleTime: STALE });

/** Refresh everything a write can touch; cheap because queries are cached per key. */
export function useRefreshAll() {
  const qc = useQueryClient();
  return useCallback(
    async (...keys: string[]) => {
      const list = keys.length ? keys : ['dashboard', 'sales', 'costs', 'poultry-batches', 'inventory', 'customers', 'farms', 'sheds'];
      await Promise.all([...new Set([...list, 'dashboard'])].map((k) => qc.invalidateQueries({ queryKey: [k] })));
    },
    [qc]
  );
}

export type Period = 'week' | 'month' | 'year';

export function periodRange(period: Period, offset = 0, now = new Date()) {
  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) - offset * 7);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { start, end };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end };
  }
  const start = new Date(now.getFullYear() - offset, 0, 1);
  return { start, end: new Date(start.getFullYear() + 1, 0, 1) };
}

export const saleDate = (s: Sale) => toDate(s.saleDate ?? s.createdAt);
export const costDate = (c: Cost) => toDate(c.costDate ?? c.createdAt);

export function inRange(d: Date | null, r: { start: Date; end: Date }) {
  return Boolean(d && d >= r.start && d < r.end);
}

export function sum<T>(rows: T[], pick: (r: T) => number | undefined | null) {
  return rows.reduce((acc, r) => acc + Number(pick(r) ?? 0), 0);
}

export function change(curr: number, prev: number) {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export function liveSales(sales: Sale[]) {
  return sales.filter((s) => s.status !== 'cancelled');
}

export function totalsFor(sales: Sale[], costs: Cost[], r: { start: Date; end: Date }) {
  const s = liveSales(sales).filter((x) => inRange(saleDate(x), r));
  const c = costs.filter((x) => inRange(costDate(x), r));
  const income = sum(s, (x) => x.totalAmount);
  const expense = sum(c, (x) => x.totalAmount);
  return { income, expense, net: income - expense, saleCount: s.length, costCount: c.length, sales: s, costs: c };
}

/** Buckets for the income vs expense chart. */
export function buckets(sales: Sale[], costs: Cost[], period: Period, lang: Lang, count?: number) {
  const n = count ?? (period === 'week' ? 12 : period === 'month' ? 12 : 5);
  const out: Array<{ label: string; a: number; b: number; start: Date; end: Date }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const r = periodRange(period, i);
    const t = totalsFor(sales, costs, r);
    out.push({ label: bucketLabel(period, r.start, lang), a: t.income, b: t.expense, ...r });
  }
  return out;
}

function weekOfYear(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7);
}

function bucketLabel(period: Period, start: Date, lang: Lang) {
  if (period === 'week') return `W${weekOfYear(start)}`;
  if (period === 'month') return monthName(start.getMonth(), lang);
  return String(start.getFullYear());
}

export function lastDays(n: number) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i));
    return { start: d, end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) };
  });
}

export function customerName(s: Sale) {
  const c = s.customerId;
  if (c && typeof c === 'object') return c.name;
  return null;
}

export function customerKey(s: Sale) {
  return resolveId(s.customerId) || null;
}

export function saleProduct(s: Sale) {
  const it = s.items?.[0];
  if (!it) return { name: s.saleNumber ?? '—', qty: '' };
  const extra = (s.items?.length ?? 0) > 1 ? ` +${(s.items?.length ?? 1) - 1}` : '';
  return { name: `${it.itemName.split(' · ')[0]}${extra}`, qty: `${groupQty(it.quantity)} ${unitShort(it.unit)}` };
}

function groupQty(v: number) {
  return Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toFixed(1);
}

export function unitShort(u?: string) {
  if (!u) return '';
  return ({ piece: 'pcs', animal: 'birds', liter: 'L', dozen: 'dozen', tray: 'trays', kg: 'kg' } as Record<string, string>)[u] ?? u;
}

export function due(s: Sale) {
  return Math.max(0, Number(s.receivableAmount ?? s.totalAmount - (s.receivedAmount ?? 0)));
}

export function received(s: Sale) {
  return Number(s.receivedAmount ?? s.totalAmount - due(s));
}

export function productVisual(name: string): { icon: IconName; tone: Tone } {
  const n = name.toLowerCase();
  if (/milk|দুধ/.test(n)) return { icon: 'milk', tone: 'sky' };
  if (/egg|ডিম/.test(n)) return { icon: 'egg', tone: 'gold' };
  if (/cow|cattle|bull|গরু/.test(n)) return { icon: 'barn', tone: 'violet' };
  return { icon: 'bird', tone: 'lime' };
}

export function costVisual(name?: string): { icon: IconName; tone: Tone } {
  const n = (name ?? '').toLowerCase();
  if (/chick|বাচ্চা/.test(n)) return { icon: 'bird', tone: 'lime' };
  if (/feed|খাদ্য|খাবার/.test(n)) return { icon: 'wheat', tone: 'gold' };
  if (/vaccin|টিকা/.test(n)) return { icon: 'syringe', tone: 'sky' };
  if (/medic|ঔষধ|ওষুধ/.test(n)) return { icon: 'drop', tone: 'violet' };
  if (/labou?r|salary|wage|মজুরি|বেতন/.test(n)) return { icon: 'users', tone: 'green' };
  if (/electric|water|utility|fuel|বিদ্যুৎ/.test(n)) return { icon: 'bolt', tone: 'coral' };
  return { icon: 'receipt', tone: 'gray' };
}

export function itemVisual(category?: string): { icon: IconName; tone: Tone } {
  switch (category) {
    case 'feed':
      return { icon: 'wheat', tone: 'gold' };
    case 'vaccine':
      return { icon: 'syringe', tone: 'sky' };
    case 'medicine':
      return { icon: 'drop', tone: 'violet' };
    case 'egg_tray':
      return { icon: 'egg', tone: 'gold' };
    case 'milk_can':
      return { icon: 'milk', tone: 'sky' };
    default:
      return { icon: 'box', tone: 'green' };
  }
}

const CYCLE_DAYS: Record<string, number> = { broiler: 35, sonali: 70, layer: 540, duck: 120, breeding: 400, mixed: 90 };

export function batchCycle(b: PoultryBatch) {
  const total = CYCLE_DAYS[b.birdType?.toLowerCase()] ?? 60;
  const day = Math.max(1, daysBetween(b.purchaseDate) + 1);
  return { day, total, pct: Math.min(100, (day / total) * 100) };
}

export function survival(b: PoultryBatch) {
  return b.initialQuantity ? (b.currentQuantity / b.initialQuantity) * 100 : 0;
}

export function mortalityPct(b: PoultryBatch) {
  if (b.mortalityPercentage != null) return b.mortalityPercentage;
  return b.initialQuantity ? ((b.mortalityCount ?? 0) / b.initialQuantity) * 100 : 0;
}

export function birdVisual(type?: string): { icon: IconName; tone: Tone } {
  const t = (type ?? '').toLowerCase();
  if (t === 'layer') return { icon: 'egg', tone: 'sky' };
  if (t === 'sonali') return { icon: 'bird', tone: 'gold' };
  if (t === 'duck') return { icon: 'drop', tone: 'sky' };
  return { icon: 'bird', tone: 'lime' };
}

export function shedName(b: PoultryBatch) {
  const s = b.shedId as unknown;
  if (s && typeof s === 'object' && 'name' in (s as object)) return (s as { name: string }).name;
  return null;
}

export function farmName(v: unknown) {
  if (v && typeof v === 'object' && 'name' in (v as object)) return (v as { name: string }).name;
  return null;
}

export function batchTitle(b: PoultryBatch) {
  const shed = shedName(b);
  return shed ? `${shed} · ${b.batchName}` : b.batchName;
}

export function isActiveBatch(b: PoultryBatch) {
  return b.status !== 'closed';
}

export function salesForBatch(sales: Sale[], batchId: string) {
  return liveSales(sales).filter((s) => s.items?.some((it) => String(it.referenceId ?? '') === batchId));
}

export function batchSaleAmount(s: Sale, batchId: string) {
  return sum(
    (s.items ?? []).filter((it) => String(it.referenceId ?? '') === batchId),
    (it) => it.total ?? it.quantity * it.rate
  );
}

export function costsForBatch(costs: Cost[], batchId: string) {
  return costs.filter((c) => String(c.referenceId ?? '') === batchId);
}

export function useBatchPl() {
  const sales = useSales();
  const costs = useCosts();
  return useCallback(
    (b: PoultryBatch) => {
      if (!sales.data || !costs.data) return b.profitLoss ?? 0;
      const income = sum(salesForBatch(sales.data, b._id), (s) => batchSaleAmount(s, b._id));
      return income - sum(costsForBatch(costs.data, b._id), (x) => x.totalAmount);
    },
    [sales.data, costs.data]
  );
}

export function isLow(item: InventoryItem) {
  return item.minStockLevel != null && item.currentStock <= item.minStockLevel;
}

export function stockLevel(item: InventoryItem): { pct: number; state: 'low' | 'running' | 'ok' } {
  const min = item.minStockLevel ?? 0;
  if (!min) return { pct: item.currentStock > 0 ? 70 : 0, state: item.currentStock > 0 ? 'ok' : 'low' };
  const ratio = item.currentStock / (min * 3);
  const state = item.currentStock <= min ? 'low' : item.currentStock <= min * 1.5 ? 'running' : 'ok';
  return { pct: Math.min(100, ratio * 100), state };
}

export function categoryTotals(costs: Cost[]) {
  const map = new Map<string, number>();
  for (const c of costs) {
    const k = c.categoryName || 'Other';
    map.set(k, (map.get(k) ?? 0) + Number(c.totalAmount || 0));
  }
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

export function incomeByProduct(sales: Sale[]) {
  const map = new Map<string, number>();
  for (const s of liveSales(sales)) {
    for (const it of s.items ?? []) {
      const k = it.itemName || s.saleNumber || 'Sale';
      map.set(k, (map.get(k) ?? 0) + Number(it.total ?? it.quantity * it.rate));
    }
    if (!s.items?.length) map.set(s.saleNumber ?? 'Sale', (map.get(s.saleNumber ?? 'Sale') ?? 0) + s.totalAmount);
  }
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

export const PALETTE = ['#006A4E', '#EFAE2E', '#3A7FF2', '#7B61FF', '#EC5A4A', '#13A06A', '#98A69F'];
