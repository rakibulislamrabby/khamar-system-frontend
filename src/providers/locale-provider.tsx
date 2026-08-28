import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Locale, TranslationKey, translations } from '@/i18n/translations';

const LOCALE_KEY = 'khamar_locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey) => string;
  isReady: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>('bn');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        if (saved === 'en' || saved === 'bn') {
          setLocaleState(saved);
        }
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? translations.en[key] ?? key,
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isReady }),
    [locale, setLocale, t, isReady]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
