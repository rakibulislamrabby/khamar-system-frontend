import { Link, Redirect } from 'expo-router';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { PhoneMockup, Wave } from '@/components/landing-shapes';
import { AppText } from '@/components/ui/primitives';
import { Palette } from '@/constants/theme';
import { downloadApk } from '@/lib/download-apk';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { Locale } from '@/i18n/translations';

const shots = {
  home: require('@/assets/images/landing/home.png'),
  livestock: require('@/assets/images/landing/livestock.png'),
  sell: require('@/assets/images/landing/sell.png'),
  hisab: require('@/assets/images/landing/hisab.png'),
} as const;

const copy = {
  en: {
    eyebrow: 'Farm software for Bangladesh',
    title: 'See the shed and the hisab on the same screen',
    body: 'Khamar Manager is the daily book for poultry batches, cows and milk, stock, sales, and profit. Use it in the browser, or install the Android app.',
    shotNote: 'Screens from the Android app. Sample farm: Padma Poultry, Gazipur.',
    homeLabel: 'Home',
    homeTitle: 'The morning numbers',
    homeBody:
      'Revenue, cost, and net result sit at the top. Poultry batches, the herd, low stock, and the latest sale are on the same page.',
    livestockLabel: 'Livestock',
    livestockTitle: 'Every batch stays on its own card',
    livestockBody:
      'Bird type, live count, arrival date, and chick price. Open a batch for deaths, feed, and eggs.',
    sellLabel: 'Sell',
    sellTitle: 'A sale is a line, not a guess',
    sellBody: 'Record birds by piece or kilogram, the rate, and the money received. The sale shows up on Home and Hisab.',
    hisabLabel: 'Hisab',
    hisabTitle: 'Income, expense, and a PDF',
    hisabBody:
      'Sales and costs add themselves. Download the invoice when the buyer or the accountant asks for paper.',
    galleryKicker: 'Inside the app',
    galleryTitle: 'Four screens a farmer opens every day',
    covers: 'What the account includes',
    features: [
      ['Poultry', 'Broiler, layer, Sonali, duck. Batches, mortality, eggs.'],
      ['Dairy', 'Cow register, morning and evening milk, health, calving.'],
      ['Stock', 'Feed, medicine, vaccine, and low-stock alerts.'],
      ['Purchases', 'Supplier bills that can land in inventory.'],
      ['Customers', 'Who bought, and what is still receivable.'],
      ['Roles', 'Owner, manager, accountant, vet, and worker.'],
      ['Farms', 'More than one shed or location under one login.'],
      ['Language', 'Bangla or English, on the phone and on the web.'],
    ],
    stepsTitle: 'From the first login to the day’s hisab',
    steps: [
      ['Open the farm', 'Create the account with the farm name, district, and upazila.'],
      ['Write the day', 'Add a batch, a cost, a death, milk, or a sale. Totals calculate themselves.'],
      ['Close the book', 'Hisab shows profit or loss. The same login works in the browser.'],
    ],
    downloadTitle: 'Take the same screens to the shed',
    downloadBody: 'The APK is the Android app. Sign in with the account you create here.',
    footer: 'Khamar Manager · poultry and dairy, one ledger',
  },
  bn: {
    eyebrow: 'বাংলাদেশের খামারের সফটওয়্যার',
    title: 'শেডের কাজ আর হিসাব, একই পর্দায়',
    body: 'খামার ম্যানেজার পোল্ট্রি ব্যাচ, গরু ও দুধ, স্টক, বিক্রি এবং লাভের দৈনিক খাতা। ব্রাউজারে খুলুন, অথবা অ্যান্ড্রয়েড অ্যাপ নিন।',
    shotNote: 'অ্যান্ড্রয়েড অ্যাপের পর্দা। নমুনা খামার: পদ্মা পোল্ট্রি, গাজীপুর।',
    homeLabel: 'হোম',
    homeTitle: 'সকালের হিসাব',
    homeBody: 'আয়, খরচ ও নীট ফল উপরে। পোল্ট্রি ব্যাচ, গবাদি পশু, কম স্টক এবং শেষ বিক্রি একই পাতায়।',
    livestockLabel: 'পশুপাখি',
    livestockTitle: 'প্রতিটি ব্যাচ আলাদা কার্ডে',
    livestockBody: 'পাখির ধরন, জীবিত সংখ্যা, আগমনের তারিখ ও বাচ্চার দাম। ব্যাচ খুলে মৃত্যু, খাবার ও ডিম লিখুন।',
    sellLabel: 'বিক্রি',
    sellTitle: 'বিক্রি একটি লাইন, অনুমান নয়',
    sellBody: 'পিস বা কেজিতে পাখি, রেট এবং প্রাপ্ত টাকা লিখুন। বিক্রি হোম ও হিসাবে উঠে আসে।',
    hisabLabel: 'হিসাব',
    hisabTitle: 'আয়, ব্যয় এবং PDF',
    hisabBody: 'বিক্রি ও খরচ নিজে যোগ হয়। ক্রেতা বা হিসাবরক্ষক চাইলে ইনভয়েস ডাউনলোড করুন।',
    galleryKicker: 'অ্যাপের ভেতরে',
    galleryTitle: 'খামারি প্রতিদিন যে চারটি পর্দা খোলেন',
    covers: 'অ্যাকাউন্টে যা থাকে',
    features: [
      ['পোল্ট্রি', 'ব্রয়লার, লেয়ার, সোনালি, হাঁস। ব্যাচ, মৃত্যু, ডিম।'],
      ['ডেইরি', 'গরুর খাতা, সকাল-সন্ধ্যার দুধ, স্বাস্থ্য, প্রসব।'],
      ['স্টক', 'খাবার, ওষুধ, টিকা এবং কম স্টকের সতর্কতা।'],
      ['ক্রয়', 'সরবরাহকারীর বিল স্টকে ঢুকতে পারে।'],
      ['ক্রেতা', 'কে কিনেছে, এবং কত বাকি।'],
      ['ভূমিকা', 'মালিক, ম্যানেজার, হিসাবরক্ষক, vet ও কর্মী।'],
      ['খামার', 'এক লগইনে একাধিক শেড বা স্থান।'],
      ['ভাষা', 'বাংলা বা ইংরেজি, ফোন ও ওয়েবে।'],
    ],
    stepsTitle: 'প্রথম লগইন থেকে দিনের হিসাব',
    steps: [
      ['খামার খুলুন', 'খামারের নাম, জেলা ও উপজেলা দিয়ে অ্যাকাউন্ট তৈরি করুন।'],
      ['দিন লিখুন', 'ব্যাচ, খরচ, মৃত্যু, দুধ বা বিক্রি যোগ করুন। যোগফল নিজে হয়।'],
      ['খাতা বন্ধ করুন', 'হিসাবে লাভ বা ক্ষতি। একই লগইন ব্রাউজারেও চলে।'],
    ],
    downloadTitle: 'একই পর্দা শেডে নিয়ে যান',
    downloadBody: 'APK হলো অ্যান্ড্রয়েড অ্যাপ। এখানে যে অ্যাকাউন্ট খুলবেন, সেখানেই সাইন ইন করুন।',
    footer: 'খামার ম্যানেজার · পোল্ট্রি ও ডেইরি, এক খাতা',
  },
} satisfies Record<Locale, Copy>;

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  shotNote: string;
  homeLabel: string;
  homeTitle: string;
  homeBody: string;
  livestockLabel: string;
  livestockTitle: string;
  livestockBody: string;
  sellLabel: string;
  sellTitle: string;
  sellBody: string;
  hisabLabel: string;
  hisabTitle: string;
  hisabBody: string;
  galleryKicker: string;
  galleryTitle: string;
  covers: string;
  features: [string, string][];
  stepsTitle: string;
  steps: [string, string][];
  downloadTitle: string;
  downloadBody: string;
  footer: string;
};

export function LandingPage() {
  const { status } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  const text = copy[locale];

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-rice"
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: insets.bottom, backgroundColor: Palette.rice }}>
      <View className="border-b border-line bg-white px-5 py-3" style={{ paddingTop: insets.top + 10 }}>
        <View className="mx-auto w-full max-w-6xl flex-row items-center justify-between gap-3">
          <BrandLogo size="header" />
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
              className="rounded-full border border-line px-3 py-2">
              <AppText variant="caption" className="font-semibold text-ink">
                {locale === 'bn' ? 'English' : 'বাংলা'}
              </AppText>
            </Pressable>
            <Link href="/(auth)/login" asChild>
              <Pressable className="rounded-full px-3 py-2">
                <AppText variant="caption" className="font-semibold text-padma">
                  {t('signIn')}
                </AppText>
              </Pressable>
            </Link>
            <Link href="/(auth)/register" asChild>
              <Pressable className="rounded-full bg-padma px-4 py-2">
                <AppText variant="caption" className="font-semibold text-white">
                  {t('createAccount')}
                </AppText>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      <View className="relative overflow-hidden" style={{ backgroundColor: Palette.padma }}>
        <View
          pointerEvents="none"
          className="absolute rounded-full"
          style={{ width: 620, height: 620, right: -200, top: -260, backgroundColor: Palette.paddy, opacity: 0.6 }}
        />
        <View
          pointerEvents="none"
          className="absolute rounded-full"
          style={{ width: 360, height: 360, right: wide ? 120 : -120, top: 140, backgroundColor: Palette.leaf, opacity: 0.18 }}
        />
        <View
          pointerEvents="none"
          className="absolute rounded-full"
          style={{ width: 260, height: 260, left: -110, bottom: 40, backgroundColor: Palette.jute, opacity: 0.14 }}
        />
        <View className="px-5 pb-4 pt-12">
        <View className={`mx-auto w-full max-w-6xl ${wide ? 'flex-row items-center gap-12' : ''}`}>
          <View className="min-w-0 flex-1">
            <AppText variant="label" className="text-jute">
              {text.eyebrow}
            </AppText>
            <AppText variant="display" className="mt-3 max-w-xl text-white">
              {text.title}
            </AppText>
            <AppText variant="body" className="mt-4 max-w-lg text-white/80">
              {text.body}
            </AppText>
            <View className={wide ? 'mt-7 flex-row flex-wrap gap-3' : 'mt-7 gap-3'}>
              <Link href="/(auth)/register" asChild>
                <Pressable className="min-h-[48px] items-center justify-center rounded-full bg-white px-5">
                  <AppText variant="subtitle" className="text-soil">
                    {t('createAccount')}
                  </AppText>
                </Pressable>
              </Link>
              <Link href="/(auth)/login" asChild>
                <Pressable className="min-h-[48px] items-center justify-center rounded-full border border-white/30 px-5">
                  <AppText variant="subtitle" className="text-white">
                    {t('signIn')}
                  </AppText>
                </Pressable>
              </Link>
              <Pressable
                onPress={downloadApk}
                className="min-h-[48px] items-center justify-center rounded-full bg-jute px-5">
                <AppText variant="subtitle" className="text-soil">
                  {t('downloadApk')}
                </AppText>
              </Pressable>
            </View>
            <AppText variant="caption" className="mt-4 text-white/60">
              {text.shotNote}
            </AppText>
          </View>
          <View className={wide ? 'pr-8' : 'mt-12 items-center'}>
            <PhoneMockup source={shots.home} label={text.homeLabel} width={wide ? 280 : 240} greenTop captionLight />
          </View>
        </View>
        </View>
        <View style={{ height: 120 }}>
          <View className="absolute inset-x-0 bottom-0">
            <Wave color={Palette.leaf} opacity={0.35} variant={1} height={120} />
          </View>
          <View className="absolute inset-x-0 bottom-0">
            <Wave color={Palette.rice} height={90} />
          </View>
        </View>
      </View>

      <View className="mx-auto w-full max-w-6xl px-5 py-12">
        <ScreenBlock
          wide={wide}
          flip
          kicker={text.livestockLabel}
          title={text.livestockTitle}
          body={text.livestockBody}
          source={shots.livestock}
          label={text.livestockLabel}
        />
        <ScreenBlock
          wide={wide}
          flip={false}
          kicker={text.sellLabel}
          title={text.sellTitle}
          body={text.sellBody}
          source={shots.sell}
          label={text.sellLabel}
        />
        <ScreenBlock
          wide={wide}
          flip
          kicker={text.hisabLabel}
          title={text.hisabTitle}
          body={text.hisabBody}
          source={shots.hisab}
          label={text.hisabLabel}
        />
      </View>

      <View
        className="self-center bg-white px-5 pb-16 pt-5"
        style={{
          width: Math.min(width - (wide ? 48 : 20), 1280),
          borderRadius: wide ? 56 : 32,
          boxShadow: '0 20px 60px rgba(0, 106, 78, 0.10)',
        }}>
        <View className="mx-auto h-1.5 w-14 rounded-full" style={{ backgroundColor: Palette.line }} />
        <View className="mx-auto mt-10 w-full max-w-6xl">
          <AppText variant="label" className="text-center text-padma">
            {text.galleryKicker}
          </AppText>
          <AppText variant="title" className="mx-auto mt-2 max-w-xl text-center">
            {text.galleryTitle}
          </AppText>
          <View className="mt-10 flex-row flex-wrap items-start justify-center gap-8">
            {(
              [
                [shots.home, text.homeLabel, true],
                [shots.livestock, text.livestockLabel, false],
                [shots.sell, text.sellLabel, false],
                [shots.hisab, text.hisabLabel, false],
              ] as const
            ).map(([source, label, greenTop], index) => (
              <View key={label} style={{ marginTop: wide && index % 2 === 1 ? 40 : 0 }}>
                <PhoneMockup source={source} label={label} width={wide ? 210 : 180} greenTop={greenTop} />
              </View>
            ))}
          </View>

          <View className="mt-20">
            <AppText variant="title">{text.covers}</AppText>
            <View className="mt-6 flex-row flex-wrap" style={{ marginHorizontal: -8 }}>
              {text.features.map(([name, detail], index) => (
                <View key={name} style={{ width: wide ? '25%' : width >= 640 ? '50%' : '100%', padding: 8 }}>
                  <View className="h-full rounded-3xl p-5" style={{ backgroundColor: Palette.rice }}>
                    <View
                      className="h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: index % 3 === 1 ? Palette.jute : Palette.padma }}>
                      <AppText variant="caption" className="font-bold text-white">
                        {String(index + 1).padStart(2, '0')}
                      </AppText>
                    </View>
                    <AppText variant="subtitle" className="mt-4">
                      {name}
                    </AppText>
                    <AppText variant="caption" className="mt-1 text-muted">
                      {detail}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className="mt-16" style={{ backgroundColor: Palette.mist }}>
        <Wave color={Palette.rice} edge="top" height={90} />
        <View className="px-5 pb-10 pt-8">
          <View className="mx-auto w-full max-w-6xl">
            <AppText variant="title">{text.stepsTitle}</AppText>
            <View className={wide ? 'mt-8 flex-row gap-6' : 'mt-6 gap-4'}>
              {text.steps.map(([name, detail], index) => (
                <View
                  key={name}
                  className="min-w-0 flex-1 rounded-3xl bg-white p-6"
                  style={{ marginTop: wide ? index * 24 : 0 }}>
                  <AppText variant="display" className="text-leaf/60">
                    {String(index + 1).padStart(2, '0')}
                  </AppText>
                  <AppText variant="subtitle" className="mt-2">
                    {name}
                  </AppText>
                  <AppText variant="caption" className="mt-2 text-muted">
                    {detail}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="px-5 pb-10 pt-6">
          <View
            className="relative mx-auto w-full max-w-6xl overflow-hidden"
            style={{ borderRadius: wide ? 40 : 28, backgroundColor: Palette.soil }}>
            <View
              pointerEvents="none"
              className="absolute rounded-full"
              style={{ width: 420, height: 420, right: -120, top: -180, backgroundColor: Palette.padma, opacity: 0.9 }}
            />
            <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
              <Wave color={Palette.leaf} opacity={0.16} variant={1} height={110} />
            </View>
            <View className={`p-8 ${wide ? 'flex-row items-center justify-between gap-10 p-12' : ''}`}>
              <View className="min-w-0 flex-1">
                <AppText variant="title" className="max-w-xl text-white">
                  {text.downloadTitle}
                </AppText>
                <AppText variant="body" className="mt-3 max-w-lg text-white/80">
                  {text.downloadBody}
                </AppText>
                <View className={wide ? 'mt-7 flex-row gap-3' : 'mt-6 gap-3'}>
                  <Pressable
                    onPress={downloadApk}
                    className="min-h-[48px] items-center justify-center rounded-full px-6"
                    style={{ backgroundColor: Palette.jute }}>
                    <AppText variant="subtitle" className="text-soil">
                      {t('downloadApk')}
                    </AppText>
                  </Pressable>
                  <Link href="/(auth)/login" asChild>
                    <Pressable className="min-h-[48px] items-center justify-center rounded-full bg-white px-6">
                      <AppText variant="subtitle" className="text-padma">
                        {t('signIn')}
                      </AppText>
                    </Pressable>
                  </Link>
                </View>
              </View>
              {wide ? (
                <View style={{ height: 300, overflow: 'hidden', marginBottom: -48 }}>
                  <PhoneMockup source={shots.hisab} label="" width={200} />
                </View>
              ) : null}
            </View>
          </View>
          <AppText variant="caption" className="mx-auto mt-8 w-full max-w-6xl text-center text-muted">
            {text.footer}
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

function ScreenBlock({
  wide,
  flip,
  kicker,
  title,
  body,
  source,
  label,
}: {
  wide: boolean;
  flip: boolean;
  kicker: string;
  title: string;
  body: string;
  source: number;
  label: string;
}) {
  const phoneWidth = wide ? 250 : 210;
  const phone = (
    <View className="items-center justify-center" style={{ width: phoneWidth + 120, paddingVertical: 24 }}>
      <View
        pointerEvents="none"
        className="absolute"
        style={{
          width: phoneWidth + 110,
          height: phoneWidth + 160,
          borderRadius: (phoneWidth + 110) / 2,
          backgroundColor: flip ? Palette.mist : 'rgba(212, 160, 23, 0.14)',
          transform: [{ rotate: flip ? '-12deg' : '10deg' }],
        }}
      />
      <PhoneMockup source={source} label={label} width={phoneWidth} />
    </View>
  );
  const words = (
    <View className="min-w-0 flex-1 justify-center">
      <AppText variant="label" className="text-padma">
        {kicker}
      </AppText>
      <AppText variant="title" className="mt-2">
        {title}
      </AppText>
      <AppText variant="body" className="mt-3 max-w-md text-muted">
        {body}
      </AppText>
    </View>
  );

  return (
    <View className={`mb-16 ${wide ? `flex-row items-center gap-12 ${flip ? 'flex-row-reverse' : ''}` : 'gap-6'}`}>
      {words}
      <View className={wide ? '' : 'items-center'}>{phone}</View>
    </View>
  );
}