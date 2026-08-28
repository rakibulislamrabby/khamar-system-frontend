import { Image } from 'expo-image';
import { View } from 'react-native';

import { AppText } from '@/components/ui/primitives';
import { useLocale } from '@/providers/locale-provider';

export const BRAND_LOGO = require('@/assets/images/logo/khamar-manager.png');

const SIZES = {
  header: { width: 52, height: 44 },
  xs: { width: 88, height: 75 },
  sm: { width: 120, height: 102 },
  md: { width: 180, height: 153 },
  lg: { width: 220, height: 187 },
} as const;

export function BrandLogo({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { width, height } = SIZES[size];

  return (
    <View className={className}>
      <Image
        source={BRAND_LOGO}
        style={{ width, height }}
        contentFit="contain"
        accessibilityLabel="Khamar Manager logo"
      />
    </View>
  );
}

export function BrandHeader({
  showTagline = true,
  size = 'md',
  light = true,
}: {
  showTagline?: boolean;
  size?: keyof typeof SIZES;
  light?: boolean;
}) {
  const { t } = useLocale();
  const textClass = light ? 'text-white' : 'text-ink';
  const subClass = light ? 'text-white/85' : 'text-muted';

  return (
    <View className="items-center">
      <BrandLogo size={size} />
      <AppText variant="title" className={`mt-3 text-center ${textClass}`}>
        {t('appName')}
      </AppText>
      {showTagline ? (
        <AppText variant="caption" className={`mt-1.5 max-w-[300px] text-center ${subClass}`}>
          {t('brandTagline')}
        </AppText>
      ) : null}
    </View>
  );
}
