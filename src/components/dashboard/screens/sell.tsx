import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { inventoryApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { batchTitle, birdVisual, isActiveBatch, unitShort, useBatches, useCows, useCustomers, useRefreshAll } from '@/components/dashboard/data';
import { CustomerDrawer } from '@/components/dashboard/drawers';
import { bdt, fullDate, num, titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Btn, Card, Chips, ErrorNote, Field, IconTile, MenuItem, Segmented, Select, Tx, useToast } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { useInvoicePdf } from '@/components/dashboard/pdf';
import { C, type Tone } from '@/components/dashboard/theme';
import { LogoMark } from '@/components/web-landing/graphics';
import { resolveId } from '@/lib/ids';
import { useAuth } from '@/providers/auth-provider';
import type { Customer } from '@/types/api';

type Unit = 'piece' | 'dozen' | 'tray' | 'kg' | 'liter' | 'animal';
type Method = 'cash' | 'bkash' | 'nagad' | 'bank';
type Product = { key: string; title: string; sub: string; icon: IconName; tone: Tone; itemName: string; units: Unit[]; farmId?: string; refType?: string; refId?: string };

const PRESET = (v: string) => (/^\d*\.?\d*$/.test(v) ? v : null);

export function WebSell() {
  const { c, lang } = useDash();
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string }>();
  const { organization } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1040;
  const toast = useToast();
  const refresh = useRefreshAll();
  const pdf = useInvoicePdf();
  const batchesQ = useBatches();
  const cowsQ = useCows();
  const customersQ = useCustomers();

  const products = useMemo<Product[]>(() => {
    const list: Product[] = (batchesQ.data ?? []).filter(isActiveBatch).map((b) => {
      const v = birdVisual(b.birdType);
      const layer = b.birdType?.toLowerCase() === 'layer';
      return {
        key: b._id,
        title: batchTitle(b),
        sub: `${titleCase(b.birdType)} · ${num(b.currentQuantity)} ${c.aliveShort}`,
        icon: v.icon,
        tone: v.tone,
        itemName: `${titleCase(b.birdType)} (live) · ${b.batchName}`,
        units: layer ? ['tray', 'piece', 'animal', 'kg'] : ['animal', 'kg'],
        farmId: resolveId(b.farmId) || undefined,
        refType: 'poultry_batch',
        refId: b._id,
      };
    });
    if ((cowsQ.data ?? []).length) list.push({ key: 'milk', title: c.milk, sub: c.herdSub(cowsQ.data?.length ?? 0), icon: 'milk', tone: 'sky', itemName: lang === 'bn' ? 'দুধ' : 'Milk', units: ['liter'] });
    return list;
  }, [batchesQ.data, cowsQ.data, c, lang]);

  const [productKey, setProductKey] = useState<string>(params.batchId ?? '');
  const [otherName, setOtherName] = useState('');
  const [unit, setUnit] = useState<Unit>('kg');
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [receivedStr, setReceivedStr] = useState('');
  const [method, setMethod] = useState<Method>('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [custDrawer, setCustDrawer] = useState(false);

  useEffect(() => {
    if (!productKey && products.length) setProductKey(products[0].key);
  }, [products, productKey]);

  const product: Product | null =
    productKey === 'other'
      ? { key: 'other', title: c.otherProduct, sub: c.otherProductSub, icon: 'box', tone: 'gray', itemName: otherName.trim(), units: ['piece', 'kg', 'dozen', 'tray', 'liter'] }
      : products.find((p) => p.key === productKey) ?? null;

  useEffect(() => {
    if (product && !product.units.includes(unit)) setUnit(product.units.includes('kg') && product.units[0] !== 'tray' ? 'kg' : product.units[0]);
  }, [product, unit]);

  const customers = customersQ.data ?? [];
  const customer = customers.find((x) => x._id === customerId);
  const q = Number(qty) || 0;
  const r = Number(rate) || 0;
  const total = Math.round(q * r * 100) / 100;
  const received = receivedStr.trim() === '' ? total : Math.min(Number(receivedStr) || 0, total);
  const dueAmt = Math.max(0, total - received);
  const methodLabel: Record<Method, string> = { cash: c.cash, bkash: c.bkash, nagad: c.nagad, bank: c.bank };
  const unitLabel: Record<Unit, string> = { piece: c.piece, kg: c.kilogram, tray: c.tray, liter: c.liter, animal: c.bird, dozen: lang === 'bn' ? 'ডজন' : 'Dozen' };

  const save = useMutation({
    mutationFn: () =>
      inventoryApi.createSale({
        farmId: product?.farmId,
        customerId: customerId || undefined,
        items: [{ itemName: product?.itemName || '', quantity: q, unit, rate: r, referenceType: product?.refType, referenceId: product?.refId }],
        receivedAmount: received,
        notes: [`${c.paidWith}: ${methodLabel[method]}`, note.trim()].filter(Boolean).join(' · '),
      }),
  });

  const submit = async (withPdf: boolean) => {
    setError('');
    if (!product || !product.itemName) return setError(c.pickProduct);
    if (q <= 0 || r <= 0) return setError(c.enterQtyRate);
    try {
      const sale = await save.mutateAsync();
      await refresh('sales', 'customers', 'poultry-batches', 'poultry-batch');
      toast(c.saleSaved(sale.saleNumber ?? ''));
      if (withPdf) {
        const full = { ...sale, customerId: customer ? { _id: customer._id, name: customer.name, phone: customer.phone } : sale.customerId };
        await pdf.download(sale.saleNumber ?? 'invoice', [full]);
      }
      setQty('');
      setRate('');
      setReceivedStr('');
      setNote('');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const top = <PageTop crumbs={[c.money, c.sell]} title={c.sellTitle} actions={<Btn label={c.salesHistory} icon="receipt" onPress={() => router.navigate('/(app)/sales')} />} />;

  return (
    <Page top={top}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20, alignItems: 'flex-start' }}>
        <Card pad={24} style={{ flex: 1.45, width: wide ? undefined : '100%', gap: 24 }}>
          <Section icon="bird" title={c.chooseProduct}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {products.map((p) => (
                <ProductCard key={p.key} p={p} active={productKey === p.key} onPress={() => setProductKey(p.key)} />
              ))}
              <ProductCard p={{ key: 'other', title: c.otherProduct, sub: c.otherProductSub, icon: 'box', tone: 'gray', itemName: '', units: [] }} active={productKey === 'other'} onPress={() => setProductKey('other')} />
            </View>
            {productKey === 'other' ? <Field label={c.productName} value={otherName} onChangeText={setOtherName} placeholder={lang === 'bn' ? 'যেমন: ডিম, সার' : 'e.g. Eggs, manure'} style={{ marginTop: 14 }} /> : null}
          </Section>

          <Section icon="scale" title={c.qtyPrice}>
            <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <View style={{ flexGrow: 1.2, flexBasis: 220 }}>
                <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.sellBy}</Tx>
                <Segmented size="lg" value={unit} onChange={setUnit} options={(product?.units ?? ['kg']).map((u) => ({ key: u, label: unitLabel[u] }))} style={{ height: 52, alignItems: 'center' }} />
              </View>
              <Field label={c.quantity} value={qty} onChangeText={(v) => PRESET(v) !== null && setQty(v)} keyboardType="decimal-pad" suffix={unitShort(unit)} placeholder="0" style={{ flexGrow: 1, flexBasis: 150 }} />
              <Field label={c.rate} value={rate} onChangeText={(v) => PRESET(v) !== null && setRate(v)} keyboardType="decimal-pad" prefix="৳" suffix={`/ ${unitShort(unit)}`} placeholder="0" style={{ flexGrow: 1, flexBasis: 150 }} />
            </View>
          </Section>

          <Section icon="users" title={c.buyerPayment}>
            <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
              <Select
                label={c.customer}
                icon="user"
                value={customerId}
                placeholder={c.walkIn}
                onChange={setCustomerId}
                options={customers.map((x) => ({ value: x._id, label: x.name, sub: x.phone }))}
                style={{ flexGrow: 1, flexBasis: 240 }}
                footer={(close) => <MenuItem icon="userPlus" label={c.newCustomer} onPress={() => { close(); setCustDrawer(true); }} />}
              />
              <Field label={c.moneyReceived} value={receivedStr} onChangeText={(v) => PRESET(v) !== null && setReceivedStr(v)} keyboardType="decimal-pad" prefix="৳" placeholder={total ? groupPlaceholder(total) : '0'} style={{ flexGrow: 1, flexBasis: 200 }} />
            </View>
            <Tx s={13} w="600" style={{ marginTop: 16, marginBottom: 8 }}>{c.paidWith}</Tx>
            <Chips value={method} onChange={setMethod} options={(Object.keys(methodLabel) as Method[]).map((k) => ({ key: k, label: methodLabel[k] }))} />
            <Field label={c.note} value={note} onChangeText={setNote} placeholder={c.notePlaceholder} style={{ marginTop: 16 }} />
          </Section>
          <ErrorNote message={error} />
        </Card>

        <View style={{ flex: 1, width: wide ? undefined : '100%', gap: 14, minWidth: 320 }}>
          <View style={{ backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, backgroundColor: C.head, borderBottomWidth: 1, borderBottomColor: C.line }}>
              <LogoMark size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Tx s={15} w="800" lines={1}>{organization?.name ?? 'Khamar'}</Tx>
                <Tx s={12} color={C.sub}>{c.invoicePreview}</Tx>
              </View>
              <View style={{ backgroundColor: '#E9EFEB', borderRadius: 999, paddingHorizontal: 10, height: 24, justifyContent: 'center' }}>
                <Tx s={11} w="700" color={C.sub}>{c.draft}</Tx>
              </View>
            </View>
            <View style={{ padding: 18, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Tx s={11} color={C.faint}>{c.billedTo}</Tx>
                  <Tx s={15} w="800" lines={1}>{customer?.name ?? c.walkIn}</Tx>
                  <Tx s={12} color={C.sub} lines={1}>{[customer?.phone, customer?.address].filter(Boolean).join(' · ') || '—'}</Tx>
                </View>
                <Tx s={12} color={C.sub}>{fullDate(new Date(), lang)}</Tx>
              </View>
              <View>
                <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
                  <Tx s={10.5} w="700" color={C.faint} style={{ flex: 1.3, letterSpacing: 0.8 }}>{c.item.toUpperCase()}</Tx>
                  <Tx s={10.5} w="700" color={C.faint} style={{ flex: 1, textAlign: 'right', letterSpacing: 0.8 }}>{c.qtyXRate.toUpperCase()}</Tx>
                  <Tx s={10.5} w="700" color={C.faint} style={{ flex: 0.9, textAlign: 'right', letterSpacing: 0.8 }}>{c.amount.toUpperCase()}</Tx>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
                  <View style={{ flex: 1.3, minWidth: 0 }}>
                    <Tx s={14} w="700" lines={1}>{product?.itemName.split(' · ')[0] || c.pickProduct}</Tx>
                    <Tx s={12} color={C.sub} lines={1}>{product?.key === 'other' ? c.otherProduct : product?.title ?? ''}</Tx>
                  </View>
                  <Tx s={13} color={C.sub} style={{ flex: 1, textAlign: 'right' }} tabular>{q ? `${num(q, 2)} ${unitShort(unit)} × ${bdt(r)}` : '—'}</Tx>
                  <Tx s={14} w="800" style={{ flex: 0.9, textAlign: 'right' }} tabular>{bdt(total)}</Tx>
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <InvRow label={c.subtotal} value={bdt(total)} />
                <InvRow label={c.receivedVia(methodLabel[method])} value={bdt(received)} color={C.emerald} />
                <InvRow label={c.stillDue} value={bdt(dueAmt)} color={dueAmt > 0 ? C.goldInk : C.sub} />
              </View>
            </View>
            <View style={{ backgroundColor: C.forest, paddingHorizontal: 18, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tx s={14} w="600" color="rgba(255,255,255,0.7)">{c.total}</Tx>
              <Tx s={34} w="800" color={C.white} tabular>{bdt(total)}</Tx>
            </View>
          </View>
          <Btn label={c.saveSale} icon="check" kind="lime" size="lg" loading={save.isPending && !pdf.busy} disabled={pdf.busy} onPress={() => submit(false)} style={{ justifyContent: 'flex-start', paddingHorizontal: 20 }} />
          <Btn label={c.saveAndPdf} icon="download" size="lg" loading={pdf.busy} disabled={save.isPending} onPress={() => submit(true)} style={{ justifyContent: 'flex-start', paddingHorizontal: 20 }} />
        </View>
      </View>
      <CustomerDrawer open={custDrawer} onClose={() => setCustDrawer(false)} onCreated={(x: Customer) => setCustomerId(x._id)} />
    </Page>
  );
}

function groupPlaceholder(total: number) {
  return total.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function Section({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={C.padma} />
        </View>
        <Tx s={16} w="700">{title}</Tx>
      </View>
      {children}
    </View>
  );
}

function ProductCard({ p, active, onPress }: { p: Product; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => ({
        flexGrow: 1,
        flexBasis: 170,
        maxWidth: 260,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: active ? C.forest : (state as { hovered?: boolean }).hovered ? '#C9D6CE' : C.line,
        backgroundColor: active ? C.forest : C.white,
        padding: 14,
        gap: 12,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {active ? (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={p.icon} size={16} color={C.forest} />
          </View>
        ) : (
          <IconTile name={p.icon} tone={p.tone} size={32} />
        )}
        {active ? (
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={12} color={C.forest} sw={3} />
          </View>
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#C9D6CE' }} />
        )}
      </View>
      <View>
        <Tx s={14} w="800" color={active ? C.white : C.ink} lines={1}>{p.title}</Tx>
        <Tx s={12} color={active ? 'rgba(255,255,255,0.65)' : C.sub} lines={1}>{p.sub}</Tx>
      </View>
    </Pressable>
  );
}

function InvRow({ label, value, color = C.ink }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Tx s={13} color={C.sub}>{label}</Tx>
      <Tx s={14} w="800" color={color} tabular>{value}</Tx>
    </View>
  );
}
