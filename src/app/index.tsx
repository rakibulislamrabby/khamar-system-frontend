import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { status } = useAuth();

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
