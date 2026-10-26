import { Link, Redirect, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View, type TextStyle, type ViewStyle } from 'react-native';

import { landingCopy, type LandingCopy } from '@/components/web-landing/copy';
import {
  Area,
  Avatar,
  Chip,
  Contours,
  Donut,
  Glow,
  Icon,
  LogoMark,
  PairBars,
  Qr,
  Ring,
  Stars,
  Track,
  Wave,
} from '@/components/web-landing/graphics';
import { BrowserDash, MiniRing, PhoneHisab, PhoneHome, PhoneSell } from '@/components/web-landing/phones';
import { C, weeks } from '@/components/web-landing/theme';
import { downloadApk } from '@/lib/download-apk';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

const LOGIN = '/(auth)/login' as Href;
const REGISTER = '/(auth)/register' as Href;
const ANCHORS = ['features', 'screens', 'hisab', 'stories', 'faq'] as const;

/**
 * Public marketing page for the website only.
 * Expo loads this file on web and keeps `landing-page.tsx` for the Android app.
 */
export function LandingPage() {
  const { status } = useAuth();
  const { locale, setLocale } = useLocale();
  const { width } = useWindowDimensions();
  const wide = width >= 1180;
  const pad = wide ? 72 : 20;
  const c = landingCopy[locale];
  const font = locale === 'bn' ? 'Noto Sans Bengali, Inter, sans-serif' : 'Inter, sans-serif';
  const scrollRef = useRef<ScrollView>(null);
  const y = useRef<Record<string, number>>({});
  const [faqOpen, setFaqOpen] = useState(0);
  const [phoneTab, setPhoneTab] = useState(1);
  const [period, setPeriod] = useState(1);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'khamar-landing-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+Bengali:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  const scrollTo = (id: string) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, (y.current[id] ?? 0) - 12), animated: true });
  };

  const frame = (extra?: ViewStyle): ViewStyle => ({
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    paddingHorizontal: pad,
    ...extra,
  });

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: C.canvas }} contentContainerStyle={{ backgroundColor: C.canvas }}>
      <Hero c={c} font={font} wide={wide} frame={frame} width={width} onNav={scrollTo} onLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} locale={locale} />
      <Trust c={c} font={font} wide={wide} frame={frame} />
      <View onLayout={(e) => { y.current.features = e.nativeEvent.layout.y; }}>
        <Features c={c} font={font} wide={wide} frame={frame} locale={locale} onLocale={setLocale} />
      </View>
      <View onLayout={(e) => { y.current.screens = e.nativeEvent.layout.y; }}>
        <Showcase c={c} font={font} wide={wide} width={width} tab={phoneTab} setTab={setPhoneTab} />
      </View>
      <Steps c={c} font={font} wide={wide} frame={frame} />
      <View onLayout={(e) => { y.current.hisab = e.nativeEvent.layout.y; }}>
        <Hisab c={c} font={font} wide={wide} frame={frame} period={period} setPeriod={setPeriod} />
      </View>
      <View onLayout={(e) => { y.current.stories = e.nativeEvent.layout.y; }}>
        <Stories c={c} font={font} wide={wide} frame={frame} />
      </View>
      <Reliability c={c} font={font} wide={wide} frame={frame} />
      <View onLayout={(e) => { y.current.faq = e.nativeEvent.layout.y; }}>
        <Faq c={c} font={font} wide={wide} frame={frame} open={faqOpen} setOpen={setFaqOpen} />
      </View>
      <Cta c={c} font={font} wide={wide} frame={frame} />
      <Footer c={c} font={font} wide={wide} frame={frame} width={width} locale={locale} onLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} onNav={scrollTo} />
    </ScrollView>
  );
}

function Tx({ children, font, style }: { children: ReactNode; font: string; style?: TextStyle }) {
  return <Text style={[{ fontFamily: font, color: C.ink }, style]}>{children}</Text>;
}

function Btn({
  label,
  font,
  href,
  onPress,
  kind = 'lime',
  icon,
  block = false,
}: {
  label: string;
  font: string;
  href?: Href;
  onPress?: () => void;
  kind?: 'lime' | 'dark' | 'ghost' | 'outline';
  icon?: string;
  block?: boolean;
}) {
  const fg = kind === 'lime' || kind === 'outline' ? C.forest : C.white;
  const body = (
    <View
      style={{
        height: 54,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: kind === 'lime' ? C.lime : kind === 'dark' ? C.forest : kind === 'outline' ? C.white : 'transparent',
        borderWidth: kind === 'ghost' || kind === 'outline' ? 1.5 : 0,
        borderColor: kind === 'outline' ? C.line : 'rgba(255,255,255,0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
      {icon ? <Icon name={icon} size={18} color={fg} sw={2.4} /> : null}
      <Tx font={font} style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{label}</Tx>
      {kind === 'ghost' && !icon ? <Icon name="right" size={16} color={fg} /> : null}
    </View>
  );
  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1, width: block ? '100%' : undefined })}>{body}</Pressable>
      </Link>
    );
  }
  return <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1, width: block ? '100%' : undefined })}>{body}</Pressable>;
}

function Eyebrow({ children, font, dark = false, center = false }: { children: string; font: string; dark?: boolean; center?: boolean }) {
  return (
    <View style={{ alignSelf: center ? 'center' : 'flex-start', backgroundColor: dark ? 'rgba(197,239,99,0.14)' : C.mint, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Tx font={font} style={{ color: dark ? C.lime : C.padma, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{children}</Tx>
    </View>
  );
}

function Hero({
  c, font, wide, frame, width, onNav, onLocale, locale,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  frame: (extra?: ViewStyle) => ViewStyle;
  width: number;
  onNav: (id: string) => void;
  onLocale: () => void;
  locale: 'en' | 'bn';
}) {
  const titleSize = locale === 'bn' ? (wide ? 46 : 36) : wide ? 62 : 40;
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (id: string) => {
    setMenuOpen(false);
    onNav(id);
  };
  return (
    <View style={{ backgroundColor: C.forest, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: wide ? width * 0.35 : -80, top: -80 }}>
        <Glow w={wide ? 900 : 420} h={wide ? 760 : 360} color={C.lime} op={0.18} />
      </View>
      {wide ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 140 }}>
          <Contours w={Math.min(width, 1440)} h={640} />
        </View>
      ) : null}
      <View style={frame({ paddingTop: 16, paddingBottom: 8, gap: 10 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 }}>
            <LogoMark size={wide ? 40 : 36} />
            <Tx font={font} style={{ color: C.white, fontSize: wide ? 18 : 15, fontWeight: '800' }} numberOfLines={1}>Khamar Manager</Tx>
          </View>
          {wide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              {c.nav.map((label, i) => (
                <Pressable key={label} onPress={() => go(ANCHORS[i])} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
                  <Tx font={font} style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '600', fontSize: 14 }}>{label}</Tx>
                </Pressable>
              ))}
            </View>
          ) : null}
          {wide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={onLocale} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.forest2, borderRadius: 999, paddingHorizontal: 12, height: 40 }}>
                <Icon name="globe" size={14} color={C.lime} />
                <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{locale === 'bn' ? 'English' : 'বাংলা'}</Tx>
              </Pressable>
              <Link href={LOGIN} asChild>
                <Pressable style={{ paddingHorizontal: 8, height: 40, justifyContent: 'center' }}>
                  <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>{c.signIn}</Tx>
                </Pressable>
              </Link>
              <Btn label={c.create} font={font} href={REGISTER} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={onLocale} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.forest2, borderRadius: 999, paddingHorizontal: 10, height: 40 }}>
                <Icon name="globe" size={14} color={C.lime} />
                <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 12 }}>{locale === 'bn' ? 'English' : 'বাংলা'}</Tx>
              </Pressable>
              <Pressable
                onPress={() => setMenuOpen((open) => !open)}
                accessibilityRole="button"
                style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={menuOpen ? 'x' : 'menu'} size={20} color={C.white} />
              </Pressable>
            </View>
          )}
        </View>
        {!wide && menuOpen ? (
          <View style={{ backgroundColor: C.forest2, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {c.nav.map((label, i) => (
              <Pressable key={label} onPress={() => go(ANCHORS[i])} style={{ height: 46, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
                <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 16 }}>{label}</Tx>
              </Pressable>
            ))}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6, marginHorizontal: 8 }} />
            <Link href={LOGIN} asChild>
              <Pressable style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 15 }}>{c.signIn}</Tx>
              </Pressable>
            </Link>
            <Btn label={c.create} font={font} href={REGISTER} block />
          </View>
        ) : null}
      </View>

      <View style={frame({ paddingTop: wide ? 36 : 28, paddingBottom: 28, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 24 })}>
        <View style={{ width: wide ? 500 : '100%', flexShrink: 0, paddingTop: wide ? 20 : 0 }}>
          <View style={{ alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, backgroundColor: 'rgba(197,239,99,0.12)', borderRadius: 18, paddingLeft: 6, paddingRight: 12, paddingVertical: 6 }}>
            <View style={{ backgroundColor: C.forest, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Tx font={font} style={{ color: C.lime, fontSize: 11, fontWeight: '800' }}>{c.newBadge}</Tx>
            </View>
            <Tx font={font} style={{ color: C.lime, fontSize: 12, fontWeight: '700' }}>{c.badgeRest}</Tx>
          </View>
          <Tx font={font} style={{ marginTop: 18, fontSize: titleSize, lineHeight: titleSize + 6, fontWeight: '800', letterSpacing: locale === 'bn' ? -1 : -2.2, color: C.white }}>{c.titleA}</Tx>
          <Tx font={font} style={{ fontSize: titleSize, lineHeight: titleSize + 6, fontWeight: '800', letterSpacing: locale === 'bn' ? -1 : -2.2, color: C.lime }}>{c.titleB}</Tx>
          <Tx font={font} style={{ marginTop: 18, fontSize: 17, lineHeight: 28, color: 'rgba(255,255,255,0.72)', fontWeight: '500', maxWidth: 500 }}>{c.heroBody}</Tx>
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 10, marginTop: 28 }}>
            <Btn label={c.createFree} font={font} href={REGISTER} icon="right" block={!wide} />
            <Btn label={c.downloadApk} font={font} onPress={downloadApk} kind="ghost" icon="android" block={!wide} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <View style={{ flexDirection: 'row' }}>
              {[
                ['KU', C.lime, C.forest],
                ['NS', '#F9D99A', '#7A5200'],
                ['RH', '#BFD7FF', '#1F4FA8'],
                ['MA', '#FFC7BE', '#9A2E20'],
              ].map(([initials, bg, fg], i) => (
                <View key={initials} style={{ marginLeft: i ? -8 : 0, borderWidth: 3, borderColor: C.forest, borderRadius: 22 }}>
                  <Avatar initials={initials} bg={bg} fg={fg} size={36} />
                </View>
              ))}
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Stars size={14} />
                <Tx font={font} style={{ color: C.white, fontWeight: '800' }}>4.8</Tx>
              </View>
              <Tx font={font} style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, marginTop: 2 }}>{c.trusted}</Tx>
            </View>
          </View>
        </View>
        {wide ? <ScaledArt c={c} font={font} width={width} pad={wide ? 72 : 20} /> : (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <PhoneHome c={c} font={font} width={230} height={470} />
          </View>
        )}
      </View>
      <Wave fill={C.canvas} />
    </View>
  );
}

function ScaledArt({ c, font, width, pad }: { c: LandingCopy; font: string; width: number; pad: number }) {
  const scale = Math.min(1, Math.max(0.62, (width - pad * 2 - 520) / 710));
  return (
    <View style={{ width: 710 * scale, height: 620 * scale, flexShrink: 0 }}>
      <View style={{ position: 'absolute', top: 0, left: 24, width: 690, height: 600, transform: [{ scale }], transformOrigin: 'top left' }}>
        <HeroArt c={c} font={font} />
      </View>
    </View>
  );
}

function HeroArt({ c, font }: { c: LandingCopy; font: string }) {
  return (
    <View style={{ width: 690, height: 600, flexShrink: 0 }}>
      <View style={{ position: 'absolute', left: 8, top: 36 }}>
        <BrowserDash c={c} font={font} />
      </View>
      <View style={{ position: 'absolute', left: 470, top: 130 }}>
        <PhoneHome c={c} font={font} width={210} height={450} />
      </View>
      <View style={float('left', -20, 300, 250)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Chip name="cash" bg={C.mint} fg={C.padma} size={36} />
          <View style={{ flex: 1 }}>
            <Tx font={font} style={{ fontWeight: '700', fontSize: 13 }}>{c.saleSaved}</Tx>
            <Tx font={font} style={{ fontSize: 11, color: C.sub }}>Rahim Traders · 165 kg</Tx>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line }}>
          <Tx font={font} style={{ fontSize: 11, color: C.faint }}>SL-6383</Tx>
          <Tx font={font} style={{ fontWeight: '800', color: C.padma, fontSize: 16 }}>+৳29,700</Tx>
        </View>
      </View>
      <View style={[float('left', 320, 0, undefined), { backgroundColor: C.lime }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Chip name="egg" bg={C.forest} fg={C.lime} size={30} />
          <View>
            <Tx font={font} style={{ fontSize: 11, color: C.forest2, fontWeight: '600' }}>{c.eggsToday}</Tx>
            <Tx font={font} style={{ fontSize: 15, fontWeight: '800', color: C.forest }}>1,742 ↑ 6%</Tx>
          </View>
        </View>
      </View>
      <View style={float('left', 140, 470, 260)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Chip name="alert" bg={C.coralSoft} fg={C.coral} size={32} />
          <View style={{ flex: 1 }}>
            <Tx font={font} style={{ fontWeight: '700', fontSize: 13 }}>{c.lowStock}</Tx>
            <Tx font={font} style={{ fontSize: 11, color: C.sub }}>{c.starterFeed}</Tx>
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <Track pct={30} color={C.coral} track={C.coralSoft} h={6} />
        </View>
      </View>
    </View>
  );
}

function float(side: 'left', x: number, top: number, w?: number): ViewStyle {
  return {
    position: 'absolute',
    left: x,
    top,
    width: w,
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    boxShadow: '0 18px 40px rgba(2,16,10,0.28)',
  };
}

function Trust({ c, font, wide, frame }: { c: LandingCopy; font: string; wide: boolean; frame: (e?: ViewStyle) => ViewStyle }) {
  const icons = ['barn', 'pin', 'cash', 'bird'] as const;
  const tones = [
    [C.limeSoft, C.padma],
    [C.skySoft, C.sky],
    [C.goldSoft, '#B07A00'],
    [C.violetSoft, C.violet],
  ] as const;
  return (
    <View style={frame({ marginTop: wide ? -36 : -8 })}>
      <View style={{ backgroundColor: C.white, borderRadius: 28, borderWidth: 1, borderColor: C.line, paddingVertical: 22, paddingHorizontal: wide ? 28 : 16, flexDirection: wide ? 'row' : 'column', gap: wide ? 0 : 16, boxShadow: '0 24px 50px rgba(12,42,32,0.08)' }}>
        {c.stats.map((stat, i) => (
          <View key={stat.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: wide && i ? 22 : 0, borderLeftWidth: wide && i ? 1 : 0, borderLeftColor: C.line }}>
            <Chip name={icons[i]} bg={tones[i][0]} fg={tones[i][1]} size={48} />
            <View style={{ flex: 1 }}>
              <Tx font={font} style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.6 }}>{stat.value}</Tx>
              <Tx font={font} style={{ fontSize: 13, color: C.sub }}>{stat.label}</Tx>
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 26 }}>
        <Tx font={font} style={{ color: C.faint, fontWeight: '600', fontSize: 13, marginRight: 4 }}>{c.farmsFrom}</Tx>
        {c.districts.map((d) => (
          <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Icon name="pin" size={13} color={C.emerald} />
            <Tx font={font} style={{ color: C.sub, fontSize: 13, fontWeight: '600' }}>{d}</Tx>
          </View>
        ))}
      </View>
    </View>
  );
}

function Features({
  c, font, wide, frame, locale, onLocale,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  frame: (e?: ViewStyle) => ViewStyle;
  locale: 'en' | 'bn';
  onLocale: (locale: 'en' | 'bn') => void;
}) {
  const batches = [
    ['B-12 · Broiler', 'Shed 1 · Day 24 of 35', 97, '1,164 / 1,200', '3.0%', '1.52', C.lime],
    ['S-07 · Sonali', 'Shed 2 · Day 41 of 70', 99, '1,486 / 1,500', '0.9%', '2.10', C.emerald],
    ['L-03 · Layer', 'Shed 3 · Week 32', 98, '1,253 / 1,280', '2.1%', '89%', C.gold],
  ] as const;
  return (
    <View style={frame({ paddingTop: wide ? 96 : 64 })}>
      <View style={{ alignItems: 'center' }}>
        <Eyebrow font={font} center>{c.featEyebrow}</Eyebrow>
        <Tx font={font} style={{ marginTop: 14, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40, fontWeight: '800', letterSpacing: -1.2, textAlign: 'center', maxWidth: 760 }}>{c.featTitle}</Tx>
        <Tx font={font} style={{ marginTop: 12, fontSize: 17, lineHeight: 28, color: C.sub, textAlign: 'center', maxWidth: 680 }}>{c.featLead}</Tx>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, marginTop: 40, alignItems: 'stretch' }}>
        <View style={{ flex: wide ? 1.35 : undefined, backgroundColor: C.forest, borderRadius: 28, padding: 26, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -80, top: -100 }}>
            <Glow w={360} h={280} color={C.lime} op={0.16} />
          </View>
          <Chip name="bird" bg={C.lime} fg={C.forest} size={48} />
          <Tx font={font} style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 14 }}>{c.poultryTitle}</Tx>
          <Tx font={font} style={{ color: 'rgba(255,255,255,0.68)', marginTop: 6, lineHeight: 22 }}>{c.poultryBody}</Tx>
          <View style={{ marginTop: 18, gap: 8 }}>
            {batches.map(([name, sub, pct, alive, mort, fcr, color]) => (
              <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <MiniRing pct={pct} color={color} label={`${pct}%`} />
                <View style={{ flex: 1 }}>
                  <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{name}</Tx>
                  <Tx font={font} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{sub}</Tx>
                </View>
                {wide ? (
                  <>
                    <Stat font={font} k={c.alive} v={alive} />
                    <Stat font={font} k={c.mortality} v={mort} lime />
                    <Stat font={font} k="FCR" v={fcr} />
                  </>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        <View style={card()}>
          <Chip name="milk" bg={C.skySoft} fg={C.sky} size={48} />
          <Tx font={font} style={{ fontSize: 22, fontWeight: '800', marginTop: 14 }}>{c.dairyTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 22 }}>{c.dairyBody}</Tx>
          <View style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: C.canvas }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Tx font={font} style={{ color: C.sub, fontSize: 12 }}>{c.milkToday}</Tx>
                <Tx font={font} style={{ fontSize: 28, fontWeight: '800' }}>126 L</Tx>
              </View>
              <View style={{ backgroundColor: C.skySoft, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Tx font={font} style={{ color: '#2155B8', fontWeight: '700', fontSize: 12 }}>+8 L</Tx>
              </View>
            </View>
            <Area w={wide ? 340 : 280} h={64} pts={[98, 104, 101, 110, 108, 118, 115, 126]} stroke={C.sky} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {[
                [c.morning, '72 L', 57],
                [c.evening, '54 L', 43],
              ].map(([label, value, pct]) => (
                <View key={String(label)} style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Tx font={font} style={{ fontSize: 12, color: C.sub }}>{label}</Tx>
                    <Tx font={font} style={{ fontSize: 13, fontWeight: '800' }}>{value}</Tx>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <Track pct={Number(pct)} color={C.sky} track={C.skySoft} h={5} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, marginTop: 18 }}>
        <View style={[card(), { flex: 1 }]}>
          <Chip name="box" bg={C.goldSoft} fg="#B07A00" size={46} />
          <Tx font={font} style={{ fontSize: 20, fontWeight: '800', marginTop: 12 }}>{c.stockTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 21 }}>{c.stockBody}</Tx>
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.coralSoft, borderRadius: 12, padding: 10 }}>
            <Icon name="alert" size={16} color={C.coral} />
            <Tx font={font} style={{ color: '#B8382A', fontWeight: '700', fontSize: 13 }}>{c.belowMin}</Tx>
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            {[
              ['Broiler starter feed', '3 / 10', 30, C.coral, C.coralSoft],
              ['Vitamin AD3E', '7 L', 58, C.gold, C.goldSoft],
              ['Broiler grower feed', '46', 82, C.emerald, C.mint],
            ].map(([name, qty, pct, color, track]) => (
              <View key={String(name)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Tx font={font} style={{ fontWeight: '600', fontSize: 13 }}>{name}</Tx>
                  <Tx font={font} style={{ color: C.sub, fontSize: 12 }}>{qty}</Tx>
                </View>
                <View style={{ marginTop: 5 }}>
                  <Track pct={Number(pct)} color={String(color)} track={String(track)} />
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={[card(), { flex: 1 }]}>
          <Chip name="cash" bg={C.mint} fg={C.padma} size={46} />
          <Tx font={font} style={{ fontSize: 20, fontWeight: '800', marginTop: 12 }}>{c.salesTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 21 }}>{c.salesBody}</Tx>
          <View style={{ marginTop: 14, gap: 8 }}>
            {[
              ['RT', 'Rahim Traders', '৳12,400', C.mint, C.padma],
              ['SE', 'Sumi Egg House', '৳8,250', C.goldSoft, '#9A6A00'],
              ['HD', 'Hasan Dairy', '৳17,600', C.skySoft, '#2155B8'],
            ].map(([i, name, due, bg, fg]) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.canvas, borderRadius: 12, padding: 8 }}>
                <Avatar initials={i} bg={bg} fg={fg} size={30} />
                <Tx font={font} style={{ flex: 1, fontWeight: '700', fontSize: 13 }}>{name}</Tx>
                <Tx font={font} style={{ color: '#B8382A', fontWeight: '800', fontSize: 13 }}>{due}</Tx>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 10, backgroundColor: C.forest, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Tx font={font} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{c.totalReceivable}</Tx>
            <Tx font={font} style={{ color: C.lime, fontWeight: '800', fontSize: 16 }}>৳38,250</Tx>
          </View>
        </View>
        <View style={[card(), { flex: 1 }]}>
          <Chip name="file" bg={C.violetSoft} fg={C.violet} size={46} />
          <Tx font={font} style={{ fontSize: 20, fontWeight: '800', marginTop: 12 }}>{c.invoiceTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 21 }}>{c.invoiceBody}</Tx>
          <View style={{ marginTop: 16, height: 168 }}>
            <View style={{ position: 'absolute', left: 22, right: 0, top: 0, bottom: 8, borderRadius: 14, backgroundColor: C.violetSoft }} />
            <View style={{ position: 'absolute', left: 0, right: 18, top: 14, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 14, boxShadow: '0 16px 30px rgba(12,42,32,0.08)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <LogoMark size={20} />
                  <Tx font={font} style={{ fontWeight: '800', fontSize: 12 }}>Padma Poultry</Tx>
                </View>
                <Tx font={font} style={{ fontSize: 11, color: C.faint }}>SL-6383</Tx>
              </View>
              <View style={{ gap: 6, marginTop: 12 }}>
                {[90, 70, 80].map((p) => (
                  <View key={p} style={{ height: 6, width: `${p}%`, borderRadius: 3, backgroundColor: '#E8EEEA' }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: C.line }}>
                <Tx font={font} style={{ color: C.sub, fontSize: 12 }}>{c.total}</Tx>
                <Tx font={font} style={{ fontWeight: '800', fontSize: 16 }}>৳29,700</Tx>
              </View>
              <View style={{ position: 'absolute', right: 12, top: 48, borderWidth: 2, borderColor: C.emerald, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Tx font={font} style={{ color: C.emerald, fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>{c.paid}</Tx>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, marginTop: 18 }}>
        <View style={{ flex: wide ? 1.1 : undefined, backgroundColor: C.limeSoft, borderRadius: 28, padding: 26, borderWidth: 1, borderColor: '#DDF1AE' }}>
          <Chip name="shield" bg={C.forest} fg={C.lime} size={48} />
          <Tx font={font} style={{ fontSize: 22, fontWeight: '800', marginTop: 14 }}>{c.rolesTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 22 }}>{c.rolesBody}</Tx>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {c.roles.map((role, i) => (
              <View key={role} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: i === 0 ? C.forest : C.white, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Icon name="user" size={12} color={i === 0 ? C.lime : C.padma} />
                <Tx font={font} style={{ fontSize: 12, fontWeight: '700', color: i === 0 ? C.lime : C.padma }}>{role}</Tx>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 14, backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 12 }}>
            {c.audit.map((row, i) => (
              <View key={row.initials} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                <Avatar initials={row.initials} bg={row.bg} fg={row.fg} size={28} />
                <Tx font={font} style={{ flex: 1, fontSize: 13, color: C.sub }}>
                  <Text style={{ fontWeight: '700', color: C.ink }}>{row.name}</Text> {row.detail}
                </Tx>
                <Tx font={font} style={{ fontSize: 11, color: C.faint }}>{row.time}</Tx>
              </View>
            ))}
          </View>
        </View>
        <View style={[card(), { flex: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Chip name="globe" bg={C.mint} fg={C.padma} size={48} />
            <View style={{ flexDirection: 'row', backgroundColor: '#E6EDE9', borderRadius: 14, padding: 4, flex: 1, maxWidth: 220 }}>
              {(['en', 'bn'] as const).map((code) => (
                <Pressable key={code} onPress={() => onLocale(code)} style={{ flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: locale === code ? C.white : 'transparent' }}>
                  <Tx font={font} style={{ fontWeight: '700', fontSize: 13 }}>{code === 'en' ? 'English' : 'বাংলা'}</Tx>
                </Pressable>
              ))}
            </View>
          </View>
          <Tx font={font} style={{ fontSize: 22, fontWeight: '800', marginTop: 14 }}>{c.langTitle}</Tx>
          <Tx font={font} style={{ color: C.sub, marginTop: 6, lineHeight: 22 }}>{c.langBody}</Tx>
          <View style={{ marginTop: 16, gap: 8 }}>
            {[
              ['নিট লাভ', 'Net profit', '৳১,২১,৩৫০', C.padma],
              ['ডিম সংগ্রহ', 'Eggs collected', '১,৭৪২', '#B07A00'],
              ['খাদ্য ব্যবহার', 'Feed used', '১৮ বস্তা', C.sky],
            ].map(([bn, en, value, color]) => (
              <View key={en} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.canvas, borderRadius: 12, padding: 10 }}>
                <View style={{ width: 4, height: 28, borderRadius: 2, backgroundColor: color }} />
                <View style={{ flex: 1 }}>
                  <Tx font="Noto Sans Bengali, Inter, sans-serif" style={{ fontWeight: '700', fontSize: 15 }}>{bn}</Tx>
                  <Tx font={font} style={{ fontSize: 11, color: C.faint }}>{en}</Tx>
                </View>
                <Tx font="Noto Sans Bengali, Inter, sans-serif" style={{ fontWeight: '800', fontSize: 16, color }}>{value}</Tx>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function Stat({ font, k, v, lime = false }: { font: string; k: string; v: string; lime?: boolean }) {
  return (
    <View style={{ width: 92 }}>
      <Tx font={font} style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{k}</Tx>
      <Tx font={font} style={{ color: lime ? C.lime : C.white, fontWeight: '700', fontSize: 13 }}>{v}</Tx>
    </View>
  );
}

function card(): ViewStyle {
  return { backgroundColor: C.white, borderRadius: 28, borderWidth: 1, borderColor: C.line, padding: 24 };
}

function Showcase({
  c, font, wide, width, tab, setTab,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  width: number;
  tab: number;
  setTab: (n: number) => void;
}) {
  const phones = [
    <PhoneHome key="h" c={c} font={font} width={wide ? 250 : 220} height={wide ? 520 : 460} />,
    <PhoneSell key="s" c={c} font={font} width={wide ? 280 : 240} height={wide ? 580 : 500} />,
    <PhoneHisab key="a" c={c} font={font} width={wide ? 250 : 220} height={wide ? 520 : 460} />,
  ];
  const active = tab === 3 ? 0 : tab;
  return (
    <View style={{ marginTop: wide ? 72 : 40 }}>
      <Wave fill={C.forest} />
      <View style={{ backgroundColor: C.forest, overflow: 'hidden', paddingBottom: 70, marginTop: -1 }}>
        <View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: 80 }}>
          <Glow w={800} h={600} color={C.lime} op={0.14} />
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Eyebrow font={font} dark center>{c.showEyebrow}</Eyebrow>
          <Tx font={font} style={{ marginTop: 16, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40, fontWeight: '800', color: C.white, textAlign: 'center', letterSpacing: -1.2, maxWidth: 820 }}>{c.showTitle}</Tx>
          <Tx font={font} style={{ marginTop: 12, fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.68)', textAlign: 'center', maxWidth: 640 }}>{c.showLead}</Tx>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: C.forest2, borderRadius: 18, padding: 4, marginTop: 26, alignSelf: 'center', maxWidth: '100%' }}>
            {c.tabs.map((label, i) => (
              <Pressable key={label} onPress={() => setTab(i)} style={{ paddingHorizontal: wide ? 18 : 10, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i === tab ? C.lime : 'transparent' }}>
                <Tx font={font} style={{ fontWeight: '700', fontSize: 13, color: i === tab ? C.forest : 'rgba(255,255,255,0.72)' }}>{label}</Tx>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: wide ? 48 : 36, marginTop: 40, paddingHorizontal: 16 }}>
          {phones.map((phone, i) => (
            <View key={c.phones[i].title} style={{ alignItems: 'center', width: wide ? 280 : '100%', maxWidth: 320, opacity: wide && i !== active ? 0.92 : 1, transform: [{ translateY: wide && i === active ? -16 : 0 }] }}>
              {phone}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
                <Chip name={['home', 'cash', 'receipt'][i]} bg={i === active ? C.lime : C.forest2} fg={i === active ? C.forest : C.lime} size={28} />
                <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.phones[i].title}</Tx>
              </View>
              <Tx font={font} style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{c.phones[i].body}</Tx>
            </View>
          ))}
        </View>
      </View>
      <View style={{ backgroundColor: C.forest }}>
        <Wave fill={C.white} />
      </View>
    </View>
  );
}

function Steps({ c, font, wide, frame }: { c: LandingCopy; font: string; wide: boolean; frame: (e?: ViewStyle) => ViewStyle }) {
  const snippets = [
    <View key="a" style={{ gap: 8 }}>
      {[['barn', 'Padma Poultry'], ['pin', 'Gazipur · Sreepur']].map(([icon, value]) => (
        <View key={value} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10 }}>
          <Icon name={icon} size={15} color={C.faint} />
          <Tx font={font} style={{ flex: 1, fontWeight: '700' }}>{value}</Tx>
          <Icon name="check" size={14} color={C.emerald} sw={2.6} />
        </View>
      ))}
    </View>,
    <View key="b" style={{ gap: 8 }}>
      {[
        ['alert', c.phones[0] ? 'Deaths · B-12' : '', '2', C.coralSoft, C.coral],
        ['wheat', 'Feed', '3', C.goldSoft, '#B07A00'],
        ['milk', c.morning, '72 L', C.skySoft, C.sky],
      ].map(([icon, label, value, bg, fg]) => (
        <View key={String(label)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 8 }}>
          <Chip name={String(icon)} bg={String(bg)} fg={String(fg)} size={26} />
          <Tx font={font} style={{ flex: 1, fontWeight: '600', fontSize: 13 }}>{label}</Tx>
          <Tx font={font} style={{ fontWeight: '800' }}>{value}</Tx>
        </View>
      ))}
    </View>,
    <View key="c" style={{ backgroundColor: C.forest, borderRadius: 14, padding: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Tx font={font} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{c.october}</Tx>
        <View style={{ backgroundColor: C.lime, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Tx font={font} style={{ color: C.forest, fontSize: 10, fontWeight: '800' }}>PDF</Tx>
        </View>
      </View>
      <Tx font={font} style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>৳1,21,350</Tx>
      <Area w={240} h={32} pts={[3, 4, 3.6, 5.5, 5, 6.6, 8]} stroke={C.lime} sw={2} />
    </View>,
  ];
  return (
    <View style={{ backgroundColor: C.white }}>
      <View style={frame({ paddingTop: 48, paddingBottom: wide ? 90 : 56 })}>
        <View style={{ alignItems: 'center' }}>
          <Eyebrow font={font} center>{c.stepsEyebrow}</Eyebrow>
          <Tx font={font} style={{ marginTop: 14, fontSize: wide ? 42 : 30, lineHeight: wide ? 50 : 38, fontWeight: '800', letterSpacing: -1, textAlign: 'center' }}>{c.stepsTitle}</Tx>
          <Tx font={font} style={{ marginTop: 10, color: C.sub, textAlign: 'center', fontSize: 16, maxWidth: 640 }}>{c.stepsLead}</Tx>
        </View>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 28, marginTop: 40 }}>
          {c.steps.map((step, i) => (
            <View key={step.title} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: i === 1 ? C.lime : C.forest, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: i === 1 ? C.limeSoft : C.mint }}>
                <Tx font={font} style={{ color: i === 1 ? C.forest : C.lime, fontWeight: '800', fontSize: 16 }}>{`0${i + 1}`}</Tx>
              </View>
              <Tx font={font} style={{ marginTop: 16, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{step.title}</Tx>
              <Tx font={font} style={{ marginTop: 6, color: C.sub, textAlign: 'center', lineHeight: 21 }}>{step.body}</Tx>
              <View style={{ marginTop: 16, width: '100%', backgroundColor: C.canvas, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12 }}>{snippets[i]}</View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Hisab({
  c, font, wide, frame, period, setPeriod,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  frame: (e?: ViewStyle) => ViewStyle;
  period: number;
  setPeriod: (n: number) => void;
}) {
  const periods = localePeriods(c);
  return (
    <View style={{ backgroundColor: C.canvas }}>
      <View style={frame({ paddingVertical: wide ? 80 : 48, flexDirection: wide ? 'row' : 'column', gap: 36, alignItems: wide ? 'center' : 'stretch' })}>
        <View style={{ width: wide ? 440 : '100%' }}>
          <Eyebrow font={font}>{c.hisabEyebrow}</Eyebrow>
          <Tx font={font} style={{ marginTop: 14, fontSize: wide ? 40 : 30, lineHeight: wide ? 48 : 38, fontWeight: '800', letterSpacing: -1 }}>{c.hisabTitle}</Tx>
          <Tx font={font} style={{ marginTop: 12, color: C.sub, fontSize: 16, lineHeight: 26 }}>{c.hisabLead}</Tx>
          <View style={{ marginTop: 20, gap: 10 }}>
            {c.hisabPoints.map((point) => (
              <View key={point} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} color={C.lime} sw={3} />
                </View>
                <Tx font={font} style={{ flex: 1, fontWeight: '600' }}>{point}</Tx>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
            <Btn label={c.sampleHisab} font={font} href={REGISTER} kind="dark" icon="file" />
            <Btn label={c.openDash} font={font} href={LOGIN} kind="outline" />
          </View>
        </View>
        <View style={{ flex: 1, minHeight: wide ? 520 : undefined }}>
          <View style={{ backgroundColor: C.white, borderRadius: 28, borderWidth: 1, borderColor: C.line, padding: 22, boxShadow: '0 30px 60px rgba(12,42,32,0.08)' }}>
            <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', gap: 12 }}>
              <View>
                <Tx font={font} style={{ color: C.sub, fontSize: 13 }}>{c.netProfit} · {c.october}</Tx>
                <Tx font={font} style={{ fontSize: 36, fontWeight: '800', letterSpacing: -1 }}>৳1,21,350</Tx>
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: '#E6EDE9', borderRadius: 14, padding: 4, alignSelf: 'flex-start' }}>
                {periods.map((label, i) => (
                  <Pressable key={label} onPress={() => setPeriod(i)} style={{ paddingHorizontal: 12, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: i === period ? C.white : 'transparent' }}>
                    <Tx font={font} style={{ fontWeight: '700', fontSize: 13 }}>{label}</Tx>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                [c.income, '৳4,82,600', C.mint, C.padma],
                [c.expense, '৳3,61,250', C.coralSoft, '#C9473A'],
                [c.receivable, '৳38,250', C.goldSoft, '#9A6A00'],
              ].map(([label, value, bg, fg]) => (
                <View key={label} style={{ flexGrow: 1, minWidth: 120, backgroundColor: bg, borderRadius: 12, padding: 10 }}>
                  <Tx font={font} style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{label}</Tx>
                  <Tx font={font} style={{ fontWeight: '800', marginTop: 2 }}>{value}</Tx>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 16 }}>
              <PairBars w={wide ? 560 : Math.max(260, 320)} h={wide ? 180 : 140} pairs={weeks} />
            </View>
          </View>
          {wide ? (
            <View style={{ position: 'absolute', left: -20, bottom: 20, width: 270, backgroundColor: C.forest, borderRadius: 22, padding: 16, boxShadow: '0 24px 50px rgba(12,42,32,0.28)' }}>
              <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.whereMoney}</Tx>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <View style={{ width: 96, height: 96 }}>
                  <Donut size={96} sw={14} segs={[{ p: 54, color: C.lime }, { p: 18, color: C.emerald }, { p: 11, color: C.gold }, { p: 9, color: C.sky }, { p: 8, color: C.coral }]} />
                  <View style={{ position: 'absolute', left: 0, top: 0, width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                    <Tx font={font} style={{ color: C.white, fontWeight: '800' }}>54%</Tx>
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  {[['Feed', C.lime], ['Chicks', C.emerald], ['Labour', C.gold], ['Medicine', C.sky], ['Other', C.coral]].map(([label, color]) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
                      <Tx font={font} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{label}</Tx>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function localePeriods(c: LandingCopy) {
  return c.hisabEyebrow === 'Hisab' ? ['Week', 'Month', 'Year'] : ['সপ্তাহ', 'মাস', 'বছর'];
}

function Stories({ c, font, wide, frame }: { c: LandingCopy; font: string; wide: boolean; frame: (e?: ViewStyle) => ViewStyle }) {
  const faces = [
    ['KU', C.lime, C.forest],
    ['NS', '#F9D99A', '#7A5200'],
    ['AH', '#BFD7FF', '#1F4FA8'],
  ] as const;
  return (
    <View style={{ backgroundColor: C.white }}>
      <View style={frame({ paddingTop: wide ? 40 : 20, paddingBottom: 30 })}>
        <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'flex-end' : 'flex-start', gap: 16 }}>
          <View>
            <Eyebrow font={font}>{c.storiesEyebrow}</Eyebrow>
            <Tx font={font} style={{ marginTop: 12, fontSize: wide ? 42 : 30, lineHeight: wide ? 50 : 38, fontWeight: '800', letterSpacing: -1, maxWidth: 640 }}>{c.storiesTitle}</Tx>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.canvas, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Tx font={font} style={{ fontSize: 36, fontWeight: '800' }}>4.8</Tx>
            <View>
              <Stars size={16} />
              <Tx font={font} style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{c.ratingNote}</Tx>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 28 }}>
          {c.quotes.map((quote, i) => {
            const dark = i === 1;
            return (
              <View key={quote.name} style={{ flex: 1, borderRadius: 28, padding: 24, backgroundColor: dark ? C.forest : C.canvas, borderWidth: dark ? 0 : 1, borderColor: C.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Stars size={14} />
                  <View style={{ backgroundColor: dark ? C.lime : C.white, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, borderWidth: dark ? 0 : 1, borderColor: C.line }}>
                    <Tx font={font} style={{ fontSize: 11, fontWeight: '700', color: dark ? C.forest : C.padma }}>{quote.stat}</Tx>
                  </View>
                </View>
                <Tx font={font} style={{ marginTop: 16, fontSize: 17, lineHeight: 27, fontWeight: '600', color: dark ? C.white : C.ink }}>{quote.quote}</Tx>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: dark ? 'rgba(255,255,255,0.12)' : C.line }}>
                  <Avatar initials={faces[i][0]} bg={faces[i][1]} fg={faces[i][2]} size={42} />
                  <View>
                    <Tx font={font} style={{ fontWeight: '700', color: dark ? C.white : C.ink }}>{quote.name}</Tx>
                    <Tx font={font} style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.62)' : C.sub }}>{quote.farm}</Tx>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Reliability({ c, font, wide, frame }: { c: LandingCopy; font: string; wide: boolean; frame: (e?: ViewStyle) => ViewStyle }) {
  const icons = ['cloud', 'bolt', 'shield', 'lock'];
  return (
    <View style={{ backgroundColor: C.white }}>
      <View style={frame({ paddingBottom: wide ? 80 : 40 })}>
        <View style={{ backgroundColor: C.forest2, borderRadius: 28, padding: 28, flexDirection: wide ? 'row' : 'column', gap: wide ? 0 : 22 }}>
          {c.trustItems.map((item, i) => (
            <View key={item.title} style={{ flex: 1, paddingRight: wide ? 18 : 0, paddingLeft: wide && i ? 18 : 0, borderLeftWidth: wide && i ? 1 : 0, borderLeftColor: 'rgba(255,255,255,0.1)' }}>
              <Chip name={icons[i]} bg={C.lime} fg={C.forest} size={44} />
              <Tx font={font} style={{ color: C.white, fontWeight: '700', fontSize: 16, marginTop: 12 }}>{item.title}</Tx>
              <Tx font={font} style={{ color: 'rgba(255,255,255,0.64)', marginTop: 6, lineHeight: 20, fontSize: 13 }}>{item.body}</Tx>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Faq({
  c, font, wide, frame, open, setOpen,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  frame: (e?: ViewStyle) => ViewStyle;
  open: number;
  setOpen: (n: number) => void;
}) {
  return (
    <View style={{ backgroundColor: C.canvas }}>
      <View style={frame({ paddingVertical: wide ? 80 : 48, flexDirection: wide ? 'row' : 'column', gap: 36, alignItems: 'flex-start' })}>
        <View style={{ width: wide ? 360 : '100%' }}>
          <Eyebrow font={font}>{c.faqEyebrow}</Eyebrow>
          <Tx font={font} style={{ marginTop: 14, fontSize: wide ? 40 : 30, lineHeight: wide ? 48 : 38, fontWeight: '800', letterSpacing: -1 }}>{c.faqTitle}</Tx>
          <Tx font={font} style={{ marginTop: 10, color: C.sub, lineHeight: 24 }}>{c.faqLead}</Tx>
          <View style={{ marginTop: 22, backgroundColor: C.forest, borderRadius: 22, padding: 18, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Chip name="phone" bg={C.lime} fg={C.forest} size={42} />
              <View style={{ flex: 1 }}>
                <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.talk}</Tx>
                <Tx font={font} style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13 }}>{c.whatsapp}</Tx>
              </View>
            </View>
            <Pressable onPress={() => Linking.openURL('https://wa.me/8801700000000')} style={{ marginTop: 14, height: 44, borderRadius: 12, backgroundColor: C.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="phone" size={16} color={C.forest} />
              <Tx font={font} style={{ color: C.forest, fontWeight: '700' }}>{c.messageUs}</Tx>
            </Pressable>
          </View>
        </View>
        <View style={{ flex: 1, gap: 10, width: wide ? undefined : '100%' }}>
          {c.faqs.map((item, i) => {
            const on = i === open;
            return (
              <Pressable key={item.q} onPress={() => setOpen(on ? -1 : i)} style={{ backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: on ? '#BFD8CA' : C.line, padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Tx font={font} style={{ flex: 1, fontSize: 16, fontWeight: '700' }}>{item.q}</Tx>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: on ? C.forest : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={on ? 'x' : 'plus'} size={15} color={on ? C.lime : C.ink} />
                  </View>
                </View>
                {on ? <Tx font={font} style={{ marginTop: 10, color: C.sub, lineHeight: 22 }}>{item.a}</Tx> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Cta({ c, font, wide, frame }: { c: LandingCopy; font: string; wide: boolean; frame: (e?: ViewStyle) => ViewStyle }) {
  return (
    <View style={{ backgroundColor: C.canvas }}>
      <View style={frame({ paddingBottom: 50 })}>
        <View style={{ backgroundColor: C.forest, borderRadius: 36, overflow: 'hidden', padding: wide ? 48 : 24, flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: 28 }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: 80, top: -160 }}>
            <Glow w={700} h={560} color={C.lime} op={0.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow font={font} dark>{c.ctaEyebrow}</Eyebrow>
            <Tx font={font} style={{ marginTop: 14, fontSize: wide ? 46 : 32, lineHeight: wide ? 54 : 40, fontWeight: '800', color: C.white, letterSpacing: -1.2 }}>{c.ctaTitle}</Tx>
            <Tx font={font} style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 26 }}>{c.ctaBody}</Tx>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              <Btn label={c.downloadSize} font={font} onPress={downloadApk} icon="download" />
              <Btn label={c.openDash} font={font} href={LOGIN} kind="ghost" />
            </View>
          </View>
          <View style={{ backgroundColor: C.white, borderRadius: 22, padding: 16, alignItems: 'center' }}>
            <Qr size={148} />
            <Tx font={font} style={{ fontWeight: '700', marginTop: 8 }}>{c.scan}</Tx>
            <Tx font={font} style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{c.androidVer}</Tx>
          </View>
          {wide ? <PhoneHome c={c} font={font} width={220} height={460} /> : null}
        </View>
      </View>
    </View>
  );
}

function Footer({
  c, font, wide, frame, width, locale, onLocale, onNav,
}: {
  c: LandingCopy;
  font: string;
  wide: boolean;
  frame: (e?: ViewStyle) => ViewStyle;
  width: number;
  locale: 'en' | 'bn';
  onLocale: () => void;
  onNav: (id: string) => void;
}) {
  return (
    <View>
      <Wave fill={C.forest} />
      <View style={{ backgroundColor: C.forest }}>
        <View style={frame({ paddingTop: 20, paddingBottom: 28 })}>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 32 }}>
            <View style={{ width: wide ? 340 : '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <LogoMark size={40} />
                <View>
                  <Tx font={font} style={{ color: C.white, fontWeight: '800', fontSize: 16 }}>Khamar Manager</Tx>
                  <Tx font={font} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{c.footerTag}</Tx>
                </View>
              </View>
              <Tx font={font} style={{ color: 'rgba(255,255,255,0.62)', marginTop: 14, lineHeight: 22 }}>{c.footerBlurb}</Tx>
            </View>
            {c.footerCols.map((col) => (
              <View key={col.title} style={{ flex: 1 }}>
                <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{col.title}</Tx>
                <View style={{ marginTop: 12, gap: 10 }}>
                  {col.links.map((link) => (
                    <Pressable key={link} onPress={() => onNav(link.toLowerCase().includes('feature') || link.includes('সুবিধা') ? 'features' : 'screens')}>
                      <Tx font={font} style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14 }}>{link}</Tx>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ width: wide ? 210 : '100%' }}>
              <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.getApp}</Tx>
              <Pressable onPress={downloadApk} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.forest2, borderRadius: 14, padding: 10 }}>
                <Chip name="android" bg={C.lime} fg={C.forest} size={32} />
                <View>
                  <Tx font={font} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{c.download}</Tx>
                  <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.androidApk}</Tx>
                </View>
              </Pressable>
              <Link href={LOGIN} asChild>
                <Pressable style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.forest2, borderRadius: 14, padding: 10 }}>
                  <Chip name="grid" bg={C.white} fg={C.forest} size={32} />
                  <View>
                    <Tx font={font} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{c.open}</Tx>
                    <Tx font={font} style={{ color: C.white, fontWeight: '700' }}>{c.webDash}</Tx>
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>
          <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'center' : 'flex-start', gap: 12, marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <Tx font={font} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{c.rights}</Tx>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {c.legal.map((item) => (
                <Tx key={item} font={font} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item}</Tx>
              ))}
              <Pressable onPress={onLocale} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.forest2, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Icon name="globe" size={13} color={C.lime} />
                <Tx font={font} style={{ color: C.white, fontSize: 12, fontWeight: '700' }}>{locale === 'bn' ? 'English' : 'বাংলা'}</Tx>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
