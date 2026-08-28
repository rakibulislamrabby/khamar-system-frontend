import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'khamar_access_token';
const REFRESH_KEY = 'khamar_refresh_token';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_KEY),
  getRefreshToken: () => getItem(REFRESH_KEY),
  setTokens: async (accessToken: string, refreshToken: string) => {
    await setItem(ACCESS_KEY, accessToken);
    await setItem(REFRESH_KEY, refreshToken);
  },
  clear: async () => {
    await deleteItem(ACCESS_KEY);
    await deleteItem(REFRESH_KEY);
  },
};
