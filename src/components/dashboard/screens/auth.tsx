import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { DISTRICTS } from '@/components/dashboard/copy';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Btn, ErrorNote, Field, Select, Tx } from '@/components/dashboard/kit';
import { useDash, useWebFonts } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import { Contours, LogoMark } from '@/components/web-landing/graphics';
import type { CattleLogic } from '@/lib/cattle';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { FarmType } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function HeroPanel() {
  const { c } = useDash();
  const { width } = useWindowDimensions();
  const pad = width >= 1280 ? 64 : 44;
  const stats = [
    { v: '3,903', l: c.birdsAliveStat },
    { v: '126 L', l: c.milkTodayStat },
    { v: '+৳1.21L', l: c.thisMonthStat },
  ];
  return (
    <View style={{ flex: 0.8, maxWidth: 640, backgroundColor: C.forest, overflow: 'hidden', paddingHorizontal: pad, paddingVertical: 48, justifyContent: 'space-between' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Contours w={900} h={1000} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', width: 420, height: 420, borderRadius: 210, backgroundColor: C.forest2, top: -150, right: -90 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LogoMark size={44} />
        <Tx s={17} w="800" color={C.white}>Khamar Manager</Tx>
      </View>
      <View style={{ gap: 32 }}>
        <Tx s={width >= 1280 ? 48 : 38} w="800" color={C.white} style={{ lineHeight: width >= 1280 ? 56 : 45, letterSpacing: -1.4, maxWidth: 460 }}>{c.heroTitle}</Tx>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <View key={s.l} style={{ flexGrow: 1, flexBasis: 120, maxWidth: 170, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Tx s={20} w="800" color={C.lime} tabular>{s.v}</Tx>
              <Tx s={12} color="rgba(255,255,255,0.6)">{s.l}</Tx>
            </View>
          ))}
        </View>
      </View>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 22, gap: 16, maxWidth: 520 }}>
        <Tx s={15} color="rgba(255,255,255,0.88)" style={{ lineHeight: 24 }}>{c.quote}</Tx>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Tx s={13} w="800" color={C.forest}>KU</Tx>
          </View>
          <View>
            <Tx s={14} w="700" color={C.white}>{c.quoteBy}</Tx>
            <Tx s={12} color="rgba(255,255,255,0.6)">{c.quoteFarm}</Tx>
          </View>
        </View>
      </View>
    </View>
  );
}

function LangToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.canvas, borderRadius: 999, padding: 3 }}>
      {(['en', 'bn'] as const).map((l) => (
        <Pressable key={l} onPress={() => setLocale(l)} style={{ height: 28, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', backgroundColor: locale === l ? C.forest : 'transparent' }}>
          <Tx s={12} w="700" color={locale === l ? C.white : C.sub}>{l === 'en' ? 'EN' : 'বাংলা'}</Tx>
        </Pressable>
      ))}
    </View>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  useWebFonts();
  const { c } = useDash();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const split = width >= 960;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.white }}>
      {split ? <HeroPanel /> : null}
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: split ? 48 : 24, paddingVertical: 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.replace('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="arrowLeft" size={15} color={C.sub} />
              <Tx s={13} w="600" color={C.sub}>{c.backHome}</Tx>
            </Pressable>
            <LangToggle />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <View style={{ width: '100%', maxWidth: 420 }}>
              {!split ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                  <LogoMark size={38} />
                  <Tx s={16} w="800">Khamar Manager</Tx>
                </View>
              ) : null}
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function OrDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      <Tx s={12} color={C.faint}>{label}</Tx>
      <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
    </View>
  );
}

function Encrypted() {
  const { c } = useDash();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 }}>
      <Icon name="shield" size={13} color={C.faint} />
      <Tx s={12} color={C.faint}>{c.encrypted}</Tx>
    </View>
  );
}

export function WebSignIn() {
  const { c } = useDash();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);

  const submit = async () => {
    setError('');
    if (!EMAIL_RE.test(email.trim()) || !password) return setError(c.enterEmailPassword);
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <Tx s={34} w="800">{c.welcomeBack}</Tx>
      <Tx s={14} color={C.sub} style={{ marginTop: 6 }}>{c.signInSub}</Tx>
      <View style={{ gap: 16, marginTop: 28 }}>
        <Field label={c.email} value={email} onChangeText={setEmail} icon="mail" keyboardType="email-address" placeholder="owner@farm.com" autoFocus onSubmitEditing={submit} />
        <Field label={c.password} value={password} onChangeText={setPassword} icon="lock" secure placeholder="••••••••" onSubmitEditing={submit} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setHint((v) => !v)}>
            <Tx s={13} w="700" color={C.padma}>{c.forgot}</Tx>
          </Pressable>
        </View>
        {hint ? <Tx s={12} color={C.sub} style={{ marginTop: -8 }}>{c.forgotHint}</Tx> : null}
        <ErrorNote message={error} />
        <Btn label={c.signIn} kind="dark" size="lg" loading={loading} onPress={submit} />
      </View>
      <OrDivider label={c.newToKhamar} />
      <Btn label={c.createFarmAccount} icon="barn" size="lg" onPress={() => router.replace('/(auth)/register')} />
      <Encrypted />
    </AuthFrame>
  );
}

function StepBar({ step }: { step: 1 | 2 }) {
  const { c } = useDash();
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: C.emerald }} />
        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: step === 2 ? C.emerald : C.line }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Tx s={12} w="700" color={C.padma}>{c.stepOf(step, step === 1 ? c.accountStep : c.farmStep)}</Tx>
        <Tx s={12} color={C.sub}>{step === 1 ? c.farmStep : `${c.accountStep} ✓`}</Tx>
      </View>
    </View>
  );
}

function TypeCard({ active, icon, title, sub, onPress }: { active: boolean; icon: IconName; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: active ? C.lime : C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={17} color={active ? C.forest : C.padma} />
        </View>
        {active ? (
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={12} color={C.forest} sw={3} />
          </View>
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#C9D6CE' }} />
        )}
      </View>
      <View>
        <Tx s={15} w="800" color={active ? C.white : C.ink}>{title}</Tx>
        <Tx s={12} color={active ? 'rgba(255,255,255,0.65)' : C.sub}>{sub}</Tx>
      </View>
    </Pressable>
  );
}

function LogicOption({ active, icon, title, sub, onPress }: { active: boolean; icon: IconName; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={({ hovered }: { hovered?: boolean }) => ({
        flex: 1,
        minWidth: 0,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: active ? C.emerald : hovered ? '#C9D6CE' : C.line,
        backgroundColor: active ? C.mint : C.white,
        paddingHorizontal: 12,
        paddingVertical: 11,
        gap: 8,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={icon} size={16} color={active ? C.padma : C.sub} />
        {active ? (
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.emerald, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={10} color={C.white} sw={3} />
          </View>
        ) : (
          <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#C9D6CE' }} />
        )}
      </View>
      <View>
        <Tx s={13} w="800" lines={1} color={active ? C.forest : C.ink}>{title}</Tx>
        <Tx s={11} color={C.sub} lines={2} style={{ lineHeight: 15 }}>{sub}</Tx>
      </View>
    </Pressable>
  );
}

export function WebRegister() {
  const { c } = useDash();
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [acc, setAcc] = useState({ name: '', email: '', phone: '', password: '' });
  const [farm, setFarm] = useState<{ name: string; type: FarmType; logic: CattleLogic | null; district: string; upazila: string }>({ name: '', type: 'poultry', logic: null, district: '', upazila: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = () => {
    setError('');
    const digits = acc.phone.replace(/\D/g, '');
    if (acc.name.trim().length < 2 || !EMAIL_RE.test(acc.email.trim()) || digits.length < 10 || acc.password.length < 6) return setError(c.fillAccount);
    setStep(2);
  };

  const submit = async () => {
    setError('');
    if (farm.name.trim().length < 2) return setError(c.fillFarm);
    if (farm.type === 'cow' && !farm.logic) return setError(c.pickCattleLogic);
    setLoading(true);
    try {
      const email = acc.email.trim().toLowerCase();
      await register({
        name: acc.name.trim(),
        email,
        phone: acc.phone.trim(),
        password: acc.password,
        organization: {
          name: farm.name.trim(),
          ownerName: acc.name.trim(),
          phone: acc.phone.trim(),
          email,
          farmType: farm.type,
          poultryPurpose: farm.type === 'poultry' ? 'mixed' : undefined,
          cowPurpose: farm.type === 'cow' ? farm.logic ?? undefined : undefined,
          district: farm.district || undefined,
          upazila: farm.upazila.trim() || undefined,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <StepBar step={step} />
      {step === 1 ? (
        <>
          <Tx s={30} w="800">{c.createAccountTitle}</Tx>
          <Tx s={14} color={C.sub} style={{ marginTop: 6 }}>{c.createAccountSub}</Tx>
          <View style={{ gap: 14, marginTop: 24 }}>
            <Field label={c.yourName} value={acc.name} onChangeText={(v) => setAcc((p) => ({ ...p, name: v }))} icon="user" placeholder="Karim Uddin" autoFocus />
            <Field label={c.email} value={acc.email} onChangeText={(v) => setAcc((p) => ({ ...p, email: v }))} icon="mail" keyboardType="email-address" placeholder="owner@farm.com" />
            <Field label={c.phone} value={acc.phone} onChangeText={(v) => setAcc((p) => ({ ...p, phone: v }))} icon="phone" keyboardType="phone-pad" placeholder="01711-000000" />
            <Field label={c.password} value={acc.password} onChangeText={(v) => setAcc((p) => ({ ...p, password: v }))} icon="lock" secure placeholder="••••••••" onSubmitEditing={next} />
            <ErrorNote message={error} />
            <Btn label={c.continue} iconRight="right" kind="dark" size="lg" onPress={next} />
          </View>
        </>
      ) : (
        <>
          <Tx s={30} w="800">{c.farmTitle}</Tx>
          <Tx s={14} color={C.sub} style={{ marginTop: 6 }}>{c.farmSub}</Tx>
          <View style={{ gap: 14, marginTop: 24 }}>
            <Field label={c.farmName} value={farm.name} onChangeText={(v) => setFarm((p) => ({ ...p, name: v }))} icon="barn" placeholder="Green Valley Poultry" autoFocus />
            <View>
              <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.farmType}</Tx>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TypeCard active={farm.type === 'poultry'} icon="bird" title={c.poultry} sub={c.poultrySub} onPress={() => setFarm((p) => ({ ...p, type: 'poultry' }))} />
                <TypeCard active={farm.type === 'cow'} icon="milk" title={c.cattle} sub={c.cattleSub} onPress={() => setFarm((p) => ({ ...p, type: 'cow' }))} />
              </View>
            </View>
            {farm.type === 'cow' ? (
              <View accessibilityRole="radiogroup">
                <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.cattleLogic}</Tx>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(
                    [
                      ['dairy', 'milk', c.logicDairy, c.logicDairySub],
                      ['beef', 'scale', c.logicBeef, c.logicBeefSub],
                      ['mixed', 'layers', c.logicMixed, c.logicMixedSub],
                    ] as const
                  ).map(([key, icon, title, sub]) => (
                    <LogicOption key={key} active={farm.logic === key} icon={icon} title={title} sub={sub} onPress={() => { setError(''); setFarm((p) => ({ ...p, logic: key })); }} />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Select label={c.district} icon="pin" value={farm.district} onChange={(v) => setFarm((p) => ({ ...p, district: v }))} options={DISTRICTS.map((d) => ({ value: d, label: d }))} placeholder={c.selectDistrict} style={{ flex: 1 }} />
              <Field label={c.upazila} value={farm.upazila} onChangeText={(v) => setFarm((p) => ({ ...p, upazila: v }))} placeholder="Sreepur" style={{ flex: 1 }} onSubmitEditing={submit} />
            </View>
            <ErrorNote message={error} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Btn label={c.back} size="lg" onPress={() => { setError(''); setStep(1); }} style={{ flex: 0.55 }} />
              <Btn label={c.createFarm} icon="check" kind="lime" size="lg" loading={loading} onPress={submit} style={{ flex: 1 }} />
            </View>
          </View>
        </>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 }}>
        <Tx s={13} color={C.sub}>{c.haveAccount}</Tx>
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Tx s={13} w="700" color={C.padma}>{c.signIn}</Tx>
        </Pressable>
      </View>
    </AuthFrame>
  );
}
