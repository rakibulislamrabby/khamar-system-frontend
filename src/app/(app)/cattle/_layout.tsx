import { Stack } from 'expo-router';

export default function CattleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F2F7F4' },
      }}
    />
  );
}
