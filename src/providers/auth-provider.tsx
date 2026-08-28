import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { tokenStorage } from '@/lib/storage';
import type { Organization, RegisterPayload, User } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  organization: Organization | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const applySession = useCallback((nextUser: User, nextOrg: Organization) => {
    setUser(nextUser);
    setOrganization(nextOrg);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
    setOrganization(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.profile();
    applySession(profile.user, profile.organization);
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          if (mounted) setStatus('unauthenticated');
          return;
        }
        const profile = await authApi.profile();
        if (!mounted) return;
        applySession(profile.user, profile.organization);
      } catch {
        await tokenStorage.clear();
        if (mounted) setStatus('unauthenticated');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await authApi.login(email.trim().toLowerCase(), password);
        await tokenStorage.setTokens(data.accessToken, data.refreshToken);
        applySession(data.user, data.organization);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const data = await authApi.register(payload);
        await tokenStorage.setTokens(data.accessToken, data.refreshToken);
        applySession(data.user, data.organization);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      await authApi.logout(refreshToken);
    } catch {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      organization,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [status, user, organization, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
