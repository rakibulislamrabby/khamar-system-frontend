import { Platform } from 'react-native';

/**
 * `npm run web` serves the website (landing page + web dashboard).
 * `npm run native` sets EXPO_PUBLIC_APP_TARGET=native, so even its browser preview shows the mobile app.
 */
export const isMobileApp = Platform.OS !== 'web' || process.env.EXPO_PUBLIC_APP_TARGET === 'native';
export const isWebsite = !isMobileApp;
