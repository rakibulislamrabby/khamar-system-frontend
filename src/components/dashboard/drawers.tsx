import { useMutation } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { authApi, domainApi, inventoryApi, organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { DISTRICTS } from '@/components/dashboard/copy';
import { batchTitle, useCategories, useFarms, useItems, useRefreshAll, useSheds } from '@/components/dashboard/data';
import { bdt, isoDay, num } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Btn, Chips, Drawer, ErrorNote, Field, IconTile, Segmented, Select, Tx, useToast } from '@/components/dashboard/kit';
import { useDash } from '@/components/dashboard/use-dash';
import { C, type Tone } from '@/components/dashboard/theme';
import { resolveId } from '@/lib/ids';
import type { Customer, Farm, InventoryItem, PoultryBatch, UserRole } from '@/types/api';

const n = (v: string) => Number(v.replace(/,/g, '').trim());

function TotalBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ backgroundColor: C.limeSoft, borderWidth: 1, borderColor: '#D6EFA4', borderRadius: 18, padding: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Tx s={13} w="700" color={C.padma}>{label}</Tx>
        <Icon name="file" size={17} color={C.padma} />
      </View>
      <Tx s={30} w="800" style={{ marginTop: 6 }} tabular>{value}</Tx>
      {sub ? <Tx s={12} color={C.sub} style={{ marginTop: 4 }}>{sub}</Tx> : null}
    </View>
  );
}

export function NewBatchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useDash();
  const toast = useToast();
  const router = useRouter();
  const refresh = useRefreshAll();
  const farms = useFarms();
  const sheds = useSheds();
  const poultryFarms = (farms.data ?? []).filter((f) => f.farmType === 'poultry');
  const farmOptions = (poultryFarms.length ? poultryFarms : farms.data ?? []).map((f) => ({ value: f._id, label: [f.name, f.district].filter(Boolean).join(' · ') }));
  const [farmId, setFarmId] = useState('');
  const [shedId, setShedId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('broiler');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(isoDay());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setName(`Batch-${now.toLocaleString('en', { month: 'short' })}-${now.getFullYear()}`);
    setError('');
  }, [open]);

  const fid = farmId || farmOptions[0]?.value || '';
  const shedOptions = (sheds.data ?? []).filter((s) => resolveId(s.farmId) === fid).map((s) => ({ value: s._id, label: s.name, sub: s.capacity ? `${num(s.capacity)}` : undefined }));
  const total = (n(qty) || 0) * (n(price) || 0);

  const m = useMutation({
    mutationFn: () =>
      domainApi.createPoultryBatch({
        farmId: fid,
        shedId: shedId || undefined,
        batchName: name.trim(),
        birdType: type,
        purchaseDate: new Date(date).toISOString(),
        initialQuantity: Math.floor(n(qty)),
        unitPrice: n(price),
      }),
    onSuccess: async (batch) => {
      await refresh('poultry-batches', 'costs');
      toast(c.batchCreated);
      setQty('');
      setPrice('');
      onClose();
      router.navigate(`/(app)/poultry/${batch._id}` as Href);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const submit = () => {
    setError('');
    if (!fid || !name.trim() || !(n(qty) > 0) || !(n(price) >= 0) || price.trim() === '' || Number.isNaN(new Date(date).getTime())) {
      setError(`${c.batchName}, ${c.initialQty}, ${c.pricePerChick}`);
      return;
    }
    m.mutate();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.newPoultryBatch}
      sub={c.chickCostSaved}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.createBatch} icon="check" kind="dark" size="lg" onPress={submit} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Select label={c.farm} value={fid} onChange={setFarmId} options={farmOptions} icon="barn" />
      {shedOptions.length ? (
        <Select label={c.shed} value={shedId} onChange={setShedId} options={[{ value: '', label: c.noShed }, ...shedOptions]} placeholder={c.noShed} icon="layers" />
      ) : null}
      <Field label={c.batchName} value={name} onChangeText={setName} icon="pencil" />
      <View>
        <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.birdType}</Tx>
        <Chips
          value={type}
          onChange={setType}
          options={[
            { key: 'broiler', label: c.broiler },
            { key: 'layer', label: c.layer },
            { key: 'sonali', label: 'Sonali' },
            { key: 'duck', label: 'Duck' },
            { key: 'mixed', label: c.mixed },
          ]}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Field label={c.initialQty} value={qty} onChangeText={setQty} keyboardType="number-pad" placeholder="1,200" style={{ flex: 1 }} />
        <Field label={c.pricePerChick} value={price} onChangeText={setPrice} keyboardType="decimal-pad" prefix="৳" placeholder="55" style={{ flex: 1 }} />
      </View>
      <Field label={c.purchaseDate} value={date} onChangeText={setDate} icon="cal" placeholder="YYYY-MM-DD" />
      <TotalBox label={c.chickTotal} value={bdt(total)} sub={c.chickTotalSub(num(n(qty) || 0), bdt(n(price) || 0))} />
      <ErrorNote message={error} />
    </Drawer>
  );
}

export type EntryKind = 'feed' | 'vaccine' | 'death' | 'other';

export function EntryDrawer({ open, onClose, batch, initialKind = 'feed' }: { open: boolean; onClose: () => void; batch: PoultryBatch | null; initialKind?: EntryKind }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const cats = useCategories();
  const [kind, setKind] = useState<EntryKind>(initialKind);
  const [categoryId, setCategoryId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('bag');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(isoDay());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setCategoryId('');
    setQty('');
    setRate('');
    setNote('');
    setError('');
    setDate(isoDay());
  }, [open, initialKind]);

  useEffect(() => {
    setUnit(kind === 'feed' ? 'bag' : kind === 'vaccine' ? 'vial' : 'piece');
  }, [kind]);

  const list = cats.data ?? [];
  const preferred = useMemo(() => {
    if (kind === 'feed') return list.find((x) => /feed/i.test(x.name)) ?? list[0];
    if (kind === 'vaccine') return list.find((x) => /vaccin/i.test(x.name)) ?? list.find((x) => /medic/i.test(x.name)) ?? list[0];
    return list.find((x) => /other/i.test(x.name)) ?? list[0];
  }, [list, kind]);
  const catId = categoryId || preferred?._id || '';
  const total = (n(qty) || 0) * (n(rate) || 0);

  const costM = useMutation({
    mutationFn: () =>
      inventoryApi.createCost({
        farmId: resolveId(batch?.farmId) || undefined,
        categoryId: catId,
        costType: kind === 'other' ? 'custom' : 'operating',
        scope: 'poultry_batch',
        referenceType: 'poultry_batch',
        referenceId: batch!._id,
        quantity: n(qty),
        unit,
        rate: n(rate),
        costDate: new Date(date).toISOString(),
        description: note.trim() || `${list.find((x) => x._id === catId)?.name ?? c.other} — ${batch?.batchName ?? ''}`,
      }),
    onSuccess: async () => {
      await refresh('costs', 'poultry-batch', 'poultry-batches');
      toast(c.saved);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const deathM = useMutation({
    mutationFn: () => domainApi.recordMortality(batch!._id, { quantity: Math.floor(n(qty)), notes: note.trim() || undefined }),
    onSuccess: async () => {
      await refresh('poultry-batch', 'poultry-batches');
      toast(c.deathRecorded);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const submit = () => {
    setError('');
    if (!batch) return;
    if (!(n(qty) > 0)) return setError(c.enterQtyRate);
    if (kind === 'death') return deathM.mutate();
    if (!catId || rate.trim() === '' || !(n(rate) >= 0)) return setError(c.enterQtyRate);
    costM.mutate();
  };

  const kinds: Array<{ key: EntryKind; label: string; icon: IconName; tone: Tone }> = [
    { key: 'feed', label: c.feed, icon: 'wheat', tone: 'gold' },
    { key: 'vaccine', label: c.vaccine, icon: 'syringe', tone: 'sky' },
    { key: 'death', label: c.death, icon: 'alert', tone: 'coral' },
    { key: 'other', label: c.other, icon: 'plus', tone: 'green' },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.addEntry}
      sub={batch ? c.entryFor(batchTitle(batch)) : undefined}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.saveEntry} icon="check" kind="dark" size="lg" onPress={submit} loading={costM.isPending || deathM.isPending} style={{ flex: 2 }} />
        </>
      }>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {kinds.map((k) => {
          const active = k.key === kind;
          return (
            <Pressable
              key={k.key}
              onPress={() => setKind(k.key)}
              style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, paddingHorizontal: 12, borderRadius: 14, borderWidth: active ? 1.5 : 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.head : C.white }}>
              <IconTile name={k.icon} tone={k.tone} size={32} />
              <Tx s={14} w="700">{k.label}</Tx>
            </Pressable>
          );
        })}
      </View>
      {kind === 'death' ? (
        <>
          <Field label={c.birdsDied} value={qty} onChangeText={setQty} keyboardType="number-pad" placeholder="5" autoFocus />
          <Field label={c.note} value={note} onChangeText={setNote} multiline />
        </>
      ) : (
        <>
          {kind === 'other' ? (
            <Select label={c.category} value={catId} onChange={setCategoryId} options={list.map((x) => ({ value: x._id, label: x.name }))} icon="tag" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Tx s={13} color={C.sub}>{c.category}:</Tx>
              <Tx s={13} w="700">{preferred?.name ?? '—'}</Tx>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Field label={c.quantity} value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="20" style={{ flex: 1.2 }} />
            <Field label={c.unit} value={unit} onChangeText={setUnit} style={{ flex: 0.8 }} />
            <Field label={c.rate} value={rate} onChangeText={setRate} keyboardType="decimal-pad" prefix="৳" placeholder="2,750" style={{ flex: 1.2 }} />
          </View>
          <Field label={c.date} value={date} onChangeText={setDate} icon="cal" placeholder="YYYY-MM-DD" />
          <Field label={c.note} value={note} onChangeText={setNote} />
          <TotalBox label={c.total} value={bdt(total)} sub={`${num(n(qty) || 0)} ${unit} × ${bdt(n(rate) || 0)}`} />
        </>
      )}
      <ErrorNote message={error} />
    </Drawer>
  );
}

export function CustomerDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (c: Customer) => void }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', district: '', notes: '' });
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    if (open) {
      setF({ name: '', phone: '', email: '', address: '', district: '', notes: '' });
      setError('');
    }
  }, [open]);
  const m = useMutation({
    mutationFn: () =>
      organizationApi.createCustomer({
        name: f.name.trim(),
        phone: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        address: f.address.trim() || undefined,
        district: f.district || undefined,
        notes: f.notes.trim() || undefined,
      }),
    onSuccess: async (cust) => {
      await refresh('customers');
      toast(c.customerAdded);
      onCreated?.(cust);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.addCustomer}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.save} icon="check" kind="dark" size="lg" onPress={() => (f.name.trim().length < 2 ? setError(c.name) : m.mutate())} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Field label={c.name} value={f.name} onChangeText={set('name')} icon="user" placeholder="Rahim Traders" autoFocus />
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Field label={c.phone} value={f.phone} onChangeText={set('phone')} icon="phone" keyboardType="phone-pad" placeholder="01711-482910" style={{ flex: 1 }} />
        <Field label={c.email} value={f.email} onChangeText={set('email')} icon="mail" style={{ flex: 1 }} />
      </View>
      <Field label={c.address} value={f.address} onChangeText={set('address')} icon="pin" placeholder="Sreepur bazar" />
      <Select label={c.district} value={f.district} onChange={set('district')} options={DISTRICTS.map((d) => ({ value: d, label: d }))} placeholder={c.selectDistrict} icon="pin" />
      <Field label={c.notes} value={f.notes} onChangeText={set('notes')} placeholder="Bird trader · pays weekly" />
      <ErrorNote message={error} />
    </Drawer>
  );
}

type StockMode = 'in' | 'out';

export function StockDrawer({ open, onClose, mode: initialMode, item: initialItem }: { open: boolean; onClose: () => void; mode: StockMode; item?: InventoryItem | null }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const items = useItems();
  const [mode, setMode] = useState<StockMode>(initialMode);
  const [isNew, setIsNew] = useState<'existing' | 'new'>('existing');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reason, setReason] = useState<'receive' | 'purchase' | 'adjustment' | 'consume' | 'wastage'>('receive');
  const [note, setNote] = useState('');
  const [nf, setNf] = useState({ name: '', category: 'feed', unit: 'bag', min: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setItemId(initialItem?._id ?? '');
    setIsNew(!initialItem && !(items.data ?? []).length && initialMode === 'in' ? 'new' : 'existing');
    setQty('');
    setCost(initialItem?.unitCost ? String(initialItem.unitCost) : '');
    setReason(initialMode === 'in' ? 'receive' : 'consume');
    setNote('');
    setError('');
    setNf({ name: '', category: 'feed', unit: 'bag', min: '' });
  }, [open, initialMode, initialItem, items.data]);

  const selected = (items.data ?? []).find((i) => i._id === itemId);

  const m = useMutation({
    mutationFn: async () => {
      if (mode === 'in' && isNew === 'new') {
        return inventoryApi.createItem({
          name: nf.name.trim(),
          category: nf.category,
          unit: nf.unit.trim() || 'piece',
          currentStock: n(qty) || 0,
          minStockLevel: nf.min ? n(nf.min) : undefined,
          unitCost: cost ? n(cost) : undefined,
        });
      }
      return inventoryApi.recordMovement({
        inventoryItemId: itemId,
        movementType: reason,
        quantity: n(qty),
        unitCost: mode === 'in' && cost ? n(cost) : undefined,
        notes: note.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await refresh('inventory');
      toast(mode === 'in' && isNew === 'new' ? c.itemAdded : c.stockUpdated);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const submit = () => {
    setError('');
    if (mode === 'in' && isNew === 'new') {
      if (!nf.name.trim()) return setError(c.itemName);
    } else if (!itemId || !(n(qty) > 0)) return setError(c.enterQtyRate);
    m.mutate();
  };

  const catOptions = [
    { value: 'feed', label: c.catFeed },
    { value: 'medicine', label: c.catMedicine },
    { value: 'vaccine', label: c.catVaccine },
    { value: 'equipment', label: c.catEquipment },
    { value: 'egg_tray', label: 'Egg tray' },
    { value: 'other', label: c.catOther },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === 'in' ? c.stockIn : c.stockOut}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.save} icon="check" kind="dark" size="lg" onPress={submit} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Segmented value={mode} onChange={(v) => { setMode(v); setReason(v === 'in' ? 'receive' : 'consume'); }} options={[{ key: 'in', label: c.stockIn }, { key: 'out', label: c.stockOut }]} size="lg" />
      {mode === 'in' ? (
        <Chips value={isNew} onChange={setIsNew} options={[{ key: 'existing', label: c.existingItem }, { key: 'new', label: c.newItem }]} />
      ) : null}
      {mode === 'in' && isNew === 'new' ? (
        <>
          <Field label={c.itemName} value={nf.name} onChangeText={(v) => setNf((p) => ({ ...p, name: v }))} icon="box" placeholder="Broiler starter feed" />
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Select label={c.category} value={nf.category} onChange={(v) => setNf((p) => ({ ...p, category: v }))} options={catOptions} style={{ flex: 1 }} />
            <Field label={c.unit} value={nf.unit} onChangeText={(v) => setNf((p) => ({ ...p, unit: v }))} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Field label={c.openingStock} value={qty} onChangeText={setQty} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Field label={c.minLevel} value={nf.min} onChangeText={(v) => setNf((p) => ({ ...p, min: v }))} keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>
          <Field label={c.unitCost} value={cost} onChangeText={setCost} keyboardType="decimal-pad" prefix="৳" />
        </>
      ) : (
        <>
          <Select
            label={c.item}
            value={itemId}
            onChange={(v) => {
              setItemId(v);
              const it = (items.data ?? []).find((x) => x._id === v);
              if (it?.unitCost) setCost(String(it.unitCost));
            }}
            options={(items.data ?? []).map((i) => ({ value: i._id, label: i.name, sub: `${num(i.currentStock)} ${i.unit}` }))}
            icon="box"
          />
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Field label={c.quantity} value={qty} onChangeText={setQty} keyboardType="decimal-pad" suffix={selected?.unit} style={{ flex: 1 }} />
            {mode === 'in' ? <Field label={c.unitCost} value={cost} onChangeText={setCost} keyboardType="decimal-pad" prefix="৳" style={{ flex: 1 }} /> : null}
          </View>
          <View>
            <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.reason}</Tx>
            <Chips
              value={reason}
              onChange={setReason}
              options={
                mode === 'in'
                  ? [{ key: 'receive', label: c.receive }, { key: 'purchase', label: c.purchase }, { key: 'adjustment', label: c.adjustment }]
                  : [{ key: 'consume', label: c.consume }, { key: 'wastage', label: c.wastage }]
              }
            />
          </View>
          <Field label={c.note} value={note} onChangeText={setNote} placeholder="Shed A" />
          {mode === 'in' && cost && qty ? <TotalBox label={c.total} value={bdt(n(qty) * n(cost))} /> : null}
        </>
      )}
      <ErrorNote message={error} />
    </Drawer>
  );
}

export function SupplierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const [f, setF] = useState({ name: '', phone: '', supplierType: '', address: '' });
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setF({ name: '', phone: '', supplierType: '', address: '' });
      setError('');
    }
  }, [open]);
  const m = useMutation({
    mutationFn: () => organizationApi.createSupplier({ name: f.name.trim(), phone: f.phone.trim() || undefined, supplierType: f.supplierType.trim() || undefined, address: f.address.trim() || undefined }),
    onSuccess: async () => {
      await refresh('suppliers');
      toast(c.supplierAdded);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.addSupplier}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.save} icon="check" kind="dark" size="lg" onPress={() => (f.name.trim().length < 2 ? setError(c.name) : m.mutate())} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Field label={c.name} value={f.name} onChangeText={(v) => setF((p) => ({ ...p, name: v }))} icon="briefcase" placeholder="Nourish Feeds Ltd" autoFocus />
      <Field label={c.phone} value={f.phone} onChangeText={(v) => setF((p) => ({ ...p, phone: v }))} icon="phone" keyboardType="phone-pad" />
      <Field label={c.supplierType} value={f.supplierType} onChangeText={(v) => setF((p) => ({ ...p, supplierType: v }))} icon="tag" placeholder="Feed" />
      <Field label={c.address} value={f.address} onChangeText={(v) => setF((p) => ({ ...p, address: v }))} icon="pin" />
      <ErrorNote message={error} />
    </Drawer>
  );
}

export function FarmDrawer({ open, onClose, farm }: { open: boolean; onClose: () => void; farm?: Farm | null }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const [f, setF] = useState({ name: '', farmType: 'poultry' as 'poultry' | 'cow', district: '', upazila: '', address: '' });
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    setF({ name: farm?.name ?? '', farmType: farm?.farmType ?? 'poultry', district: farm?.district ?? '', upazila: farm?.upazila ?? '', address: farm?.address ?? '' });
    setError('');
  }, [open, farm]);
  const m = useMutation({
    mutationFn: () =>
      farm
        ? organizationApi.updateFarm(farm._id, { name: f.name.trim(), district: f.district || undefined, upazila: f.upazila.trim() || undefined, address: f.address.trim() || undefined })
        : organizationApi.createFarm({ name: f.name.trim(), farmType: f.farmType, district: f.district || undefined, upazila: f.upazila.trim() || undefined, address: f.address.trim() || undefined }),
    onSuccess: async () => {
      await refresh('farms');
      toast(c.farmSaved);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={farm ? c.editFarm : c.addFarm}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.save} icon="check" kind="dark" size="lg" onPress={() => (f.name.trim().length < 2 ? setError(c.fillFarm) : m.mutate())} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Field label={c.farmName} value={f.name} onChangeText={(v) => setF((p) => ({ ...p, name: v }))} icon="barn" placeholder="Padma Poultry · Main" autoFocus />
      {!farm ? (
        <View>
          <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.farmType}</Tx>
          <Segmented value={f.farmType} onChange={(v) => setF((p) => ({ ...p, farmType: v }))} options={[{ key: 'poultry', label: c.poultry }, { key: 'cow', label: c.dairyCow }]} size="lg" />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Select label={c.district} value={f.district} onChange={(v) => setF((p) => ({ ...p, district: v }))} options={DISTRICTS.map((d) => ({ value: d, label: d }))} placeholder={c.selectDistrict} icon="pin" style={{ flex: 1 }} />
        <Field label={c.upazila} value={f.upazila} onChangeText={(v) => setF((p) => ({ ...p, upazila: v }))} style={{ flex: 1 }} />
      </View>
      <Field label={c.address} value={f.address} onChangeText={(v) => setF((p) => ({ ...p, address: v }))} icon="pin" />
      <ErrorNote message={error} />
    </Drawer>
  );
}

export function ShedDrawer({ open, onClose, farmId }: { open: boolean; onClose: () => void; farmId: string }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const [name, setName] = useState('');
  const [cap, setCap] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setName('');
      setCap('');
      setError('');
    }
  }, [open]);
  const m = useMutation({
    mutationFn: () => organizationApi.createShed({ farmId, name: name.trim(), capacity: cap ? n(cap) : undefined }),
    onSuccess: async () => {
      await refresh('sheds');
      toast(c.shedAdded);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.addShed}
      width={460}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.save} icon="check" kind="dark" size="lg" onPress={() => (!name.trim() ? setError(c.shedName) : m.mutate())} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Field label={c.shedName} value={name} onChangeText={setName} icon="layers" placeholder="Shed A" autoFocus />
      <Field label={c.capacity} value={cap} onChangeText={setCap} keyboardType="number-pad" placeholder="1,200" />
      <ErrorNote message={error} />
    </Drawer>
  );
}

const ROLE_OPTIONS: UserRole[] = ['admin', 'farm_manager', 'accountant', 'farm_supervisor', 'veterinarian', 'worker', 'salesperson'];

export function MemberDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useDash();
  const toast = useToast();
  const refresh = useRefreshAll();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', role: 'farm_manager' as UserRole });
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setF({ name: '', email: '', phone: '', password: '', role: 'farm_manager' });
      setError('');
    }
  }, [open]);
  const m = useMutation({
    mutationFn: () => authApi.createUser({ name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim() || undefined, password: f.password, role: f.role }),
    onSuccess: async () => {
      await refresh('users');
      toast(c.memberInvited);
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  const submit = () => {
    if (f.name.trim().length < 2 || !f.email.includes('@') || f.password.length < 6) return setError(c.fillAccount);
    m.mutate();
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={c.inviteMember}
      footer={
        <>
          <Btn label={c.cancel} kind="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
          <Btn label={c.inviteMember} icon="userPlus" kind="dark" size="lg" onPress={submit} loading={m.isPending} style={{ flex: 2 }} />
        </>
      }>
      <Field label={c.name} value={f.name} onChangeText={(v) => setF((p) => ({ ...p, name: v }))} icon="user" autoFocus />
      <Field label={c.email} value={f.email} onChangeText={(v) => setF((p) => ({ ...p, email: v }))} icon="mail" />
      <Field label={c.phone} value={f.phone} onChangeText={(v) => setF((p) => ({ ...p, phone: v }))} icon="phone" keyboardType="phone-pad" />
      <Field label={c.password} value={f.password} onChangeText={(v) => setF((p) => ({ ...p, password: v }))} icon="lock" secure />
      <View>
        <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.role}</Tx>
        <Chips value={f.role} onChange={(v) => setF((p) => ({ ...p, role: v }))} options={ROLE_OPTIONS.map((r) => ({ key: r, label: c.roles[r] }))} />
      </View>
      <ErrorNote message={error} />
    </Drawer>
  );
}
