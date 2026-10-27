import { useRouter, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  change,
  customerKey,
  customerName,
  due,
  liveSales,
  periodRange,
  productVisual,
  received,
  saleDate,
  saleProduct,
  sum,
  totalsFor,
  useCosts,
  useSales,
} from '@/components/dashboard/data';
import { bdt, dayMonth, downloadCsv, isoDay, monthName, pct } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { Btn, Card, Chips, IconTile, MenuItem, Pill, Popover, SearchBox, Select, Table, Tx, Empty } from '@/components/dashboard/kit';
import { useInvoicePdf } from '@/components/dashboard/pdf';
import { Page, PageTop, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import type { Sale } from '@/types/api';

const PAGE = 8;
type Filter = 'all' | 'paid' | 'due';

export function MoneyStat({ label, value, sub, variant = 'white', subColor }: { label: string; value: string; sub?: string; variant?: 'dark' | 'white' | 'gold'; subColor?: string }) {
  const bg = variant === 'dark' ? C.forest : variant === 'gold' ? C.goldSoft : C.white;
  return (
    <View style={{ flexGrow: 1, flexBasis: 220, minWidth: 0, backgroundColor: bg, borderRadius: 22, borderWidth: variant === 'white' ? 1 : 0, borderColor: C.line, padding: 20 }}>
      <Tx s={13} color={variant === 'dark' ? 'rgba(255,255,255,0.65)' : C.sub}>{label}</Tx>
      <Tx s={28} w="800" color={variant === 'dark' ? C.white : C.ink} tabular lines={1} style={{ marginTop: 6 }}>{value}</Tx>
      {sub ? <Tx s={12} w="700" color={subColor ?? (variant === 'dark' ? C.lime : variant === 'gold' ? C.goldInk : C.ink)} style={{ marginTop: 4 }} lines={1}>{sub}</Tx> : null}
    </View>
  );
}

export function WebSales() {
  const { c, lang } = useDash();
  const router = useRouter();
  const salesQ = useSales();
  const costsQ = useCosts();
  const pdf = useInvoicePdf();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [product, setProduct] = useState('all');
  const [month, setMonth] = useState('all');
  const [page, setPage] = useState(0);

  const all = useMemo(() => [...liveSales(salesQ.data ?? [])].sort((a, b) => +(saleDate(b) ?? 0) - +(saleDate(a) ?? 0)), [salesQ.data]);
  const thisMonth = totalsFor(all, costsQ.data ?? [], periodRange('month', 0));
  const lastMonth = totalsFor(all, costsQ.data ?? [], periodRange('month', 1));
  const mChange = change(thisMonth.income, lastMonth.income);
  const billed = sum(all, (s) => s.totalAmount);
  const collected = sum(all, received);
  const receivable = sum(all, due);
  const owing = new Set(all.filter((s) => due(s) > 0).map((s) => customerKey(s) ?? s._id)).size;

  const products = useMemo(() => [...new Set(all.map((s) => saleProduct(s).name.split(' · ')[0].replace(/ \+\d+$/, '')))].sort(), [all]);
  const months = useMemo(() => {
    const keys = new Set(all.map((s) => { const d = saleDate(s); return d ? `${d.getFullYear()}-${d.getMonth()}` : ''; }).filter(Boolean));
    return [...keys].map((k) => { const [y, m] = k.split('-').map(Number); return { value: k, label: `${monthName(m, lang, true)} ${y}` }; });
  }, [all, lang]);

  const base = all.filter((s) => {
    if (product !== 'all' && !saleProduct(s).name.startsWith(product)) return false;
    if (month !== 'all') { const d = saleDate(s); if (!d || `${d.getFullYear()}-${d.getMonth()}` !== month) return false; }
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      if (!(s.saleNumber ?? '').toLowerCase().includes(t) && !(customerName(s) ?? '').toLowerCase().includes(t)) return false;
    }
    return true;
  });
  const counts = { all: base.length, paid: base.filter((s) => due(s) <= 0).length, due: base.filter((s) => due(s) > 0).length };
  const rows = base.filter((s) => filter === 'all' || (filter === 'due' ? due(s) > 0 : due(s) <= 0));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PAGE, cur * PAGE + PAGE);

  const exportCsv = () =>
    downloadCsv('sales.csv', [
      ['Invoice', 'Date', 'Buyer', 'Phone', 'Product', 'Quantity', 'Amount', 'Received', 'Due', 'Notes'],
      ...rows.map((s) => {
        const p = saleProduct(s);
        const cust = typeof s.customerId === 'object' ? s.customerId : null;
        return [s.saleNumber, isoDay(saleDate(s) ?? new Date()), customerName(s) ?? '', cust?.phone ?? '', p.name, p.qty, s.totalAmount, received(s), due(s), s.notes ?? ''];
      }),
    ]);

  const top = (
    <PageTop
      crumbs={[c.money, c.sales]}
      title={c.sales}
      actions={
        <>
          <Btn label={c.exportExcel} icon="download" onPress={exportCsv} />
          <Btn label={c.newSale} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/sell')} />
        </>
      }
    />
  );

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <MoneyStat variant="dark" label={c.thisMonth} value={bdt(thisMonth.income)} sub={c.salesCount(thisMonth.saleCount) + (mChange == null ? '' : ` · ${mChange >= 0 ? '+' : ''}${mChange.toFixed(0)}%`)} />
        <MoneyStat label={c.collected} value={bdt(collected)} sub={c.ofBilled(pct(billed ? (collected / billed) * 100 : 0, 0))} subColor={C.emerald} />
        <MoneyStat variant="gold" label={c.receivable} value={bdt(receivable)} sub={c.buyersOwe(owing)} />
        <MoneyStat label={c.avgSale} value={bdt(all.length ? billed / all.length : 0)} sub={c.perInvoice} />
      </View>

      <Card pad={0}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, flexWrap: 'wrap' }}>
          <Chips
            value={filter}
            onChange={(f) => { setFilter(f); setPage(0); }}
            options={[
              { key: 'all', label: `${c.all} · ${counts.all}` },
              { key: 'paid', label: `${c.paid} · ${counts.paid}` },
              { key: 'due', label: `${c.due} · ${counts.due}` },
            ]}
          />
          <View style={{ flex: 1 }} />
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder={c.invoiceOrBuyer} width={220} />
          <Select height={40} value={product} onChange={(v) => { setProduct(v); setPage(0); }} options={[{ value: 'all', label: c.allProducts }, ...products.map((p) => ({ value: p, label: p }))]} style={{ width: 170 }} />
          <Select height={40} icon="cal" value={month} onChange={(v) => { setMonth(v); setPage(0); }} options={[{ value: 'all', label: c.allTime }, ...months]} style={{ width: 180 }} />
        </View>
        <Table
          rows={shown}
          rowKey={(s) => s._id}
          empty={<Empty icon="receipt" title={c.noSales} sub={c.noSalesSub} action={<Btn label={c.newSale} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/sell')} />} />}
          cols={[
            { key: 'inv', label: c.invoice, flex: 1 },
            { key: 'buyer', label: c.buyer, flex: 1.5 },
            { key: 'product', label: c.product, flex: 1.4 },
            { key: 'qty', label: c.quantity, flex: 0.9 },
            { key: 'amt', label: c.amount, flex: 1, align: 'right' },
            { key: 'rec', label: c.received, flex: 1, align: 'right' },
            { key: 'status', label: c.status, flex: 1.1, align: 'right' },
            { key: 'more', label: '', width: 36, align: 'center' },
          ]}
          render={(s, col) => {
            const p = saleProduct(s);
            if (col.key === 'inv')
              return (
                <View>
                  <Tx s={14} w="800" lines={1}>{s.saleNumber ?? '—'}</Tx>
                  <Tx s={12} color={C.sub}>{dayMonth(saleDate(s), lang)}</Tx>
                </View>
              );
            if (col.key === 'buyer') return <Tx s={14} w="600" lines={1}>{customerName(s) ?? c.walkIn}</Tx>;
            if (col.key === 'product') {
              const v = productVisual(p.name);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <IconTile name={v.icon} tone={v.tone} size={32} />
                  <Tx s={14} w="600" lines={1} style={{ flexShrink: 1 }}>{p.name.split(' · ')[0]}</Tx>
                </View>
              );
            }
            if (col.key === 'qty') return <Tx s={13} color={C.sub} lines={1}>{p.qty}</Tx>;
            if (col.key === 'amt') return <Tx s={14} w="800" tabular>{bdt(s.totalAmount)}</Tx>;
            if (col.key === 'rec') return <Tx s={13} color={C.sub} tabular>{bdt(received(s))}</Tx>;
            if (col.key === 'status') return due(s) > 0 ? <Pill label={c.dueAmt(bdt(due(s)))} tone="gold" /> : <Pill label={c.paid} tone="green" />;
            return <RowMenu sale={s} onPdf={() => pdf.download(s.saleNumber ?? 'invoice', [s])} />;
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.line }}>
          <Tx s={13} color={C.sub}>{rows.length ? c.showing(cur * PAGE + 1, Math.min(rows.length, cur * PAGE + PAGE), rows.length) : c.showing(0, 0, 0)}</Tx>
          <Pager page={cur} pages={pages} onChange={setPage} />
        </View>
      </Card>
    </Page>
  );
}

function RowMenu({ sale, onPdf }: { sale: Sale; onPdf: () => void }) {
  const { c } = useDash();
  const router = useRouter();
  const custId = customerKey(sale);
  return (
    <Popover
      width={220}
      align="right"
      trigger={(open) => (
        <Pressable onPress={open} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="dots" size={18} color={C.sub} />
        </Pressable>
      )}>
      {(close) => (
        <View style={{ paddingVertical: 6 }}>
          <MenuItem icon="download" label={c.downloadInvoice} onPress={() => { close(); onPdf(); }} />
          {custId ? <MenuItem icon="user" label={c.customer} onPress={() => { close(); router.navigate({ pathname: '/(app)/customers', params: { id: custId } } as Href); }} /> : null}
        </View>
      )}
    </Popover>
  );
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  const nums = Array.from({ length: pages }, (_, i) => i).filter((i) => pages <= 7 || i === 0 || i === pages - 1 || Math.abs(i - page) <= 1);
  const box = (key: string, label: ReactNode, active: boolean, onPress?: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      disabled={!onPress}
      style={{ minWidth: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, opacity: onPress || active ? 1 : 0.45 }}>
      {typeof label === 'string' ? <Tx s={13} w="700" color={active ? C.white : C.ink}>{label}</Tx> : label}
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {box('prev', <Icon name="left" size={15} />, false, page > 0 ? () => onChange(page - 1) : undefined)}
      {nums.map((i, idx) => (
        <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
          {idx > 0 && i - nums[idx - 1] > 1 ? <Tx s={13} color={C.faint} style={{ alignSelf: 'center' }}>…</Tx> : null}
          {box(String(i), String(i + 1), i === page, i === page ? undefined : () => onChange(i))}
        </View>
      ))}
      {box('next', <Icon name="right" size={15} />, false, page < pages - 1 ? () => onChange(page + 1) : undefined)}
    </View>
  );
}
