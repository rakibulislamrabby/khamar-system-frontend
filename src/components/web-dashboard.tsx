import { Stack, usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandLogo } from '@/components/brand-logo';
import { AppText } from '@/components/ui/primitives';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

const NAV = [
  { href: '/(app)', match: /^\/$|\/\(app\)$/, label: 'home' as const, icon: 'home' as const },
  { href: '/(app)/livestock', match: /livestock|poultry/, label: 'livestock' as const, icon: 'paw' as const },
  { href: '/(app)/sell', match: /\/sell/, label: 'sellTab' as const, icon: 'cash' as const },
  { href: '/(app)/hisab', match: /hisab/, label: 'hisabTab' as const, icon: 'document-text' as const },
  { href: '/(app)/farms', match: /farms/, label: 'farms' as const, icon: 'business' as const },
  { href: '/(app)/inventory', match: /inventory/, label: 'stock' as const, icon: 'cube' as const },
  { href: '/(app)/customers', match: /customers/, label: 'customers' as const, icon: 'people' as const },
  { href: '/(app)/sales', match: /\/sales/, label: 'sales' as const, icon: 'receipt' as const },
  { href: '/(app)/organization', match: /organization/, label: 'organization' as const, icon: 'home-outline' as const },
  { href: '/(app)/settings', match: /settings/, label: 'settings' as const, icon: 'settings' as const },
] as const;

export function WebDashboard() {
  const { t } = useLocale();
  const { user, organization, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View className="min-h-screen flex-1 flex-row bg-rice">
      <View className="w-64 border-r border-line bg-soil">
        <View className="px-4 pb-4 pt-5">
          <BrandLogo size="sm" />
          <AppText variant="caption" className="mt-2 text-white/80" numberOfLines={2}>
            {organization?.name ?? t('appName')}
          </AppText>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="gap-1 px-3 pb-4">
          {NAV.map((item) => {
            const active = item.match.test(pathname);
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href)}
                className={`flex-row items-center gap-3 rounded-xl px-3 py-2.5 ${active ? 'bg-white/15' : ''}`}>
                <Ionicons name={item.icon} size={18} color={active ? '#E0B84A' : '#E8F2EC'} />
                <AppText variant="caption" className={active ? 'font-semibold text-jute' : 'text-white'}>
                  {t(item.label)}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        <View className="border-t border-white/10 px-4 py-4">
          <AppText variant="caption" className="text-white" numberOfLines={1}>
            {user?.name}
          </AppText>
          <Pressable onPress={() => logout()} className="mt-3">
            <AppText variant="caption" className="font-semibold text-jute">
              {t('signOut')}
            </AppText>
          </Pressable>
        </View>
      </View>
      <View className="min-w-0 flex-1">
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F2F7F4' } }} />
      </View>
    </View>
  );
}
