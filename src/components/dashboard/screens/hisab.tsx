import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Donut, PairBarChart } from '@/components/dashboard/charts';
import {
  PALETTE,
  categoryTotals,
  change,
  customerName,
  due,
  periodRange,
  saleDate,
  totalsFor,
  useCosts,
  useSales,
  type Period,
} from '@/components/dashboard/data';
import { bdt, compact, dayMonth, monthName, pct } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { Btn, Card, CardHead, Divider, Empty, IconTile, Pill, Segmented, Tx } from '@/components/dashboard/kit';
import { useInvoicePdf } from '@/components/dashboard/pdf';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import { Contours } from '@/components/web-landing/graphics';
import type { Lang } from '@/components/dashboard/format';
import type { Sale } from '@/types/api';

function periodLabel(period: Period, r: { start: Date; end: Date }, lang: Lang) {
  if (period === 'year') return String(r.start.getFullYear());
  if (period === 'month') return `${monthName(r.start.getMonth(), lang, true)} ${r.start.getFullYear()}`;
  const last = new Date(r.end.getTime() - 86_400_000);
  return `${dayMonth(r.start, lang)} – ${dayMonth(last, lang)}`;
}

function subBuckets(period: Period, r: { start: Date; end: Date }, lang: Lang) {
  const out: Array<{ label: string; start: Date; end: Date }> = [];
  if (period === 'year') {
    for (let m = 0; m < 12; m++) out.push({ label: monthName(m, lang), start: new Date(r.start.getFullYear(), m, 1), end: new Date(r.start.getFullYear(), m + 1, 1) });
  } else if (period === 'week') {
    for (let d = 0; d < 7; d++) {
      const s = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate() + d);
      out.push({ label: dayMonth(s, lang), start: s, end: new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1) });
    }
  } else {
    for (let s = new Date(r.start); s < r.end; s = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7)) {
      const e = new Date(Math.min(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7).getTime(), r.end.getTime()));
      out.push({ label: `${s.getDate()}–${new Date(e.getTime() - 86_400_000).getDate()}`, start: s, end: e });
    }
  }
  return out;
}

const productGroup = (name: string) => name.split(' · ')[0];

export function WebHisab() {
  const { c, lang } = useDash();
  const router = useRouter();
  const width = useContentWidth();
  const wide = width >= 1040;
  const salesQ = useSales();
  const costsQ = useCosts();
  const pdf = useInvoicePdf();
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);

  const range = periodRange(period, offset);
  const prevRange = periodRange(period, offset + 1);
  const label = periodLabel(period, range, lang);
  const sales = salesQ.data ?? [];
  const costs = costsQ.data ?? [];
  const now = totalsFor(sales, costs, range);
  const prev = totalsFor(sales, costs, prevRange);
  const margin = now.income ? (now.net / now.income) * 100 : 0;
  const incChange = change(now.income, prev.income);
  const expChange = change(now.expense, prev.expense);

  const flow = useMemo(
    () => subBuckets(period, range, lang).map((b) => { const t = totalsFor(sales, costs, b); return { label: b.label, a: t.income, b: t.expense }; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, offset, lang, sales, costs]
  );

  const cats = categoryTotals(now.costs);
  const topCats = cats.slice(0, 5);
  const restCats = cats.slice(5).reduce((a, x) => a + x.total, 0);
  const legend = [...topCats, ...(restCats ? [{ name: c.other, total: restCats }] : [])];

  const incomeRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of now.sales) {
      if (!s.items?.length) map.set(s.saleNumber ?? c.sales, (map.get(s.saleNumber ?? c.sales) ?? 0) + s.totalAmount);
      for (const it of s.items ?? []) {
        const k = productGroup(it.itemName || c.sales);
        map.set(k, (map.get(k) ?? 0) + Number(it.total ?? it.quantity * it.rate));
      }
    }
    return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [now.sales, c.sales]);

  const invoices = [...now.sales].sort((a, b) => +(saleDate(b) ?? 0) - +(saleDate(a) ?? 0));
  const changeText = (v: number | null) => (v == null ? '' : ` · ${v >= 0 ? '+' : ''}${v.toFixed(0)}%`);
  const lastDay = new Date(range.end.getTime() - 86_400_000);

  const top = (
    <PageTop
      crumbs={[c.money, c.hisab]}
      title={c.hisabFor(label)}
      actions={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Btn icon="left" kind="ghost" size="sm" onPress={() => setOffset((o) => o + 1)} />
            <Btn icon="right" kind="ghost" size="sm" disabled={offset === 0} onPress={() => setOffset((o) => Math.max(0, o - 1))} />
          </View>
          <Segmented
            value={period}
            onChange={(p) => { setPeriod(p); setOffset(0); }}
            options={[
              { key: 'week', label: c.week },
              { key: 'month', label: c.month },
              { key: 'year', label: c.year },
            ]}
            style={{ width: 260 }}
          />
          <Btn label={c.downloadPdf} icon="download" kind="dark" loading={pdf.busy} onPress={() => pdf.download(`Hisab ${label}`, now.sales, now.costs)} />
        </>
      }
    />
  );

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Card dark pad={22} style={{ flexGrow: 1, flexBasis: 300 }}>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Contours w={520} h={180} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 1.2 }}>{c.netResult.toUpperCase()}</Tx>
            <Tx s={12} w="700" color={now.net >= 0 ? C.lime : '#FF8B7D'}>{now.net >= 0 ? c.profit : c.loss}</Tx>
          </View>
          <Tx s={38} w="800" color={now.net >= 0 ? C.lime : '#FF8B7D'} tabular style={{ marginTop: 12 }}>{bdt(now.net, { sign: true })}</Tx>
          <Tx s={13} color="rgba(255,255,255,0.65)" style={{ marginTop: 4 }}>
            {[now.income ? c.margin(pct(margin)) : null, prev.net || prev.income ? c.vsPrev(bdt(prev.net, { sign: true })) : null].filter(Boolean).join(' · ') || '—'}
          </Tx>
        </Card>
        <Card pad={22} style={{ flexGrow: 1, flexBasis: 280 }}>
          <IconTile name="up" tone="lime" size={40} />
          <Tx s={13} color={C.sub} style={{ marginTop: 14 }}>{c.totalIncome}</Tx>
          <Tx s={30} w="800" tabular>{bdt(now.income)}</Tx>
          <Tx s={12} w="600" color={C.emerald} style={{ marginTop: 4 }}>{c.salesCount(now.saleCount) + changeText(incChange)}</Tx>
        </Card>
        <Card pad={22} style={{ flexGrow: 1, flexBasis: 280 }}>
          <IconTile name="trendDown" tone="coral" size={40} />
          <Tx s={13} color={C.sub} style={{ marginTop: 14 }}>{c.totalExpense}</Tx>
          <Tx s={30} w="800" tabular>{bdt(now.expense)}</Tx>
          <Tx s={12} w="600" color={C.coral} style={{ marginTop: 4 }}>{c.costsCount(now.costCount) + changeText(expChange)}</Tx>
        </Card>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
        <Card style={{ flex: 1.75 }}>
          <CardHead
            title={c.cashFlow}
            sub={c.cashFlowSub}
            right={
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <LegendDot color={C.padma} label={c.income} />
                <LegendDot color="#F4A79C" label={c.expense} />
              </View>
            }
          />
          <View style={{ marginTop: 18 }}>
            <PairBarChart data={flow} height={240} />
          </View>
        </Card>
        <Card style={{ flex: 1 }}>
          <Tx s={17} w="700">{c.whereMoneyWent}</Tx>
          {legend.length ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
              <Donut size={150} sw={20} segs={legend.map((x, i) => ({ p: now.expense ? x.total / now.expense : 0, color: PALETTE[i % PALETTE.length] }))}>
                <Tx s={11} color={C.sub}>{c.expense}</Tx>
                <Tx s={17} w="800" tabular>৳{compact(now.expense)}</Tx>
              </Donut>
              <View style={{ flex: 1, minWidth: 150, gap: 11 }}>
                {legend.map((x, i) => (
                  <View key={x.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <Tx s={13} w="600" lines={1} style={{ flex: 1 }}>{x.name}</Tx>
                    <Tx s={13} color={C.sub} tabular>{pct(now.expense ? (x.total / now.expense) * 100 : 0, 0)}</Tx>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Empty icon="receipt" title={c.nothingHere} />
          )}
        </Card>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Card style={{ flex: 1.3, width: wide ? undefined : '100%' }}>
          <CardHead title={c.plStatement} right={<Tx s={12} color={C.sub}>{`${dayMonth(range.start, lang)} – ${dayMonth(lastDay, lang)} ${lastDay.getFullYear()}`}</Tx>} />
          <StatementSection title={c.income} color={C.emerald} rows={incomeRows} totalLabel={c.totalIncomeRow} total={now.income} empty={c.noSales} />
          <StatementSection title={c.expense} color={C.coral} rows={cats} totalLabel={c.totalExpenseRow} total={now.expense} empty={c.noCosts} />
          <View style={{ marginTop: 18, borderRadius: 16, backgroundColor: now.net >= 0 ? C.limeSoft : C.coralSoft, paddingHorizontal: 18, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tx s={15} w="800">{now.net >= 0 ? c.netProfit : c.loss}</Tx>
            <Tx s={26} w="800" color={now.net >= 0 ? C.padma : C.coralInk} tabular>{bdt(now.net, { sign: true })}</Tx>
          </View>
        </Card>

        <Card pad={0} style={{ flex: 1, width: wide ? undefined : '100%' }}>
          <CardHead title={c.invoices} sub={c.nThisPeriod(invoices.length)} right={<Btn label={c.all} size="sm" onPress={() => router.navigate('/(app)/sales')} />} style={{ padding: 20, paddingBottom: 12 }} />
          {invoices.length ? (
            invoices.slice(0, 7).map((s, i) => <InvoiceRow key={s._id} sale={s} first={i === 0} onDownload={() => pdf.download(s.saleNumber ?? 'invoice', [s])} />)
          ) : (
            <View style={{ padding: 20 }}>
              <Empty icon="file" title={c.nothingHere} />
            </View>
          )}
        </Card>
      </View>
    </Page>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
      <Tx s={12} color={C.sub}>{label}</Tx>
    </View>
  );
}

function StatementSection({ title, color, rows, totalLabel, total, empty }: { title: string; color: string; rows: Array<{ name: string; total: number }>; totalLabel: string; total: number; empty: string }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Tx s={11} w="800" color={color} style={{ letterSpacing: 1.2, marginBottom: 6 }}>{title.toUpperCase()}</Tx>
      {rows.length ? (
        rows.map((r) => (
          <View key={r.name}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, gap: 12 }}>
              <Tx s={14} lines={1} style={{ flex: 1 }}>{r.name}</Tx>
              <Tx s={14} w="600" tabular>{bdt(r.total)}</Tx>
            </View>
            <Divider />
          </View>
        ))
      ) : (
        <Tx s={13} color={C.faint} style={{ paddingVertical: 11 }}>{empty}</Tx>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
        <Tx s={14} w="800">{totalLabel}</Tx>
        <Tx s={15} w="800" tabular>{bdt(total)}</Tx>
      </View>
    </View>
  );
}

function InvoiceRow({ sale, first, onDownload }: { sale: Sale; first: boolean; onDownload: () => void }) {
  const { c } = useDash();
  const d = due(sale);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="file" size={17} color={C.padma} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={14} w="700" lines={1}>{sale.saleNumber ?? '—'}</Tx>
        <Tx s={12} color={C.sub} lines={1}>{customerName(sale) ?? c.walkIn}</Tx>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Tx s={14} w="800" tabular>{bdt(sale.totalAmount)}</Tx>
        <Pill label={d > 0 ? c.due : c.paid} tone={d > 0 ? 'gold' : 'green'} />
      </View>
      <Btn icon="download" size="sm" onPress={onDownload} />
    </View>
  );
}
