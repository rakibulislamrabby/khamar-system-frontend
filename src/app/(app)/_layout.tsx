import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLocale } from '@/providers/locale-provider';

export default function AppLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#006A4E',
        tabBarInactiveTintColor: '#5C7266',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D5E3DA',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="livestock"
        options={{
          title: t('livestock'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: t('sellTab'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hisab"
        options={{
          title: t('hisabTab'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('more'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size ?? 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="farms" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
      <Tabs.Screen name="organization" options={{ href: null }} />
      <Tabs.Screen name="poultry" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
