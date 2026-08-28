import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Button, Card, PageHeader, Screen } from '@/components/ui/primitives';
import { labelize } from '@/lib/format';
import { canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

export default function MoreScreen() {
  const { t } = useLocale();
  const { user, organization, logout } = useAuth();
  const canBatch = canWritePoultry(user?.role);
  const initial = (user?.name?.trim()?.charAt(0) || 'K').toUpperCase();

  const links = [
    {
      title: t('farms'),
      subtitle: t('organizationSub'),
      href: '/(app)/farms' as const,
      icon: 'business-outline' as const,
    },
    {
      title: t('stock'),
      subtitle: t('viewStock'),
      href: '/(app)/inventory' as const,
      icon: 'cube-outline' as const,
    },
    {
      title: t('customers'),
      subtitle: t('customersSub'),
      href: '/(app)/customers' as const,
      icon: 'people-outline' as const,
    },
    {
      title: t('organization'),
      subtitle: t('organizationSub'),
      href: '/(app)/organization' as const,
      icon: 'home-outline' as const,
    },
    {
      title: t('settings'),
      subtitle: t('settingsSub'),
      href: '/(app)/settings' as const,
      icon: 'settings-outline' as const,
    },
  ];

  return (
    <Screen>
      <PageHeader title={t('more')} subtitle={t('moreSubtitle')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-28"
        keyboardShouldPersistTaps="handled">
        <Card className="py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-padma">
              <AppText className="text-lg font-bold text-white">{initial}</AppText>
            </View>
            <View className="flex-1">
              <AppText variant="subtitle">{user?.name}</AppText>
              <AppText variant="caption" className="mt-0.5" numberOfLines={1}>
                {user?.email} · {labelize(user?.role)}
              </AppText>
              <AppText variant="caption" className="mt-0.5" numberOfLines={1}>
                {organization?.name}
              </AppText>
            </View>
          </View>
        </Card>

        {canBatch ? (
          <Button
            title={t('addPoultryBatch')}
            onPress={() => router.push('/(app)/poultry/new')}
          />
        ) : null}

        <View className="overflow-hidden rounded-2xl border border-line bg-white">
          {links.map((link, index) => (
            <View key={link.href}>
              {index > 0 ? <View className="ml-[3.75rem] h-px bg-line" /> : null}
              <Pressable
                onPress={() => router.push(link.href)}
                className="flex-row items-center gap-3 px-4 py-3.5 active:bg-padma-soft/40">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-padma-soft">
                  <Ionicons name={link.icon} size={20} color="#006A4E" />
                </View>
                <View className="flex-1">
                  <AppText variant="subtitle">{link.title}</AppText>
                  <AppText variant="caption" className="mt-0.5">
                    {link.subtitle}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#5C7266" />
              </Pressable>
            </View>
          ))}
        </View>

        <Button title={t('signOut')} variant="danger" onPress={() => logout()} />
      </ScrollView>
    </Screen>
  );
}
