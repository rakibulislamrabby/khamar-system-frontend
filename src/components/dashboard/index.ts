/**
 * Desktop web dashboard (Figma "Web dashboard · 1440").
 * Android resolves `index.native.ts` instead, so none of this ships in the APK.
 */
export { DashboardShell, useDesktopWeb } from '@/components/dashboard/shell';
export { WebSignIn, WebRegister } from '@/components/dashboard/screens/auth';
export { WebBatch } from '@/components/dashboard/screens/batch';
export { WebCustomers } from '@/components/dashboard/screens/customers';
export { WebFarms } from '@/components/dashboard/screens/farms';
export { WebHisab } from '@/components/dashboard/screens/hisab';
export { WebHome } from '@/components/dashboard/screens/home';
export { WebLivestock } from '@/components/dashboard/screens/livestock';
export { WebOrganization } from '@/components/dashboard/screens/organization';
export { WebSales } from '@/components/dashboard/screens/sales';
export { WebSell } from '@/components/dashboard/screens/sell';
export { WebSettings } from '@/components/dashboard/screens/settings';
export { WebStock } from '@/components/dashboard/screens/stock';

export const isWebBuild = true;
