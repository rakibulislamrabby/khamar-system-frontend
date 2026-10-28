import { useDesktopWeb, WebHisab } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';

import { organizationApi } from '@/api';
import {
  PALETTE,
  categoryTotals,
  customerName,
  due,
  periodRange,
  saleDate,
  totalsFor,
  unitShort,
  useCosts,
  useSales,
  type Period,
} from '@/components/dashboard/data';
import { bdt, dayMonth, monthName, num, pct, type Lang } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  CircleBtn,
  EmptyCard,
  Loading,
  MButton,
  MCard,
  MPill,
  MScreen,
  MSegmented,
  SectionHead,
  Sheet,
  SheetRow,
  TitleHeader,
  ToneTile,
  Tx,
} from '@/components/mobile/kit';
import { Contours } from '@/components/web-landing/graphics';
import { buildHisabInvoiceHtml } from '@/lib/hisab-pdf';
import { downloadInvoicePdf } from '@/lib/print-invoice';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

const WEEKDAYS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  bn: ['সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি', 'রবি'],
};

function periodLabel(period: Period, r: { start: Date; end: Date }, lang: Lang) {
  if (period === 'year') return String(r.start.getFullYear());
  if (period === 'month') return `${monthName(r.start.getMonth(), lang, true)} ${r.start.getFullYear()}`;
  const last = new Date(r.end.getTime() - 86_400_000);
  return `${dayMonth(r.start, lang)} – ${dayMonth(last, lang)}`;
}

function subBuckets(period: Period, r: { start: Date; end: Date }, lang: Lang, weekN: (n: number) => string) {
  const out: Array<{ label: string; start: Date; end: Date }> = [];
  if (period === 'year') {
    for (let m = 0; m < 12; m++) out.push({ label: monthName(m, lang).slice(0, 3), start: new Date(r.start.getFullYear(), m, 1), end: new Date(r.start.getFullYear(), m + 1, 1) });
  } else if (period === 'week') {
    for (let d = 0; d < 7; d++) {
      const s = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate() + d);
      out.push({ label: WEEKDAYS[lang][d], start: s, end: new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1) });
    }
  } else {
    let i = 1;
    for (let s = new Date(r.start); s < r.end; s = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7)) {
      const e = new Date(Math.min(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7).getTime(), r.end.getTime()));
      out.push({ label: weekN(i++), start: s, end: e });
    }
  }
  return out;
}

function HisabScreen() {
  const { c, lang } = useM();
  const { t, locale } = useLocale();
  const { organization, user } = useAuth();
  const [printing, setPrinting] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);
  const [picker, setPicker] = useState(false);

  const costsQ = useCosts();
  const salesQ = useSales();
  const org = useQuery({
    queryKey: ['organization'],
    queryFn: organizationApi.get,
  });

  const range = periodRange(period, offset);
  const label = periodLabel(period, range, lang);
  const now = totalsFor(salesQ.data ?? [], costsQ.data ?? [], range);
  const margin = now.income ? (now.net / now.income) * 100 : 0;
  const isProfit = now.net >= 0;

  const flow = useMemo(
    () =>
      subBuckets(period, range, lang, c.weekN).map((b) => {
        const x = totalsFor(salesQ.data ?? [], costsQ.data ?? [], b);
        return { label: b.label, a: x.income, b: x.expense };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, offset, lang, salesQ.data, costsQ.data]
  );

  const cats = categoryTotals(now.costs);
  const rest = cats.slice(5).reduce((a, x) => a + x.total, 0);
  const legend = [...cats.slice(0, 5), ...(rest ? [{ name: c.other, total: rest }] : [])];
  const invoice = [...now.sales].sort((a, b) => +(saleDate(b) ?? 0) - +(saleDate(a) ?? 0))[0];

  const onDownloadPdf = async () => {
    try {
      setPrinting(true);
      const html = buildHisabInvoiceHtml({
        org: org.data ?? organization,
        orgFallbackName: organization?.name || 'Khamar Manager',
        preparedBy: user?.name,
        costs: now.costs,
        sales: now.sales,
        locale,
        labels: {
          appName: t('appName'),
          invoiceNo: t('invoiceNoLabel'),
          phone: t('phoneShort'),
          product: t('pdfProduct'),
          qtyUnit: t('pdfQtyUnit'),
          rate: t('pdfRate'),
          amount: t('amount'),
          sl: t('slNo'),
          salesSection: t('allSales'),
          costsSection: t('allCosts'),
          totalIncome: t('totalIncomeShort'),
          totalCost: t('totalCostShort'),
          netResult: t('netResult'),
          profit: t('profit'),
          loss: t('loss'),
          comments: t('pdfComments'),
          authorizedSign: t('authorizedSign'),
          softwareBy: t('softwareBy'),
          logoSoon: t('logoSoon'),
          hisabParty: t('hisabParty'),
          owner: t('ownerName'),
        },
      });
      await downloadInvoicePdf(html, t('downloadPdf'));
    } catch (err) {
      Alert.alert('PDF', err instanceof Error ? err.message : 'Failed');
    } finally {
      setPrinting(false);
    }
  };

  const share = () =>
    Share.share({ message: c.hisabShare(label, bdt(now.income), bdt(now.expense), bdt(now.net)) }).catch(() => undefined);

  const loading = costsQ.isLoading || salesQ.isLoading;
  const max = Math.max(1, ...flow.flatMap((f) => [f.a, f.b]));
  const orgName = org.data?.name ?? organization?.name ?? c.appName;

  return (
    <MScreen
      tabs
      header={<TitleHeader title={c.hisab} sub={c.hisabSub} right={<CircleBtn icon="cal" label={c.pickPeriod} onPress={() => setPicker(true)} />} />}
      refreshing={costsQ.isRefetching || salesQ.isRefetching}
      onRefresh={() => {
        costsQ.refetch();
        salesQ.refetch();
        org.refetch();
      }}>
      <MSegmented
        value={period}
        options={[
          { key: 'week', label: c.week },
          { key: 'month', label: c.month },
          { key: 'year', label: c.year },
        ]}
        onChange={(p) => {
          setPeriod(p);
          setOffset(0);
        }}
      />

      <MCard dark radius={28} pad={20} style={{ overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 }}>
          <Contours w={350} h={300} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{label}</Tx>
          <View style={{ height: 26, borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)' }}>
            <Tx s={12} w="600" color={isProfit ? C.lime : '#FF8A7A'}>{isProfit ? c.profit : c.loss}</Tx>
          </View>
        </View>
        <Tx s={38} w="800" color={isProfit ? C.lime : '#FF8A7A'} tabular lines={1} style={{ letterSpacing: -1, marginTop: 6 }}>
          {`${now.net > 0 ? '+' : ''}${bdt(now.net)}`}
        </Tx>
        <Tx s={13} w="500" color="rgba(255,255,255,0.6)">{c.marginLine(pct(margin))}</Tx>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 96, marginTop: 18 }}>
          {flow.map((f, i) => (
            <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: period === 'year' ? 2 : 5 }}>
              <View style={{ width: period === 'year' ? 7 : period === 'week' ? 12 : 16, height: Math.max(3, (f.a / max) * 96), borderRadius: 5, backgroundColor: C.lime }} />
              <View style={{ width: period === 'year' ? 7 : period === 'week' ? 12 : 16, height: Math.max(3, (f.b / max) * 96), borderRadius: 5, backgroundColor: '#FF8A7A' }} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {flow.map((f, i) => (
            <Tx key={i} s={period === 'year' ? 9 : 11} w="600" color="rgba(255,255,255,0.55)" lines={1} style={{ flex: 1, textAlign: 'center' }}>{f.label}</Tx>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
          <Legend color={C.lime} label={c.income} />
          <Legend color="#FF8A7A" label={c.expense} />
        </View>
      </MCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TotalTile icon="up" tone="lime" label={c.totalIncome} value={bdt(now.income)} sub={c.salesCount(now.saleCount)} subColor={C.emerald} />
        <TotalTile icon="trendDown" tone="coral" label={c.totalExpense} value={bdt(now.expense)} sub={c.costsCount(now.costCount)} subColor={C.coral} />
      </View>

      <SectionHead title={c.whereMoney} style={{ marginTop: 12 }} />
      {loading ? <Loading /> : null}
      {!loading && !legend.length ? <EmptyCard icon="receipt" title={c.noCostsPeriod} /> : null}
      {legend.length ? (
        <MCard pad={19}>
          <View style={{ flexDirection: 'row', height: 14, gap: 3 }}>
            {legend.map((x, i) => (
              <View key={x.name} style={{ flex: Math.max(x.total, now.expense * 0.03), borderRadius: 4, backgroundColor: PALETTE[i % PALETTE.length] }} />
            ))}
          </View>
          <View style={{ gap: 12, marginTop: 16 }}>
            {legend.map((x, i) => (
              <View key={x.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: PALETTE[i % PALETTE.length] }} />
                <Tx s={14} w="600" lines={1} style={{ flex: 1 }}>{x.name}</Tx>
                <Tx s={13} w="500" color={C.sub} style={{ width: 44, textAlign: 'right' }}>{pct(now.expense ? (x.total / now.expense) * 100 : 0, 0)}</Tx>
                <Tx s={14} w="700" tabular style={{ minWidth: 86, textAlign: 'right' }}>{bdt(x.total)}</Tx>
              </View>
            ))}
          </View>
        </MCard>
      ) : null}

      <SectionHead title={c.invoice} style={{ marginTop: 12 }} />
      {!loading && !invoice ? <EmptyCard icon="file" title={c.noInvoice} sub={c.noInvoiceSub} /> : null}
      {invoice ? (
        <View style={{ backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
          <View style={{ backgroundColor: C.canvas, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 16 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="leaf" size={19} color={C.lime} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Tx s={14} w="700" lines={1}>{orgName}</Tx>
              <Tx s={12} w="500" color={C.sub} lines={1}>{[invoice.saleNumber, dayMonth(invoice.saleDate, lang), customerName(invoice)].filter(Boolean).join(' · ')}</Tx>
            </View>
            {due(invoice) > 0 ? <MPill label={c.dueAmt(bdt(due(invoice)))} tone="gold" /> : <MPill label={c.paid} />}
          </View>
          <View style={{ paddingHorizontal: 18 }}>
            {(invoice.items ?? []).map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, minHeight: 57 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Tx s={14} w="600" lines={1}>{it.itemName}</Tx>
                  <Tx s={12} w="500" color={C.sub}>{`${num(it.quantity)} ${unitShort(it.unit)} × ${bdt(it.rate)}`}</Tx>
                </View>
                <Tx s={14} w="700" tabular>{bdt(Number(it.total ?? it.quantity * it.rate))}</Tx>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 16 }}>
              <Tx s={14} w="700">{c.total}</Tx>
              <Tx s={20} w="800" tabular style={{ letterSpacing: -1 }}>{bdt(invoice.totalAmount)}</Tx>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingBottom: 18 }}>
            <MButton label={c.downloadPdf} icon="download" kind="dark" h={48} loading={printing} onPress={onDownloadPdf} style={{ flex: 1 }} />
            <Pressable
              onPress={share}
              accessibilityLabel={c.share}
              style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 15, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
              <Icon name="upload" size={18} color={C.ink} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <Sheet open={picker} onClose={() => setPicker(false)} title={c.pickPeriod}>
        {Array.from({ length: 6 }, (_, i) => (
          <SheetRow
            key={i}
            label={periodLabel(period, periodRange(period, i), lang)}
            icon="cal"
            active={i === offset}
            onPress={() => {
              setOffset(i);
              setPicker(false);
            }}
          />
        ))}
      </Sheet>
    </MScreen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Tx s={12} w="500" color="rgba(255,255,255,0.75)">{label}</Tx>
    </View>
  );
}

function TotalTile({ icon, tone, label, value, sub, subColor }: { icon: 'up' | 'trendDown'; tone: 'lime' | 'coral'; label: string; value: string; sub: string; subColor: string }) {
  return (
    <MCard pad={17} style={{ flex: 1, minWidth: 0 }}>
      <ToneTile icon={icon} tone={tone} size={32} radius={10} />
      <Tx s={12} w="500" color={C.sub} style={{ marginTop: 12 }}>{label}</Tx>
      <Tx s={21} w="800" tabular lines={1} style={{ letterSpacing: -1, marginTop: 2 }}>{value}</Tx>
      <Tx s={12} w="600" color={subColor} style={{ marginTop: 4 }}>{sub}</Tx>
    </MCard>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebHisab /> : <HisabScreen />;
}
