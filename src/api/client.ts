import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { tokenStorage } from '@/lib/storage';
import type { ApiErrorBody, AuthTokens } from '@/types/api';

const LOOPBACK = /^(localhost|127\.0\.0\.1)$/;

/** Host of the PC running Metro (e.g. 192.168.0.103), or 10.0.2.2 on the Android emulator. */
function devMachineHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.experienceUrl?.replace(/^[a-z]+:\/\//, '') ||
    '';
  const host = hostUri.split(':')[0];
  if (host && !LOOPBACK.test(host)) return host;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function resolveApiUrl() {
  const isNative = Platform.OS !== 'web';
  const fromEnv = ((isNative && process.env.EXPO_PUBLIC_NATIVE_API_URL?.trim()) || process.env.EXPO_PUBLIC_API_URL?.trim() || '').replace(/\/$/, '');

  if (!fromEnv) return isNative ? `http://${devMachineHost()}:5000/api` : 'http://localhost:5000/api';

  // On a phone "localhost" is the phone itself, so point it at the dev machine instead.
  return isNative ? fromEnv.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/, `$1${devMachineHost()}`) : fromEnv;
}

export const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ success: boolean; data: AuthTokens }>(
      `${API_URL}/auth/refresh`,
      { refreshToken }
    );
    const tokens = data.data;
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED';
      return Promise.reject(
        new Error(
          isTimeout
            ? `Request timed out talking to ${API_URL}. The server may be cold-starting or MongoDB is unreachable.`
            : `Cannot reach ${API_URL}. Check internet, API URL in .env.local, and restart Expo with: npx expo start -c`
        )
      );
    }

    const message =
      error.response.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
