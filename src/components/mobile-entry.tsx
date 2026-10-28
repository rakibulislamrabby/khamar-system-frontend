import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

/** The mobile app has no landing page: it opens on sign-in or home. */
export function MobileEntry() {
  const { status } = useAuth();
  return <Redirect href={status === 'authenticated' ? '/(app)' : '/(auth)/login'} />;
}
