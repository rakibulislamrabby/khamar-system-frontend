import { WebRegister } from '@/components/dashboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DISTRICTS } from '@/components/dashboard/copy';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { FieldLabel, MButton, MField, MScreen, MSelect, NavHeader, Notice, Tx } from '@/components/mobile/kit';
import { isMobileApp } from '@/lib/app-target';
import type { CattleLogic } from '@/lib/cattle';
import { useAuth } from '@/providers/auth-provider';
import type { FarmType } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts 1711-234567, 01711234567 or +8801711234567; returns 01711234567, or '' when it is not 10 local digits. */
function bdPhone(input: string) {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('880')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `0${d}` : '';
}

function passwordScore(p: string): 0 | 1 | 2 | 3 {
  if (p.length < 6) return p ? 1 : 0;
  if (p.length >= 8 && /\d/.test(p)) return 3;
  return 2;
}

function StepBar({ step, right }: { step: 1 | 2; right: string }) {
  const { c } = useM();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: C.emerald }} />
        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: step === 2 ? C.emerald : C.line }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Tx s={12} w="700" color={C.padma}>{c.stepOfN(step)}</Tx>
        <Tx s={12} color={C.sub}>{right}</Tx>
      </View>
    </View>
  );
}

function StrengthBar({ password }: { password: string }) {
  const { c } = useM();
  const score = passwordScore(password);
  const color = score === 3 ? C.emerald : score === 2 ? C.gold : C.coral;
  const label = score === 3 ? c.strongPassword : score === 2 ? c.okPassword : c.weakPassword;
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < score ? color : C.line }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Tx s={12} w="700" color={password ? color : C.faint}>{password ? label : ' '}</Tx>
        <Tx s={12} color={C.sub}>{c.passwordRule}</Tx>
      </View>
    </View>
  );
}

function TypeCard({ active, icon, title, sub, onPress }: { active: boolean; icon: IconName; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={{ flex: 1, minWidth: 0, borderRadius: 20, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, padding: 14, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: active ? C.lime : C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={active ? C.forest : C.padma} />
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
        <Tx s={15} w="800" lines={1} color={active ? C.white : C.ink}>{title}</Tx>
        <Tx s={12} lines={1} color={active ? 'rgba(255,255,255,0.65)' : C.sub}>{sub}</Tx>
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
      style={{ flex: 1, minWidth: 0, borderRadius: 16, borderWidth: 1.5, borderColor: active ? C.emerald : C.line, backgroundColor: active ? C.mint : C.white, paddingHorizontal: 11, paddingVertical: 11, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon name={icon} size={17} color={active ? C.padma : C.sub} />
        <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: active ? 0 : 1.5, borderColor: '#C9D6CE', backgroundColor: active ? C.emerald : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {active ? <Icon name="check" size={10} color={C.white} sw={3} /> : null}
        </View>
      </View>
      <View>
        <Tx s={13} w="800" lines={1} color={active ? C.forest : C.ink}>{title}</Tx>
        <Tx s={11} lines={2} color={C.sub} style={{ lineHeight: 15 }}>{sub}</Tx>
      </View>
    </Pressable>
  );
}

function RegisterScreen() {
  const { c } = useM();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [acc, setAcc] = useState({ name: '', email: '', phone: '', password: '' });
  const [farm, setFarm] = useState<{ name: string; type: FarmType; logic: CattleLogic | null; district: string; upazila: string; phone: string }>({
    name: '',
    type: 'poultry',
    logic: null,
    district: '',
    upazila: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = () => {
    setError('');
    if (acc.name.trim().length < 2 || !EMAIL_RE.test(acc.email.trim()) || acc.password.length < 6) return setError(c.fillAccount);
    if (acc.phone.trim() && !bdPhone(acc.phone)) return setError(c.fillAccount);
    setStep(2);
  };

  const submit = async () => {
    setError('');
    if (farm.name.trim().length < 2) return setError(c.fillFarm);
    if (farm.type === 'cow' && !farm.logic) return setError(c.pickCattleLogic);
    const orgPhone = bdPhone(farm.phone) || bdPhone(acc.phone);
    if (!orgPhone) return setError(c.needPhone);
    setLoading(true);
    try {
      const email = acc.email.trim().toLowerCase();
      await register({
        name: acc.name.trim(),
        email,
        phone: bdPhone(acc.phone) || undefined,
        password: acc.password,
        organization: {
          name: farm.name.trim(),
          ownerName: acc.name.trim(),
          phone: orgPhone,
          email,
          farmType: farm.type,
          poultryPurpose: farm.type === 'poultry' ? 'mixed' : undefined,
          cowPurpose: farm.type === 'cow' ? farm.logic ?? undefined : undefined,
          district: farm.district || undefined,
          upazila: farm.upazila.trim() || undefined,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const header = (
    <>
      <NavHeader
        title={c.createAccount}
        onBack={() => (step === 2 ? (setError(''), setStep(1)) : router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        right={
          step === 1 ? (
            <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
              <Tx s={14} w="700" color={C.padma}>{c.signIn}</Tx>
            </Pressable>
          ) : null
        }
      />
      <StepBar step={step} right={step === 1 ? c.nextFarm : c.almostDone} />
    </>
  );

  const footer =
    step === 1 ? (
      <View style={{ gap: 12 }}>
        <Notice message={error} />
        <MButton label={c.continue} icon="right" kind="dark" onPress={next} />
        <Tx s={12} color={C.sub} style={{ textAlign: 'center' }}>{c.terms}</Tx>
      </View>
    ) : (
      <View style={{ gap: 12 }}>
        <Notice message={error} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MButton label={c.back} kind="outline" onPress={() => { setError(''); setStep(1); }} style={{ flex: 0.6 }} />
          <MButton label={c.createFarm} icon="check" kind="lime" onPress={submit} loading={loading} style={{ flex: 1 }} />
        </View>
      </View>
    );

  return (
    <MScreen header={header} footer={footer} plainFooter gap={16}>
      {step === 1 ? (
        <>
          <View style={{ marginTop: 8 }}>
            <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{c.whoRuns}</Tx>
            <Tx s={14} color={C.sub} style={{ marginTop: 6, lineHeight: 20 }}>{c.whoRunsSub}</Tx>
          </View>
          <MField label={c.yourName} icon="user" value={acc.name} onChangeText={(v) => setAcc((p) => ({ ...p, name: v }))} autoCapitalize="words" placeholder="Karim Uddin" />
          <MField label={c.email} icon="mail" value={acc.email} onChangeText={(v) => setAcc((p) => ({ ...p, email: v }))} keyboardType="email-address" placeholder="karim@padmapoultry.com" />
          <MField
            label={c.phone}
            optional={c.optional}
            value={acc.phone}
            onChangeText={(v) => setAcc((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
            placeholder="1711-234567"
            prefix={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 14, marginRight: 2, borderRightWidth: 1, borderRightColor: C.line, alignSelf: 'stretch' }}>
                <Tx s={15} w="700">+880</Tx>
              </View>
            }
          />
          <View>
            <MField label={c.password} icon="lock" value={acc.password} onChangeText={(v) => setAcc((p) => ({ ...p, password: v }))} secure placeholder="••••••••" />
            <StrengthBar password={acc.password} />
          </View>
        </>
      ) : (
        <>
          <View style={{ marginTop: 8 }}>
            <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{c.farmTitle}</Tx>
            <Tx s={14} color={C.sub} style={{ marginTop: 6, lineHeight: 20 }}>{c.farmSub}</Tx>
          </View>
          <MField label={c.farmName} icon="barn" value={farm.name} onChangeText={(v) => setFarm((p) => ({ ...p, name: v }))} autoCapitalize="words" placeholder="Green Valley Poultry" />
          <View>
            <FieldLabel label={c.farmType} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TypeCard active={farm.type === 'poultry'} icon="bird" title={c.poultry} sub={c.poultrySub} onPress={() => setFarm((p) => ({ ...p, type: 'poultry' }))} />
              <TypeCard active={farm.type === 'cow'} icon="milk" title={c.cattle} sub={c.cattleSub} onPress={() => setFarm((p) => ({ ...p, type: 'cow' }))} />
            </View>
          </View>
          {farm.type === 'cow' ? (
            <View accessibilityRole="radiogroup">
              <FieldLabel label={c.cattleLogic} />
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
            <MSelect
              label={c.district}
              icon="pin"
              value={farm.district}
              options={DISTRICTS.map((d) => ({ value: d, label: d }))}
              onChange={(v) => setFarm((p) => ({ ...p, district: v }))}
              placeholder={c.selectDistrict}
              title={c.district}
              style={{ flex: 1 }}
            />
            <MField label={c.upazila} value={farm.upazila} onChangeText={(v) => setFarm((p) => ({ ...p, upazila: v }))} placeholder="Sreepur" style={{ flex: 1 }} />
          </View>
          <MField
            label={c.farmPhone}
            optional={acc.phone.trim() ? c.optional : undefined}
            icon="phone"
            value={farm.phone}
            onChangeText={(v) => setFarm((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
            placeholder="01XXXXXXXXX"
          />
        </>
      )}
    </MScreen>
  );
}

export default function Route() {
  return isMobileApp ? <RegisterScreen /> : <WebRegister />;
}
