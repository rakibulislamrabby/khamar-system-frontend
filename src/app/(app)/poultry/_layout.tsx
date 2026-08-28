import { Stack } from 'expo-router';

export default function PoultryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F2F7F4' },
      }}
    />
  );
}
