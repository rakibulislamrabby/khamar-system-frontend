import { useDesktopWeb, WebSettings } from '@/components/dashboard';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { API_URL } from '@/api/client';
import { isLow, periodRange, totalsFor, useCustomers, useFarms, useItems, useSales } from '@/components/dashboard/data';
import { initials, titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { C, type Tone } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { MButton, MScreen, TitleHeader, ToneTile, Tx } from '@/components/mobile/kit';
import { Contours } from '@/components/web-landing/graphics';
import { canWriteCattle, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL?.trim() || API_URL.replace(/:5000\/api$/, ':8081').replace(/\/api$/, '')).replace(/\/$/, '');

function MoreScreen() {
  const { c } = useM();
  const { user, organization, logout } = useAuth();
  const canBatch = canWritePoultry(user?.role);
  const canCattle = canWriteCattle(user?.role);
  const cattleFarm = organization?.farmType === 'cow';
  const farms = useFarms().data ?? [];
  const items = useItems().data ?? [];
  const customers = useCustomers().data ?? [];
  const sales = useSales().data ?? [];
  const monthSales = totalsFor(sales, [], periodRange('month', 0)).saleCount;
  const role = user?.role ? (c.roles as Record<string, string>)[user.role] ?? titleCase(user.role) : '';

  const tiles: Array<{ title: string; sub: string; icon: IconName; tone: Tone; href: Href }> = [
    { title: c.farms, sub: c.locations(farms.length), icon: 'barn', tone: 'green', href: '/(app)/farms' },
    { title: c.stock, sub: c.needReorderN(items.filter(isLow).length), icon: 'box', tone: 'gold', href: '/(app)/inventory' },
    { title: c.customers, sub: c.buyersN(customers.length), icon: 'users', tone: 'sky', href: '/(app)/customers' },
    { title: c.sales, sub: c.thisMonthN(monthSales), icon: 'cash', tone: 'lime', href: '/(app)/sales' },
    { title: c.organization, sub: c.profileLegal, icon: 'briefcase', tone: 'violet', href: '/(app)/organization' },
    { title: c.settings, sub: c.langAlerts, icon: 'settings', tone: 'gray', href: '/(app)/settings' },
  ];

  return (
    <MScreen tabs header={<TitleHeader title={c.more} sub={c.moreSub} />}>
      <View style={{ backgroundColor: C.forest, borderRadius: 26, padding: 18, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }}>
          <Contours w={350} h={170} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Tx s={20} w="700" color={C.forest}>{initials(user?.name ?? 'K')}</Tx>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={17} w="700" color={C.white} lines={1} style={{ letterSpacing: -0.3 }}>{user?.name}</Tx>
            <Tx s={12} w="500" color="rgba(255,255,255,0.65)" lines={1} style={{ marginTop: 2 }}>{user?.email}</Tx>
          </View>
          {role ? (
            <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center' }}>
              <Tx s={12} w="600" color={C.lime}>{role}</Tx>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/(app)/farms')}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, borderRadius: 16, backgroundColor: C.forest2, paddingHorizontal: 14, marginTop: 16, opacity: pressed ? 0.85 : 1 })}>
          <Icon name="barn" size={18} color={C.lime} />
          <Tx s={13} w="600" color={C.white} lines={1} style={{ flex: 1 }}>{c.orgFarms(organization?.name ?? c.appName, farms.length)}</Tx>
          <Tx s={12} w="700" color={C.lime}>{c.switchFarm}</Tx>
        </Pressable>
      </View>

      {cattleFarm && canCattle ? <MButton label={c.addAnimal} icon="plus" kind="lime" onPress={() => router.push('/(app)/cattle/new')} /> : null}
      {!cattleFarm && canBatch ? <MButton label={c.addPoultryBatch} icon="plus" kind="lime" onPress={() => router.push('/(app)/poultry/new')} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map((t) => (
          <Pressable
            key={t.title}
            onPress={() => router.push(t.href)}
            style={({ pressed }) => ({ width: '48.5%', flexGrow: 1, backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 17, opacity: pressed ? 0.85 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <ToneTile icon={t.icon} tone={t.tone} size={42} radius={14} />
              <View style={{ marginTop: 13 }}>
                <Icon name="right" size={16} color={C.faint} />
              </View>
            </View>
            <Tx s={15} w="700" lines={1} style={{ marginTop: 14 }}>{t.title}</Tx>
            <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>{t.sub}</Tx>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => Linking.openURL(WEB_URL).catch(() => undefined)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.limeSoft, borderWidth: 1, borderColor: '#D6EFA0', borderRadius: 22, padding: 17, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="globe" size={20} color={C.padma} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tx s={14} w="700" lines={1}>{c.openWeb}</Tx>
          <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>{c.openWebSub}</Tx>
        </View>
        <Icon name="right" size={18} color={C.padma} />
      </Pressable>

      <Pressable
        onPress={() => logout()}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 17, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.coralSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="logout" size={18} color={C.coral} />
        </View>
        <Tx s={15} w="700" color={C.coral}>{c.signOutLabel}</Tx>
      </Pressable>

      <Tx s={12} w="500" color={C.faint} style={{ textAlign: 'center', marginTop: 4 }}>{c.versionLine(Constants.expoConfig?.version ?? '1.0.0')}</Tx>
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSettings /> : <MoreScreen />;
}
