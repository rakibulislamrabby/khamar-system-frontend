import { useDesktopWeb, WebSettings } from '@/components/dashboard';
import { router } from 'expo-router';
import { View } from 'react-native';

import {
  AppText,
  FormBackHeader,
  OptionChips,
  Screen,
} from '@/components/ui/primitives';
import { BrandLogo } from '@/components/brand-logo';
import { useLocale } from '@/providers/locale-provider';
import type { Locale } from '@/i18n/translations';
import Constants from 'expo-constants';

function SettingsScreen() {
  const { t, locale, setLocale } = useLocale();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <FormBackHeader title={t('settings')} onBack={() => router.back()} />
      <AppText variant="caption" className="mb-6">
        {t('languageHint')}
      </AppText>

      <View className="gap-4">
        <OptionChips
          label={t('language')}
          value={locale}
          options={[
            { value: 'bn', label: t('bangla') },
            { value: 'en', label: t('english') },
          ]}
          onChange={(value) => setLocale(value as Locale)}
        />
      </View>

      <View className="mt-10 items-center gap-2">
        <BrandLogo size="sm" />
        <AppText variant="subtitle">{t('appName')}</AppText>
        <AppText variant="caption">{t('brandTagline')}</AppText>
        <AppText variant="caption">v{appVersion}</AppText>
      </View>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSettings /> : <SettingsScreen />;
}
