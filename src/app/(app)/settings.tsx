import { router } from 'expo-router';
import { View } from 'react-native';

import {
  AppText,
  FormBackHeader,
  OptionChips,
  Screen,
} from '@/components/ui/primitives';
import { useLocale } from '@/providers/locale-provider';
import type { Locale } from '@/i18n/translations';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useLocale();

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
    </Screen>
  );
}
