import type { Locale } from '@/i18n/translations';

export type LandingCopy = {
  nav: string[];
  signIn: string;
  create: string;
  newBadge: string;
  badgeRest: string;
  titleA: string;
  titleB: string;
  heroBody: string;
  createFree: string;
  downloadApk: string;
  trusted: string;
  stats: { value: string; label: string }[];
  farmsFrom: string;
  districts: string[];
  featEyebrow: string;
  featTitle: string;
  featLead: string;
  poultryTitle: string;
  poultryBody: string;
  alive: string;
  mortality: string;
  dairyTitle: string;
  dairyBody: string;
  milkToday: string;
  morning: string;
  evening: string;
  stockTitle: string;
  stockBody: string;
  belowMin: string;
  salesTitle: string;
  salesBody: string;
  totalReceivable: string;
  invoiceTitle: string;
  invoiceBody: string;
  paid: string;
  total: string;
  rolesTitle: string;
  rolesBody: string;
  roles: string[];
  audit: { initials: string; name: string; detail: string; time: string; bg: string; fg: string }[];
  langTitle: string;
  langBody: string;
  showEyebrow: string;
  showTitle: string;
  showLead: string;
  tabs: string[];
  phones: { title: string; body: string }[];
  stepsEyebrow: string;
  stepsTitle: string;
  stepsLead: string;
  steps: { title: string; body: string }[];
  hisabEyebrow: string;
  hisabTitle: string;
  hisabLead: string;
  hisabPoints: string[];
  sampleHisab: string;
  openDash: string;
  netProfit: string;
  income: string;
  expense: string;
  receivable: string;
  whereMoney: string;
  storiesEyebrow: string;
  storiesTitle: string;
  ratingNote: string;
  quotes: { quote: string; name: string; farm: string; stat: string }[];
  trustItems: { title: string; body: string }[];
  faqEyebrow: string;
  faqTitle: string;
  faqLead: string;
  talk: string;
  whatsapp: string;
  messageUs: string;
  faqs: { q: string; a: string }[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  downloadSize: string;
  scan: string;
  androidVer: string;
  footerBlurb: string;
  footerTag: string;
  footerCols: { title: string; links: string[] }[];
  getApp: string;
  download: string;
  androidApk: string;
  open: string;
  webDash: string;
  rights: string;
  legal: string[];
  goodMorning: string;
  saleSaved: string;
  lowStock: string;
  starterFeed: string;
  eggsToday: string;
  activeBatches: string;
  newSale: string;
  buyer: string;
  owes: string;
  weight: string;
  rate: string;
  saveSale: string;
  weeklyFlow: string;
  october: string;
};

const en: LandingCopy = {
  nav: ['Features', 'Screens', 'Hisab', 'Stories', 'FAQ'],
  signIn: 'Sign in',
  create: 'Create account',
  newBadge: 'New',
  badgeRest: 'Android app 2.4 · works offline in the shed',
  titleA: 'Your whole farm,',
  titleB: 'one honest ledger.',
  heroBody:
    'Batches, deaths, feed, milk, stock, sales and profit — written once in the shed, seen everywhere. Bangla or English, phone or browser.',
  createFree: 'Create free account',
  downloadApk: 'Download APK',
  trusted: 'Trusted by 1,200+ farm owners',
  stats: [
    { value: '1,200+', label: 'farms keep hisab' },
    { value: '64', label: 'districts covered' },
    { value: '৳48 Cr', label: 'sales recorded' },
    { value: '3.9 lakh', label: 'birds tracked daily' },
  ],
  farmsFrom: 'Farms from',
  districts: ['Gazipur', 'Mymensingh', 'Bogura', 'Sirajganj', 'Chattogram', 'Jashore', 'Rangpur', 'Cumilla'],
  featEyebrow: 'Everything in one account',
  featTitle: 'From day-old chick to final hisab',
  featLead:
    'Six tools that used to live in six notebooks — now one ledger that updates itself every time someone in the shed taps save.',
  poultryTitle: 'Poultry batches',
  poultryBody: 'Broiler, layer, Sonali and duck. Deaths, feed, weight and FCR per batch — with a live survival ring.',
  alive: 'Alive',
  mortality: 'Mortality',
  dairyTitle: 'Dairy herd',
  dairyBody: 'Cow register, morning and evening milk, health and breeding records.',
  milkToday: 'Milk today',
  morning: 'Morning',
  evening: 'Evening',
  stockTitle: 'Stock & alerts',
  stockBody: 'Feed, medicine and vaccine with minimum levels and supplier bills.',
  belowMin: '3 items below minimum',
  salesTitle: 'Sales & receivables',
  salesBody: 'Sell by piece or kg. Every buyer has a running ledger of what they still owe.',
  totalReceivable: 'Total receivable',
  invoiceTitle: 'Hisab & PDF invoices',
  invoiceBody: 'Profit and loss by week, month or year. Invoice PDF in one tap.',
  paid: 'PAID',
  total: 'Total',
  rolesTitle: 'Roles & audit log',
  rolesBody: 'Owner, manager, accountant, vet and worker — each sees only what they need. Every change is kept.',
  roles: ['Owner', 'Manager', 'Accountant', 'Vet', 'Worker'],
  audit: [
    { initials: 'RA', name: 'Rafiq', detail: 'Worker added 2 deaths to B-12', time: '7:12 AM', bg: '#FDF0D3', fg: '#9A6A00' },
    { initials: 'NS', name: 'Nasrin', detail: 'Accountant edited invoice SL-6381', time: 'Yesterday', bg: '#ECE8FF', fg: '#5038C8' },
    { initials: 'KU', name: 'Karim', detail: 'Owner invited Dr. Hasan as Vet', time: 'Mon', bg: '#C5EF63', fg: '#0C2A20' },
  ],
  langTitle: 'Bangla or English, your choice',
  langBody: 'Every label, invoice and report switches language. Numbers stay in ৳ the way your buyers read them.',
  showEyebrow: 'App + web dashboard',
  showTitle: 'Same farm, same numbers — in the shed and the office.',
  showLead:
    'The worker taps a sale on the phone; the owner sees it on the dashboard a second later. No WhatsApp photos of paper khata.',
  tabs: ['Home', 'Sell', 'Hisab', 'Batches'],
  phones: [
    { title: 'Morning summary', body: 'Profit, eggs, milk and alerts the moment you open the app.' },
    { title: 'Sell in 20 seconds', body: 'Pick the product, the buyer and the weight. Due amount is tracked.' },
    { title: 'Hisab on the go', body: 'Where every taka went this month, by category.' },
  ],
  stepsEyebrow: 'How it works',
  stepsTitle: 'Up and running before the evening feed',
  stepsLead: 'No setup call, no spreadsheet import. Three steps and your farm is on the ledger.',
  steps: [
    { title: 'Open your farm', body: 'Sign up with the farm name, district and upazila. Sheds and cost categories come ready.' },
    { title: 'Write the day', body: 'Add a batch, a death, feed, milk or a sale from the phone in the shed — even offline.' },
    { title: 'Close the book', body: 'Hisab shows profit or loss instantly. Download the PDF for the buyer or the bank.' },
  ],
  hisabEyebrow: 'Hisab',
  hisabTitle: 'Know your profit before the buyer leaves the gate.',
  hisabLead: 'Income, expense and receivables add up as you work. Close the month in one tap — not one weekend.',
  hisabPoints: [
    'Profit and loss by week, month, year or batch',
    'Cost per bird and per litre of milk',
    'Who owes you money, and since when',
    'PDF statements your bank will accept',
  ],
  sampleHisab: 'See a sample hisab',
  openDash: 'Open web dashboard',
  netProfit: 'Net profit',
  income: 'Income',
  expense: 'Expense',
  receivable: 'Receivable',
  whereMoney: 'Where the money went',
  storiesEyebrow: 'Farmer stories',
  storiesTitle: 'Farms that closed the paper khata',
  ratingNote: 'Average from 900+ farm owners',
  quotes: [
    {
      quote: 'Paper khata used to take my Friday. Now the month closes itself and I know the profit of every batch before I sell.',
      name: 'Karim Uddin',
      farm: 'Padma Poultry · Gazipur',
      stat: 'Mortality down to 3%',
    },
    {
      quote: 'My manager enters feed and deaths from the shed. I check from Dhaka. We stopped arguing about numbers.',
      name: 'Nasima Sultana',
      farm: 'Sonali Agro · Mymensingh',
      stat: 'Saved ৳18,000 on feed',
    },
    {
      quote: 'Milk for 14 cows, morning and evening, and every buyer’s due amount in one place. My son set it up in ten minutes.',
      name: 'Abdul Hamid',
      farm: 'Hamid Dairy · Sirajganj',
      stat: 'Collects dues 2× faster',
    },
  ],
  trustItems: [
    { title: 'Works offline', body: 'Entries save on the phone and sync when the network returns.' },
    { title: 'Light on data', body: 'Built for 2G and slow village networks. The APK is 27 MB.' },
    { title: 'Daily backup', body: 'Your farm data is backed up every night and never sold.' },
    { title: 'Role-based access', body: 'Workers can add entries; only owners see profit.' },
  ],
  faqEyebrow: 'FAQ',
  faqTitle: 'Questions farmers ask us',
  faqLead: 'Still unsure? Our team answers on WhatsApp in Bangla, 9 AM to 9 PM.',
  talk: 'Talk to a farm expert',
  whatsapp: 'WhatsApp · 01700-000000',
  messageUs: 'Message us',
  faqs: [
    {
      q: 'Do I need internet in the shed?',
      a: 'No. The Android app saves every entry on the phone and syncs automatically when the network returns. The web dashboard always shows the latest synced numbers.',
    },
    {
      q: 'Can my manager and accountant use the same farm?',
      a: 'Yes. Invite them into the farm and give each a role. A worker can add deaths and feed. Profit stays visible to the owner.',
    },
    {
      q: 'Does it work for both poultry and dairy?',
      a: 'Yes. Broiler, layer, Sonali and duck batches sit next to the cow register, morning and evening milk, and breeding records.',
    },
    {
      q: 'Can I download invoices and hisab as PDF?',
      a: 'Yes. A sale makes an invoice PDF, and the month closes into a hisab PDF you can send to a buyer or a bank.',
    },
    {
      q: 'Is my farm data safe?',
      a: 'The farm is backed up every night. Workers only see the entries their role allows, and the books are not shared with anyone else.',
    },
    {
      q: 'Can I switch between Bangla and English?',
      a: 'Yes. The phone and the web dashboard use the same language switch. Amounts stay in ৳.',
    },
  ],
  ctaEyebrow: 'Free Android app',
  ctaTitle: 'Take your hisab to the shed today.',
  ctaBody: 'Create an account on the web, sign in on the phone. Same farm, same numbers, everywhere.',
  downloadSize: 'Download APK · 27 MB',
  scan: 'Scan to download',
  androidVer: 'Android 8.0 and above',
  footerBlurb:
    'Made in Bangladesh for the farmers who feed it. Batches, milk, stock, sales and hisab in Bangla or English.',
  footerTag: 'Poultry and dairy, one ledger',
  footerCols: [
    { title: 'Product', links: ['Features', 'Android app', 'Web dashboard', 'Hisab & invoices', 'What’s new'] },
    { title: 'Farms', links: ['Broiler', 'Layer & eggs', 'Sonali & duck', 'Dairy', 'Cooperatives'] },
    { title: 'Support', links: ['Help center', 'Video guides (Bangla)', 'WhatsApp support', 'Contact'] },
  ],
  getApp: 'Get the app',
  download: 'Download',
  androidApk: 'Android APK',
  open: 'Open',
  webDash: 'Web dashboard',
  rights: '© 2026 Khamar Manager. All rights reserved.',
  legal: ['Privacy', 'Terms', 'Cookies'],
  goodMorning: 'Good morning, Karim',
  saleSaved: 'Sale saved',
  lowStock: 'Low stock',
  starterFeed: 'Broiler starter feed · 3 of 10 bags',
  eggsToday: 'Eggs today',
  activeBatches: 'Active batches',
  newSale: 'New sale',
  buyer: 'Buyer',
  owes: 'Owes ৳12,400',
  weight: 'Weight',
  rate: 'Rate / kg',
  saveSale: 'Save sale · SL-6383',
  weeklyFlow: 'Weekly cash flow',
  october: 'October',
};

const bn: LandingCopy = {
  nav: ['সুবিধা', 'পর্দা', 'হিসাব', 'গল্প', 'প্রশ্ন'],
  signIn: 'সাইন ইন',
  create: 'অ্যাকাউন্ট তৈরি',
  newBadge: 'নতুন',
  badgeRest: 'অ্যান্ড্রয়েড অ্যাপ ২.৪ · শেডে অফলাইনে চলে',
  titleA: 'আপনার পুরো খামার,',
  titleB: 'একটা সৎ খাতা।',
  heroBody:
    'ব্যাচ, মৃত্যু, খাবার, দুধ, স্টক, বিক্রি আর লাভ — শেডে একবার লিখলে সব জায়গায় দেখা যায়। বাংলা বা ইংরেজি, ফোন বা ব্রাউজার।',
  createFree: 'বিনামূল্যে অ্যাকাউন্ট',
  downloadApk: 'APK ডাউনলোড',
  trusted: '১,২০০+ খামারির আস্থা',
  stats: [
    { value: '১,২০০+', label: 'খামার হিসাব রাখে' },
    { value: '৬৪', label: 'জেলায় পৌঁছেছে' },
    { value: '৳৪৮ কোটি', label: 'বিক্রি লেখা হয়েছে' },
    { value: '৩.৯ লাখ', label: 'পাখি প্রতিদিন' },
  ],
  farmsFrom: 'খামার আছে',
  districts: ['গাজীপুর', 'ময়মনসিংহ', 'বগুড়া', 'সিরাজগঞ্জ', 'চট্টগ্রাম', 'যশোর', 'রংপুর', 'কুমিল্লা'],
  featEyebrow: 'এক অ্যাকাউন্টে সব',
  featTitle: 'একদিনের বাচ্চা থেকে চূড়ান্ত হিসাব',
  featLead: 'ছয়টা খাতায় যা থাকত, এখন এক খাতা। শেডে কেউ সেভ চাপলে হিসাব নিজে আপডেট হয়।',
  poultryTitle: 'পোল্ট্রি ব্যাচ',
  poultryBody: 'ব্রয়লার, লেয়ার, সোনালি ও হাঁস। মৃত্যু, খাবার, ওজন ও FCR — জীবিত পাখির রিংসহ।',
  alive: 'জীবিত',
  mortality: 'মৃত্যু',
  dairyTitle: 'দুগ্ধপাল',
  dairyBody: 'গরুর খাতা, সকাল ও সন্ধ্যার দুধ, স্বাস্থ্য ও প্রসবের রেকর্ড।',
  milkToday: 'আজকের দুধ',
  morning: 'সকাল',
  evening: 'সন্ধ্যা',
  stockTitle: 'স্টক ও সতর্কতা',
  stockBody: 'খাবার, ওষুধ ও টিকা — ন্যূনতম মাত্রা আর সরবরাহকারীর বিলসহ।',
  belowMin: '৩টি জিনিস ন্যূনতমের নিচে',
  salesTitle: 'বিক্রি ও বকেয়া',
  salesBody: 'পিস বা কেজিতে বিক্রি। প্রতিটি ক্রেতার বকেয়ার আলাদা খাতা।',
  totalReceivable: 'মোট বকেয়া',
  invoiceTitle: 'হিসাব ও PDF ইনভয়েস',
  invoiceBody: 'সপ্তাহ, মাস বা বছরের লাভ-লোকসান। এক ট্যাপে ইনভয়েস PDF।',
  paid: 'পরিশোধ',
  total: 'মোট',
  rolesTitle: 'ভূমিকা ও অডিট লগ',
  rolesBody: 'মালিক, ম্যানেজার, হিসাবরক্ষক, vet ও কর্মী — প্রত্যেকে যতটুকু দরকার ততটুকু দেখেন।',
  roles: ['মালিক', 'ম্যানেজার', 'হিসাবরক্ষক', 'Vet', 'কর্মী'],
  audit: [
    { initials: 'RA', name: 'রফিক', detail: 'কর্মী B-12-তে ২টি মৃত্যু যোগ করেছেন', time: 'সকাল ৭:১২', bg: '#FDF0D3', fg: '#9A6A00' },
    { initials: 'NS', name: 'নাসরিন', detail: 'হিসাবরক্ষক ইনভয়েস SL-6381 বদলেছেন', time: 'গতকাল', bg: '#ECE8FF', fg: '#5038C8' },
    { initials: 'KU', name: 'করিম', detail: 'মালিক ডা. হাসানকে Vet আমন্ত্রণ করেছেন', time: 'সোম', bg: '#C5EF63', fg: '#0C2A20' },
  ],
  langTitle: 'বাংলা বা ইংরেজি, আপনার পছন্দ',
  langBody: 'লেবেল, ইনভয়েস ও রিপোর্ট ভাষা বদলায়। টাকার অঙ্ক ৳-এই থাকে, যেমন ক্রেতা পড়েন।',
  showEyebrow: 'অ্যাপ + ওয়েব ড্যাশবোর্ড',
  showTitle: 'একই খামার, একই সংখ্যা — শেডে ও অফিসে।',
  showLead: 'কর্মী ফোনে বিক্রি লেখেন, মালিক এক সেকেন্ডে ড্যাশবোর্ডে দেখেন। কাগজের খাতার ছবি আর পাঠাতে হয় না।',
  tabs: ['হোম', 'বিক্রি', 'হিসাব', 'ব্যাচ'],
  phones: [
    { title: 'সকালের সারাংশ', body: 'অ্যাপ খুললেই লাভ, ডিম, দুধ ও সতর্কতা।' },
    { title: '২০ সেকেন্ডে বিক্রি', body: 'পণ্য, ক্রেতা ও ওজন বাছুন। বকেয়া নিজে যোগ হয়।' },
    { title: 'চলতে চলতে হিসাব', body: 'এই মাসে প্রতিটি টাকা কোন খাতে গেছে।' },
  ],
  stepsEyebrow: 'যেভাবে শুরু',
  stepsTitle: 'সন্ধ্যার খাবারের আগেই চালু',
  stepsLead: 'কোনো সেটআপ কল নেই, স্প্রেডশিট নেই। তিন ধাপে খামার খাতায় উঠে যায়।',
  steps: [
    { title: 'খামার খুলুন', body: 'খামারের নাম, জেলা ও উপজেলা দিয়ে সাইন আপ করুন। শেড ও খরচের খাত তৈরি থাকে।' },
    { title: 'দিন লিখুন', body: 'শেডের ফোন থেকে ব্যাচ, মৃত্যু, খাবার, দুধ বা বিক্রি যোগ করুন — অফলাইনেও।' },
    { title: 'খাতা বন্ধ করুন', body: 'হিসাবে সাথে সাথে লাভ বা ক্ষতি। ক্রেতা বা ব্যাংকের জন্য PDF নামাতে পারবেন।' },
  ],
  hisabEyebrow: 'হিসাব',
  hisabTitle: 'ক্রেতা গেট ছাড়ার আগেই লাভ জানুন।',
  hisabLead: 'আয়, খরচ ও বকেয়া কাজের সাথে সাথে যোগ হয়। মাস বন্ধ হয় এক ট্যাপে — এক সপ্তাহান্তে নয়।',
  hisabPoints: [
    'সপ্তাহ, মাস, বছর বা ব্যাচের লাভ-লোকসান',
    'প্রতি পাখি ও প্রতি লিটার দুধের খরচ',
    'কে কতদিন ধরে বকেয়া রাখছে',
    'ব্যাংক মানবে এমন PDF স্টেটমেন্ট',
  ],
  sampleHisab: 'নমুনা হিসাব দেখুন',
  openDash: 'ওয়েব ড্যাশবোর্ড',
  netProfit: 'নিট লাভ',
  income: 'আয়',
  expense: 'খরচ',
  receivable: 'বকেয়া',
  whereMoney: 'টাকা গেছে কোথায়',
  storiesEyebrow: 'খামারির গল্প',
  storiesTitle: 'যে খামার কাগজের খাতা বন্ধ করেছে',
  ratingNote: '৯০০+ খামারির গড় রেটিং',
  quotes: [
    {
      quote: 'কাগজের খাতা শুক্রবার গিলে নিত। এখন মাস নিজে বন্ধ হয়, বিক্রির আগেই প্রতি ব্যাচের লাভ জানি।',
      name: 'করিম উদ্দিন',
      farm: 'পদ্মা পোল্ট্রি · গাজীপুর',
      stat: 'মৃত্যু ৩%-এ নেমেছে',
    },
    {
      quote: 'ম্যানেজার শেড থেকে খাবার ও মৃত্যু লেখেন। আমি ঢাকা থেকে দেখি। সংখ্যা নিয়ে আর ঝগড়া হয় না।',
      name: 'নাসিমা সুলতানা',
      farm: 'সোনালি এগ্রো · ময়মনসিংহ',
      stat: 'খাবারে ৳১৮,০০০ বাঁচে',
    },
    {
      quote: '১৪টা গরুর সকাল-সন্ধ্যার দুধ, আর প্রতিটি ক্রেতার বকেয়া এক জায়গায়। ছেলে দশ মিনিটে বসিয়ে দিয়েছে।',
      name: 'আব্দুল হামিদ',
      farm: 'হামিদ ডেইরি · সিরাজগঞ্জ',
      stat: 'বকেয়া আদায় দ্বিগুণ',
    },
  ],
  trustItems: [
    { title: 'অফলাইনে চলে', body: 'ফোনে সেভ হয়, নেট এলে নিজে সিঙ্ক হয়।' },
    { title: 'কম ডেটা', body: 'ধীর নেটের জন্য বানানো। APK ২৭ MB।' },
    { title: 'প্রতিদিন ব্যাকআপ', body: 'রাতে ব্যাকআপ হয়। ডেটা বিক্রি হয় না।' },
    { title: 'ভূমিকাভিত্তিক', body: 'কর্মী এন্ট্রি দেন, লাভ দেখেন মালিক।' },
  ],
  faqEyebrow: 'প্রশ্ন',
  faqTitle: 'খামারিরা যা জিজ্ঞেস করেন',
  faqLead: 'নিশ্চিত নন? হোয়াটসঅ্যাপে বাংলায় উত্তর, সকাল ৯টা থেকে রাত ৯টা।',
  talk: 'খামার বিশেষজ্ঞের সাথে কথা',
  whatsapp: 'হোয়াটসঅ্যাপ · 01700-000000',
  messageUs: 'মেসেজ করুন',
  faqs: [
    {
      q: 'শেডে কি ইন্টারনেট লাগবে?',
      a: 'না। অ্যান্ড্রয়েড অ্যাপ ফোনে সেভ করে, নেট এলে নিজে সিঙ্ক হয়। ওয়েব ড্যাশবোর্ডে সর্বশেষ সিঙ্ক হওয়া সংখ্যা থাকে।',
    },
    {
      q: 'ম্যানেজার ও হিসাবরক্ষক কি একই খামার ব্যবহার করতে পারবেন?',
      a: 'হ্যাঁ। তাদের আমন্ত্রণ করুন এবং ভূমিকা দিন। কর্মী মৃত্যু ও খাবার লিখতে পারেন। লাভ মালিক দেখেন।',
    },
    {
      q: 'পোল্ট্রি ও ডেইরি দুটোই চলবে?',
      a: 'হ্যাঁ। ব্রয়লার, লেয়ার, সোনালি ও হাঁসের ব্যাচ, আর গরুর খাতা, সকাল-সন্ধ্যার দুধ ও প্রসব একসাথে থাকে।',
    },
    {
      q: 'ইনভয়েস ও হিসাব PDF-এ নামাতে পারব?',
      a: 'হ্যাঁ। বিক্রি থেকে ইনভয়েস PDF হয়, আর মাস শেষে হিসাব PDF ক্রেতা বা ব্যাংকে পাঠানো যায়।',
    },
    {
      q: 'খামারের তথ্য কি নিরাপদ?',
      a: 'প্রতি রাতে ব্যাকআপ হয়। কর্মী শুধু নিজের ভূমিকার এন্ট্রি দেখেন। খাতা অন্য কারও সাথে শেয়ার হয় না।',
    },
    {
      q: 'বাংলা ও ইংরেজি বদলানো যাবে?',
      a: 'হ্যাঁ। ফোন ও ওয়েব ড্যাশবোর্ডে একই ভাষা সুইচ। অঙ্ক ৳-এই থাকে।',
    },
  ],
  ctaEyebrow: 'ফ্রি অ্যান্ড্রয়েড অ্যাপ',
  ctaTitle: 'আজই হিসাব শেডে নিয়ে যান।',
  ctaBody: 'ওয়েবে অ্যাকাউন্ট খুলুন, ফোনে সাইন ইন করুন। একই খামার, একই সংখ্যা, সব জায়গায়।',
  downloadSize: 'APK ডাউনলোড · ২৭ MB',
  scan: 'স্ক্যান করে নামান',
  androidVer: 'অ্যান্ড্রয়েড ৮.০ বা তার বেশি',
  footerBlurb: 'বাংলাদেশে, যারা দেশকে খাওয়ান তাদের জন্য। ব্যাচ, দুধ, স্টক, বিক্রি ও হিসাব — বাংলা বা ইংরেজিতে।',
  footerTag: 'পোল্ট্রি ও ডেইরি, এক খাতা',
  footerCols: [
    { title: 'পণ্য', links: ['সুবিধা', 'অ্যান্ড্রয়েড অ্যাপ', 'ওয়েব ড্যাশবোর্ড', 'হিসাব ও ইনভয়েস', 'নতুন কী'] },
    { title: 'খামার', links: ['ব্রয়লার', 'লেয়ার ও ডিম', 'সোনালি ও হাঁস', 'ডেইরি', 'সমবায়'] },
    { title: 'সহায়তা', links: ['হেল্প সেন্টার', 'ভিডিও গাইড (বাংলা)', 'হোয়াটসঅ্যাপ', 'যোগাযোগ'] },
  ],
  getApp: 'অ্যাপ নিন',
  download: 'ডাউনলোড',
  androidApk: 'অ্যান্ড্রয়েড APK',
  open: 'খুলুন',
  webDash: 'ওয়েব ড্যাশবোর্ড',
  rights: '© ২০২৬ খামার ম্যানেজার। সর্বস্বত্ব সংরক্ষিত।',
  legal: ['গোপনীয়তা', 'শর্ত', 'কুকি'],
  goodMorning: 'সুপ্রভাত, করিম',
  saleSaved: 'বিক্রি সেভ হয়েছে',
  lowStock: 'কম স্টক',
  starterFeed: 'ব্রয়লার স্টার্টার · ১০ বস্তার ৩',
  eggsToday: 'আজকের ডিম',
  activeBatches: 'চলমান ব্যাচ',
  newSale: 'নতুন বিক্রি',
  buyer: 'ক্রেতা',
  owes: 'বকেয়া ৳১২,৪০০',
  weight: 'ওজন',
  rate: 'রেট / কেজি',
  saveSale: 'বিক্রি সেভ · SL-6383',
  weeklyFlow: 'সাপ্তাহিক নগদ',
  october: 'অক্টোবর',
};

export const landingCopy: Record<Locale, LandingCopy> = { en, bn };
