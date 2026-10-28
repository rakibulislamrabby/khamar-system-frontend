import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardShell, useDesktopWeb } from '@/components/dashboard';
import { Tx } from '@/components/dashboard/kit';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import type { TranslationKey } from '@/i18n/translations';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

export default function AppLayout() {
  if (useDesktopWeb()) {
    return <DashboardShell />;
  }
  return <PhoneTabs />;
}

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Figma "03 · Home" tab bar. Only these routes show it; every other screen is a full page with a back button. */
const TABS: Array<{ name: string; label: TranslationKey; icon: IconName }> = [
  { name: 'index', label: 'home', icon: 'home' },
  { name: 'livestock', label: 'livestock', icon: 'bird' },
  { name: 'sell', label: 'sellTab', icon: 'cash' },
  { name: 'hisab', label: 'hisabTab', icon: 'file' },
  { name: 'more', label: 'more', icon: 'grid' },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useLocale();
  const { organization } = useAuth();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  if (!TABS.some((tab) => tab.name === current)) return null;

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (current !== name && !event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 8) + 8,
        height: 74,
        borderRadius: 28,
        backgroundColor: C.forest,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        boxShadow: '0 18px 40px rgba(12, 42, 32, 0.35)',
      }}>
      {TABS.map((tab) => {
        const active = current === tab.name;
        const label = t(tab.label);
        const icon = tab.name === 'livestock' && organization?.farmType === 'cow' ? 'barn' : tab.icon;
        if (tab.name === 'sell') {
          return (
            <Pressable key={tab.name} onPress={() => go(tab.name)} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', marginTop: -32 }}>
              <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: C.lime, borderWidth: 5, borderColor: C.canvas, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(12, 42, 32, 0.25)' }}>
                <Icon name={tab.icon} size={24} color={C.forest} sw={2.2} />
              </View>
              <Tx s={11} w="600" lines={1} color={active ? C.white : 'rgba(255,255,255,0.6)'} style={{ marginTop: 4, lineHeight: 14 }}>{label}</Tx>
            </Pressable>
          );
        }
        return (
          <Pressable key={tab.name} onPress={() => go(tab.name)} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
            <View style={{ width: 44, height: 30, borderRadius: 12, backgroundColor: active ? C.lime : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={20} color={active ? C.forest : 'rgba(255,255,255,0.62)'} sw={1.7} />
            </View>
            <Tx s={11} w="600" lines={1} color={active ? C.white : 'rgba(255,255,255,0.6)'} style={{ lineHeight: 14 }}>{label}</Tx>
          </Pressable>
        );
      })}
    </View>
  );
}

function PhoneTabs() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
      <Tabs.Screen name="farms" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
      <Tabs.Screen name="organization" options={{ href: null }} />
      <Tabs.Screen name="poultry" options={{ href: null }} />
      <Tabs.Screen name="cattle" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
