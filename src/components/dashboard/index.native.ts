/** Native stand-ins: the Android app keeps its own screens, and the web dashboard code stays out of the APK. */
const Empty = (_props: object) => null;

export const DashboardShell = Empty;
export const useDesktopWeb = () => false;
export const WebSignIn = Empty;
export const WebRegister = Empty;
export const WebBatch = Empty;
export const WebCustomers = Empty;
export const WebFarms = Empty;
export const WebHisab = Empty;
export const WebHome = Empty;
export const WebLivestock = Empty;
export const WebOrganization = Empty;
export const WebSales = Empty;
export const WebSell = Empty;
export const WebSettings = Empty;
export const WebStock = Empty;

export const isWebBuild = false;
