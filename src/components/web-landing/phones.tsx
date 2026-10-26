import type { ReactNode } from 'react';
import { Text, View, type TextStyle } from 'react-native';

import type { LandingCopy } from '@/components/web-landing/copy';
import { Area, Avatar, Bars, Chip, Donut, Icon, LogoMark, PairBars, PhoneFrame, Ring } from '@/components/web-landing/graphics';
import { C, weeks } from '@/components/web-landing/theme';

function T({ children, font, style }: { children: ReactNode; font: string; style?: TextStyle }) {
  return <Text style={[{ fontFamily: font, color: C.ink }, style]}>{children}</Text>;
}

function Status({ font, color = C.ink }: { font: string; color?: string }) {
  return (
    <View style={{ height: 36, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <T font={font} style={{ fontSize: 11, fontWeight: '700', color }}>9:41</T>
      <View style={{ width: 18, height: 9, borderRadius: 3, borderWidth: 1.4, borderColor: color }} />
    </View>
  );
}

function Dock() {
  return (
    <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, height: 48, borderRadius: 18, backgroundColor: C.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {['home', 'bird', 'cash', 'receipt', 'grid'].map((name, i) =>
        i === 2 ? (
          <View key={name} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.lime, marginTop: -16, borderWidth: 3, borderColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={name} size={16} color={C.forest} sw={2.2} />
          </View>
        ) : (
          <View key={name} style={{ width: 32, height: 26, borderRadius: 9, backgroundColor: i === 0 ? C.lime : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={name} size={14} color={i === 0 ? C.forest : 'rgba(255,255,255,0.6)'} />
          </View>
        ),
      )}
    </View>
  );
}

export function PhoneHome({ c, font, width = 250, height = 520 }: { c: LandingCopy; font: string; width?: number; height?: number }) {
  const chartW = width - 18 - 56;
  return (
    <PhoneFrame width={width} height={height}>
      <Status font={font} />
      <View style={{ paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <T font={font} style={{ fontSize: 10, color: C.sub }}>Padma Poultry</T>
            <T font={font} style={{ fontSize: 14, fontWeight: '800' }}>{c.goodMorning}</T>
          </View>
          <Avatar initials="KU" bg={C.lime} fg={C.forest} size={28} />
        </View>
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: C.forest, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T font={font} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{c.netProfit}</T>
            <View style={{ backgroundColor: C.lime, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
              <T font={font} style={{ fontSize: 9, fontWeight: '700', color: C.forest }}>+18.4%</T>
            </View>
          </View>
          <T font={font} style={{ fontSize: 20, fontWeight: '800', color: C.white, marginTop: 2 }}>৳1,21,350</T>
          <View style={{ marginTop: 4 }}>
            <Area w={chartW} h={30} pts={[3, 4, 3.6, 5.5, 5, 6.6, 6.2, 8]} stroke={C.lime} sw={2} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[
            ['egg', c.eggsToday, '1,742', C.goldSoft, '#B07A00'],
            ['milk', c.morning, '126 L', C.skySoft, C.sky],
          ].map(([ic, label, value, bg, fg]) => (
            <View key={label} style={{ flex: 1, padding: 8, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
              <Chip name={ic} bg={bg} fg={fg} size={24} />
              <T font={font} style={{ fontSize: 10, color: C.sub, marginTop: 6 }}>{label}</T>
              <T font={font} style={{ fontSize: 14, fontWeight: '800' }}>{value}</T>
            </View>
          ))}
        </View>
        <T font={font} style={{ fontSize: 12, fontWeight: '700', marginTop: 10 }}>{c.activeBatches}</T>
        {[
          ['B-12 · Broiler', 'Day 24 · 1,164'],
          ['S-07 · Sonali', 'Day 41 · 1,486'],
        ].map(([name, sub]) => (
          <View key={name} style={{ flexDirection: 'row', gap: 8, marginTop: 6, padding: 8, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center' }}>
            <Chip name="bird" bg={C.limeSoft} fg={C.padma} size={26} />
            <View style={{ flex: 1 }}>
              <T font={font} style={{ fontSize: 11, fontWeight: '700' }}>{name}</T>
              <T font={font} style={{ fontSize: 10, color: C.sub }}>{sub}</T>
            </View>
          </View>
        ))}
      </View>
      <Dock />
    </PhoneFrame>
  );
}

export function PhoneSell({ c, font, width = 280, height = 580 }: { c: LandingCopy; font: string; width?: number; height?: number }) {
  return (
    <PhoneFrame width={width} height={height}>
      <Status font={font} />
      <View style={{ paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="left" size={14} color={C.ink} />
          </View>
          <T font={font} style={{ fontSize: 14, fontWeight: '800' }}>{c.newSale}</T>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {['Broiler', 'Eggs', 'Milk', 'Cow'].map((label, i) => (
            <View key={label} style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: i === 0 ? C.forest : C.white, borderWidth: 1, borderColor: i === 0 ? C.forest : C.line }}>
              <T font={font} style={{ fontSize: 10, fontWeight: '700', color: i === 0 ? C.lime : C.sub }}>{label}</T>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 10, padding: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
          <T font={font} style={{ fontSize: 10, color: C.sub, fontWeight: '600' }}>{c.buyer}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Avatar initials="RT" bg={C.mint} fg={C.padma} size={26} />
            <View style={{ flex: 1 }}>
              <T font={font} style={{ fontSize: 12, fontWeight: '700' }}>Rahim Traders</T>
              <T font={font} style={{ fontSize: 10, fontWeight: '600', color: '#B8382A' }}>{c.owes}</T>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[
            [c.weight, '165 kg'],
            [c.rate, '৳180'],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
              <T font={font} style={{ fontSize: 10, color: C.sub }}>{label}</T>
              <T font={font} style={{ fontSize: 15, fontWeight: '800', marginTop: 2 }}>{value}</T>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: C.limeSoft }}>
          <T font={font} style={{ fontSize: 10, fontWeight: '700', color: C.padma }}>{c.total.toUpperCase()}</T>
          <T font={font} style={{ fontSize: 24, fontWeight: '800', color: C.forest }}>৳29,700</T>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14, height: 44, borderRadius: 14, backgroundColor: C.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="check" size={15} color={C.lime} sw={2.6} />
        <T font={font} style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{c.saveSale}</T>
      </View>
    </PhoneFrame>
  );
}

export function PhoneHisab({ c, font, width = 250, height = 520 }: { c: LandingCopy; font: string; width?: number; height?: number }) {
  return (
    <PhoneFrame width={width} height={height}>
      <Status font={font} />
      <View style={{ paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T font={font} style={{ fontSize: 18, fontWeight: '800' }}>{c.hisabEyebrow}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Icon name="cal" size={11} color={C.sub} />
            <T font={font} style={{ fontSize: 10, fontWeight: '700' }}>{c.october}</T>
          </View>
        </View>
        <View style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: C.forest }}>
          <T font={font} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{c.netProfit}</T>
          <T font={font} style={{ fontSize: 20, fontWeight: '800', color: C.lime }}>৳1,21,350</T>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
            <T font={font} style={{ fontSize: 10, color: C.white }}>{c.income} ৳4.82L</T>
            <T font={font} style={{ fontSize: 10, color: C.white }}>{c.expense} ৳3.61L</T>
          </View>
        </View>
        <View style={{ marginTop: 8, padding: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Donut size={72} sw={12} segs={[{ p: 54, color: C.padma }, { p: 18, color: C.lime }, { p: 11, color: C.gold }, { p: 9, color: C.sky }, { p: 8, color: C.coral }]} />
          <View style={{ flex: 1, gap: 3 }}>
            {[
              ['Feed', '54%', C.padma],
              ['Chicks', '18%', C.lime],
              ['Labour', '11%', C.gold],
              ['Medicine', '9%', C.sky],
            ].map(([label, value, color]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }} />
                <T font={font} style={{ flex: 1, fontSize: 10, color: C.sub }}>{label}</T>
                <T font={font} style={{ fontSize: 10, fontWeight: '700' }}>{value}</T>
              </View>
            ))}
          </View>
        </View>
        <View style={{ marginTop: 8, padding: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
          <T font={font} style={{ fontSize: 11, fontWeight: '700', marginBottom: 6 }}>{c.weeklyFlow}</T>
          <PairBars w={width - 56} h={64} pairs={weeks.slice(5)} />
        </View>
      </View>
      <Dock />
    </PhoneFrame>
  );
}

export function BrowserDash({ c, font }: { c: LandingCopy; font: string }) {
  const nav = [
    ['grid', 'Dashboard', true],
    ['bird', 'Livestock', false],
    ['box', 'Stock', false],
    ['cash', 'Sell', false],
    ['file', 'Hisab', false],
    ['users', 'Customers', false],
  ] as const;
  return (
    <View style={{ width: 590, borderRadius: 18, backgroundColor: C.white, overflow: 'hidden', boxShadow: '0 40px 80px rgba(2,16,10,0.45)' }}>
      <View style={{ height: 34, backgroundColor: '#EEF3F0', borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}>
        {[C.coral, C.gold, C.emerald].map((color) => (
          <View key={color} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
        ))}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderRadius: 7, paddingHorizontal: 10, height: 20 }}>
            <Icon name="lock" size={10} color={C.emerald} sw={2.4} />
            <T font={font} style={{ fontSize: 10, color: C.sub }}>app.khamarmanager.com/dashboard</T>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 132, backgroundColor: C.forest, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LogoMark size={22} />
            <T font={font} style={{ color: C.white, fontWeight: '800', fontSize: 12 }}>Khamar</T>
          </View>
          <View style={{ marginTop: 16, gap: 3 }}>
            {nav.map(([icon, label, on]) => (
              <View key={label} style={{ height: 28, borderRadius: 8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? C.lime : 'transparent' }}>
                <Icon name={icon} size={12} color={on ? C.forest : 'rgba(255,255,255,0.7)'} />
                <T font={font} style={{ fontSize: 11, color: on ? C.forest : 'rgba(255,255,255,0.78)', fontWeight: '600' }}>{label}</T>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: C.canvas, padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <T font={font} style={{ fontSize: 10, color: C.faint }}>Overview</T>
              <T font={font} style={{ fontSize: 14, fontWeight: '800' }}>{c.goodMorning}</T>
            </View>
            <View style={{ backgroundColor: C.lime, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="plus" size={11} color={C.forest} sw={2.6} />
              <T font={font} style={{ fontSize: 10, fontWeight: '700', color: C.forest }}>New entry</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: C.forest }}>
              <T font={font} style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{c.netProfit}</T>
              <T font={font} style={{ fontSize: 15, fontWeight: '800', color: C.white }}>৳1,21,350</T>
              <Area w={100} h={20} pts={[3, 4, 4, 6, 5, 7, 8]} stroke={C.lime} sw={2} />
            </View>
            <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
              <T font={font} style={{ fontSize: 10, color: C.sub }}>{c.income}</T>
              <T font={font} style={{ fontSize: 15, fontWeight: '800' }}>৳4.82L</T>
              <Bars w={90} h={20} vals={[4, 6, 5, 7, 6, 8, 9]} color={C.emerald} muted={C.mint} />
            </View>
            <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
              <T font={font} style={{ fontSize: 10, color: C.sub }}>{c.eggsToday}</T>
              <T font={font} style={{ fontSize: 15, fontWeight: '800' }}>1,742</T>
              <Bars w={90} h={20} vals={[6, 7, 7, 8, 8, 8, 9]} color={C.gold} muted={C.goldSoft} />
            </View>
          </View>
          <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
            <T font={font} style={{ fontSize: 12, fontWeight: '700' }}>{c.income} vs {c.expense.toLowerCase()}</T>
            <View style={{ marginTop: 8 }}>
              <PairBars w={280} h={78} pairs={weeks.slice(4)} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function MiniRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <View style={{ width: 46, height: 46 }}>
      <Ring size={46} pct={pct} color={color} track="rgba(255,255,255,0.12)" sw={6} />
      <View style={{ position: 'absolute', left: 0, top: 0, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>{label}</Text>
      </View>
    </View>
  );
}
