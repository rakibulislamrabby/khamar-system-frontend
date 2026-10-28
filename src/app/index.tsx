import { LandingPage } from '@/components/landing-page';
import { MobileEntry } from '@/components/mobile-entry';
import { isMobileApp } from '@/lib/app-target';

/** Website: landing page. Mobile app (Android, or `npm run native` in a browser): sign-in or home. */
export default function Index() {
  return isMobileApp ? <MobileEntry /> : <LandingPage />;
}
