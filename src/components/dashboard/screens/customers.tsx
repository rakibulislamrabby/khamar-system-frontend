import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { customerKey, due, liveSales, received, saleDate, saleProduct, sum, useCustomers, useSales } from '@/components/dashboard/data';
import { CustomerDrawer } from '@/components/dashboard/drawers';
import { bdt, dayMonth, initials, num } from '@/components/dashboard/format';
import { Avatar, Btn, Card, Chips, Empty, MenuItem, Pill, Popover, SearchBox, Table, Tx, useToast } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C, type Tone } from '@/components/dashboard/theme';
import { Contours } from '@/components/web-landing/graphics';
import { useAuth } from '@/providers/auth-provider';
import type { Customer, Sale } from '@/types/api';

type Row = { customer: Customer; sales: Sale[]; bought: number; due: number; last: Date | null; kind: string };
type Filter = 'all' | 'due' | 'clear';
const AVATAR_TONES: Tone[] = ['gold', 'green', 'sky', 'violet', 'coral'];

function waLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `88${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function WebCustomers() {
  const { c, lang } = useDash();
  const params = useLocalSearchParams<{ id?: string; action?: string }>();
  const { organization } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1040;
  const toast = useToast();
  const customersQ = useCustomers();
  const salesQ = useSales();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string>(params.id ?? '');
  const [drawer, setDrawer] = useState(params.action === 'new');

  useEffect(() => {
    if (params.id) setSelected(params.id);
    if (params.action === 'new') setDrawer(true);
  }, [params.id, params.action]);

  const rows = useMemo<Row[]>(() => {
    const byCust = new Map<string, Sale[]>();
    for (const s of liveSales(salesQ.data ?? [])) {
      const k = customerKey(s);
      if (!k) continue;
      byCust.set(k, [...(byCust.get(k) ?? []), s]);
    }
    return (customersQ.data ?? [])
      .map((cu) => {
        const list = (byCust.get(cu._id) ?? []).sort((a, b) => +(saleDate(b) ?? 0) - +(saleDate(a) ?? 0));
        const kinds = new Map<string, number>();
        for (const s of list) {
          const k = saleProduct(s).name.split(' · ')[0].replace(/ \(live\)$/, '').replace(/ \+\d+$/, '');
          kinds.set(k, (kinds.get(k) ?? 0) + s.totalAmount);
        }
        const kind = [...kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
        return { customer: cu, sales: list, bought: sum(list, (s) => s.totalAmount), due: sum(list, due), last: list[0] ? saleDate(list[0]) : null, kind };
      })
      .sort((a, b) => +(b.last ?? 0) - +(a.last ?? 0) || b.bought - a.bought);
  }, [customersQ.data, salesQ.data]);

  const counts = { all: rows.length, due: rows.filter((r) => r.due > 0).length, clear: rows.filter((r) => r.due <= 0).length };
  const shown = rows.filter((r) => {
    if (filter === 'due' && r.due <= 0) return false;
    if (filter === 'clear' && r.due > 0) return false;
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return r.customer.name.toLowerCase().includes(t) || (r.customer.phone ?? '').includes(t);
  });
  const current = rows.find((r) => r.customer._id === selected) ?? shown[0] ?? null;
  const owing = rows.filter((r) => r.due > 0);

  const remind = (r: Row) => {
    if (!r.customer.phone) return toast(c.noPhone, 'err');
    Linking.openURL(waLink(r.customer.phone, c.reminderText(r.customer.name, bdt(r.due), organization?.name ?? 'Khamar')));
  };

  const top = (
    <PageTop
      crumbs={[c.money, c.customers]}
      title={c.customers}
      actions={
        <>
          <Popover
            width={320}
            align="right"
            trigger={(open) => <Btn label={c.sendReminders} icon="bell" onPress={open} disabled={!owing.length} />}>
            {(close) => (
              <View style={{ paddingVertical: 6 }}>
                {owing.map((r) => (
                  <MenuItem key={r.customer._id} label={r.customer.name} sub={c.dueAmt(bdt(r.due))} icon="send" onPress={() => { close(); remind(r); }} />
                ))}
              </View>
            )}
          </Popover>
          <Btn label={c.addCustomer} icon="plus" kind="lime" onPress={() => setDrawer(true)} />
        </>
      }
    />
  );

  return (
    <Page top={top}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Card pad={0} style={{ flex: 1.65, width: wide ? undefined : '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, flexWrap: 'wrap' }}>
            <Chips
              value={filter}
              onChange={setFilter}
              options={[
                { key: 'all', label: `${c.all} · ${counts.all}` },
                { key: 'due', label: `${c.withDue} · ${counts.due}` },
                { key: 'clear', label: `${c.clear} · ${counts.clear}` },
              ]}
            />
            <View style={{ flex: 1 }} />
            <SearchBox value={q} onChange={setQ} placeholder={c.nameOrPhone} width={220} />
          </View>
          <Table
            rows={shown}
            rowKey={(r) => r.customer._id}
            onRowPress={(r) => setSelected(r.customer._id)}
            empty={<Empty icon="users" title={c.noCustomers} sub={c.noCustomersSub} action={<Btn label={c.addCustomer} icon="plus" kind="lime" onPress={() => setDrawer(true)} />} />}
            cols={[
              { key: 'name', label: c.customer, flex: 2 },
              { key: 'type', label: c.type, flex: 1.1 },
              { key: 'last', label: c.lastSale, flex: 0.9 },
              { key: 'bought', label: c.bought, flex: 1, align: 'right' },
              { key: 'due', label: c.due, flex: 0.9, align: 'right' },
            ]}
            render={(r, col, i) => {
              const active = current?.customer._id === r.customer._id;
              if (col.key === 'name')
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar text={initials(r.customer.name)} tone={AVATAR_TONES[i % AVATAR_TONES.length]} size={36} />
                    <View style={{ flexShrink: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Tx s={14} w="700" lines={1} style={{ flexShrink: 1 }}>{r.customer.name}</Tx>
                        {active ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.emerald }} /> : null}
                      </View>
                      <Tx s={12} color={C.sub}>{r.customer.phone ?? '—'}</Tx>
                    </View>
                  </View>
                );
              if (col.key === 'type') return r.kind ? <Pill label={r.kind} tone="gray" /> : <Tx s={13} color={C.faint}>—</Tx>;
              if (col.key === 'last') return <Tx s={13} color={C.sub}>{r.last ? dayMonth(r.last, lang) : '—'}</Tx>;
              if (col.key === 'bought') return <Tx s={14} w="800" tabular>{bdt(r.bought)}</Tx>;
              return r.due > 0 ? <Tx s={14} w="800" color={C.goldInk} tabular>{bdt(r.due)}</Tx> : <Tx s={14} w="700" color={C.emerald}>{c.clear}</Tx>;
            }}
          />
        </Card>

        <View style={{ flex: 1, width: wide ? undefined : '100%', minWidth: 300 }}>
          {current ? <CustomerPanel row={current} onRemind={() => remind(current)} /> : <Card><Empty icon="user" title={c.pickCustomer} /></Card>}
        </View>
      </View>
      <CustomerDrawer open={drawer} onClose={() => setDrawer(false)} onCreated={(x) => setSelected(x._id)} />
    </Page>
  );
}

function CustomerPanel({ row, onRemind }: { row: Row; onRemind: () => void }) {
  const { c, lang } = useDash();
  const cu = row.customer;
  const ledger = row.sales
    .flatMap((s) => {
      const d = saleDate(s);
      const p = saleProduct(s);
      const lines = [{ key: `${s._id}-s`, at: d, label: c.saleLine(s.saleNumber ?? '', p.qty), amount: s.totalAmount }];
      const r = received(s);
      if (r > 0) lines.push({ key: `${s._id}-r`, at: d, label: c.cashReceived, amount: -r });
      return lines;
    })
    .slice(0, 12);
  return (
    <View style={{ backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
      <View style={{ backgroundColor: C.forest, padding: 20 }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Contours w={420} h={150} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar text={initials(cu.name)} tone="lime" size={50} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={18} w="800" color={C.white} lines={1}>{cu.name}</Tx>
            <Tx s={12} color="rgba(255,255,255,0.65)" lines={1}>{[row.kind, cu.address || cu.district].filter(Boolean).join(' · ') || cu.phone || '—'}</Tx>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Btn label={c.call} icon="phone" kind="lime" disabled={!cu.phone} onPress={() => cu.phone && Linking.openURL(`tel:${cu.phone}`)} style={{ flex: 1 }} />
          <Btn label={c.remind} icon="bell" kind="dark" disabled={row.due <= 0} onPress={onRemind} style={{ flex: 1, backgroundColor: C.forest2, borderColor: C.forest3 }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', padding: 18, gap: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ flex: 1.3 }}>
          <Tx s={12} color={C.sub}>{c.totalBought}</Tx>
          <Tx s={20} w="800" tabular lines={1}>{bdt(row.bought)}</Tx>
        </View>
        <View style={{ flex: 1 }}>
          <Tx s={12} color={C.sub}>{c.dueNow}</Tx>
          <Tx s={20} w="800" color={row.due > 0 ? C.goldInk : C.emerald} tabular lines={1}>{bdt(row.due)}</Tx>
        </View>
        <View style={{ flex: 0.6 }}>
          <Tx s={12} color={C.sub}>{c.sales}</Tx>
          <Tx s={20} w="800" tabular>{num(row.sales.length)}</Tx>
        </View>
      </View>
      <View style={{ padding: 18 }}>
        <Tx s={11} w="700" color={C.faint} style={{ letterSpacing: 1 }}>{c.ledger.toUpperCase()}</Tx>
        {ledger.length ? (
          ledger.map((l, i) => (
            <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Tx s={12} color={C.sub} style={{ width: 48 }}>{dayMonth(l.at, lang)}</Tx>
              <Tx s={13} w="600" lines={1} style={{ flex: 1 }}>{l.label}</Tx>
              <Tx s={14} w="800" color={l.amount < 0 ? C.emerald : C.ink} tabular>{`${l.amount < 0 ? '−' : '+'}${bdt(Math.abs(l.amount)).replace('৳', '')}`}</Tx>
            </View>
          ))
        ) : (
          <Tx s={13} color={C.faint} style={{ paddingTop: 12 }}>{c.noSales}</Tx>
        )}
      </View>
    </View>
  );
}
