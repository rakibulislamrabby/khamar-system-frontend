import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/primitives';
import { Palette } from '@/constants/theme';

const WAVES = {
  bottom: [
    'M0,70 C220,120 460,10 720,52 C980,94 1210,26 1440,62 L1440,120 L0,120 Z',
    'M0,40 C260,96 520,0 760,40 C1000,80 1220,10 1440,46 L1440,120 L0,120 Z',
  ],
  top: [
    'M0,50 C220,0 460,110 720,68 C980,26 1210,94 1440,58 L1440,0 L0,0 Z',
    'M0,80 C260,24 520,120 760,80 C1000,40 1220,110 1440,74 L1440,0 L0,0 Z',
  ],
} as const;

export function Wave({
  color,
  edge = 'bottom',
  variant = 0,
  height = 90,
  opacity = 1,
}: {
  color: string;
  edge?: 'top' | 'bottom';
  variant?: 0 | 1;
  height?: number;
  opacity?: number;
}) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 1440 120" preserveAspectRatio="none">
      <Path d={WAVES[edge][variant]} fill={color} fillOpacity={opacity} />
    </Svg>
  );
}

const BEZEL = '#0E1A14';

export function PhoneMockup({
  source,
  label,
  width,
  greenTop = false,
  captionLight = false,
}: {
  source: number;
  label: string;
  width: number;
  greenTop?: boolean;
  captionLight?: boolean;
}) {
  const bezel = Math.max(6, Math.round(width * 0.035));
  const screenW = width - bezel * 2;
  const statusH = Math.round(screenW * 0.1);
  const imageH = Math.round(screenW * (844 / 390));
  const outerRadius = Math.round(width * 0.17);
  const innerRadius = outerRadius - bezel;
  const island = Math.round(screenW * 0.3);
  const ink = greenTop ? Palette.white : Palette.ink;
  const scale = screenW / 300;

  return (
    <View style={{ width, alignSelf: 'center' }}>
      <View
        style={{
          width,
          padding: bezel,
          borderRadius: outerRadius,
          backgroundColor: BEZEL,
          boxShadow: '0 28px 60px rgba(14, 26, 20, 0.28)',
        }}>
        <SideButton side="left" top={width * 0.3} length={width * 0.1} />
        <SideButton side="left" top={width * 0.45} length={width * 0.16} />
        <SideButton side="right" top={width * 0.38} length={width * 0.2} />

        <View
          style={{
            overflow: 'hidden',
            borderRadius: innerRadius,
            backgroundColor: greenTop ? Palette.padma : Palette.rice,
          }}>
          <View
            style={{
              height: statusH,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: screenW * 0.08,
            }}>
            <Text style={{ fontSize: Math.max(9, 12 * scale), fontWeight: '700', color: ink }}>
              9:41
            </Text>
            <View
              style={{
                position: 'absolute',
                left: (screenW - island) / 2,
                top: statusH * 0.2,
                width: island,
                height: statusH * 0.6,
                borderRadius: 999,
                backgroundColor: BEZEL,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 * scale }}>
              {[0.35, 0.55, 0.75, 1].map((h) => (
                <View
                  key={h}
                  style={{
                    width: 3 * scale,
                    height: 10 * scale * h,
                    borderRadius: 1,
                    backgroundColor: ink,
                  }}
                />
              ))}
              <View
                style={{
                  marginLeft: 4 * scale,
                  width: 20 * scale,
                  height: 10 * scale,
                  borderRadius: 3 * scale,
                  borderWidth: 1,
                  borderColor: ink,
                  padding: 1.5 * scale,
                }}>
                <View style={{ flex: 1, width: '75%', borderRadius: 1.5 * scale, backgroundColor: ink }} />
              </View>
            </View>
          </View>
          <Image
            source={source}
            style={{ width: screenW, height: imageH }}
            contentFit="cover"
            accessibilityLabel={label}
          />
        </View>
      </View>
      <AppText
        variant="caption"
        className={`mt-3 text-center font-semibold ${captionLight ? 'text-white/75' : 'text-ink'}`}>
        {label}
      </AppText>
    </View>
  );
}

function SideButton({ side, top, length }: { side: 'left' | 'right'; top: number; length: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        [side]: -3,
        top,
        width: 3,
        height: length,
        borderRadius: 2,
        backgroundColor: BEZEL,
      }}
    />
  );
}
