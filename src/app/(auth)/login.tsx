import { WebSignIn } from '@/components/dashboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { MButton, MField, Notice, Tx } from '@/components/mobile/kit';
import { Contours, LogoMark } from '@/components/web-landing/graphics';
import { isMobileApp } from '@/lib/app-target';
import { useAuth } from '@/providers/auth-provider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** EN / বাং pill used on the dark auth hero. */
function HeroLangToggle() {
  const { lang, setLocale } = useM();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {(['en', 'bn'] as const).map((l) => (
        <Pressable
          key={l}
          onPress={() => setLocale(l)}
          accessibilityRole="button"
          accessibilityState={{ selected: lang === l }}
          style={{ height: 30, minWidth: 38, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: lang === l ? C.lime : 'transparent' }}>
          <Tx s={12} w="700" color={lang === l ? C.forest : C.white}>{l === 'en' ? 'EN' : 'বাং'}</Tx>
        </Pressable>
      ))}
    </View>
  );
}

function LoginScreen() {
  const { c } = useM();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!EMAIL_RE.test(email.trim()) || !password) return setError(c.enterEmailPassword);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.forest }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, opacity: 0.6 }}>
        <Contours w={width} h={340} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: C.forest2, top: -110, right: -120 }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: 54 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LogoMark size={52} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Tx s={17} w="800" color={C.white} lines={1}>{c.appName}</Tx>
                <Tx s={13} color="rgba(255,255,255,0.62)" lines={1}>{c.appTagline}</Tx>
              </View>
              <HeroLangToggle />
            </View>
            <Tx s={12} w="800" color={C.lime} style={{ marginTop: 34, letterSpacing: 1.2, textTransform: 'uppercase' }}>{c.heroEyebrow}</Tx>
            <Tx s={34} w="800" color={C.white} style={{ marginTop: 8, letterSpacing: -1.2, lineHeight: 40 }}>
              {`${c.heroLine1}\n${c.heroLine2}`}
            </Tx>
          </View>

          <View style={{ flex: 1, backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 26, paddingBottom: insets.bottom + 20 }}>
            <Tx s={22} w="800" style={{ letterSpacing: -0.5 }}>{c.welcomeBack}</Tx>
            <Tx s={14} color={C.sub} style={{ marginTop: 4 }}>{c.signInSub}</Tx>

            <View style={{ gap: 16, marginTop: 22 }}>
              <MField label={c.email} icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="owner@khamarmanager.com" />
              <MField label={c.password} icon="lock" value={password} onChangeText={setPassword} secure placeholder="••••••••" />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
              <Pressable onPress={() => setHint((v) => !v)} hitSlop={8}>
                <Tx s={13} w="700" color={C.padma}>{c.forgot}</Tx>
              </Pressable>
            </View>
            {hint ? <Tx s={12} color={C.sub} style={{ marginTop: 6, textAlign: 'right' }}>{c.forgotHint}</Tx> : null}

            <View style={{ gap: 12, marginTop: 18 }}>
              <Notice message={error} />
              <MButton label={c.signIn} kind="dark" onPress={submit} loading={loading} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
              <Tx s={12} color={C.faint}>{c.newToKhamar}</Tx>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
            </View>

            <MButton label={c.createFarmAccount} icon="barn" kind="outline" onPress={() => router.push('/(auth)/register')} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' as unknown as number, paddingTop: 20 }}>
              <Icon name="shield" size={13} color={C.faint} />
              <Tx s={12} color={C.faint}>{c.encrypted}</Tx>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function Route() {
  return isMobileApp ? <LoginScreen /> : <WebSignIn />;
}
