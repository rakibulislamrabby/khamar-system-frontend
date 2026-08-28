import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, Easing } from 'react-native-reanimated';

import { BRAND_LOGO } from '@/components/brand-logo';

const DURATION = 300;

export function AnimatedSplashOverlay() {
  return null;
}

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.9 }],
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.out(Easing.cubic),
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={BRAND_LOGO} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 170,
  },
  image: {
    width: 200,
    height: 170,
  },
});
