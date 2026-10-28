import '@/global.css';

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, useColorScheme, View } from 'react-native';

import { Colors, Palette } from '@/constants/theme';
import { isMobileApp } from '@/lib/app-target';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { QueryProvider } from '@/providers/query-provider';

SplashScreen.preventAutoHideAsync();

const lightNav = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Palette.clay,
  },
};

const darkNav = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Palette.clay,
  },
};

function RootNavigator() {
  const { status } = useAuth();
  const scheme = useColorScheme();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  return (
    <ThemeProvider value={scheme === 'dark' ? darkNav : lightNav}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'unauthenticated'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web' || !isMobileApp) return children;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#DDE5E0' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden', boxShadow: '0 0 40px rgba(0, 0, 0, 0.12)' }}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthProvider>
          <PhoneFrame>
            <RootNavigator />
          </PhoneFrame>
        </AuthProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
