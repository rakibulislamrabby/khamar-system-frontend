import { Linking, Platform } from 'react-native';

const FILE_NAME = 'khamar-manager.apk';

export function downloadApk() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const anchor = document.createElement('a');
    anchor.href = `/${FILE_NAME}`;
    anchor.download = FILE_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  const site = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');
  if (site) {
    Linking.openURL(`${site}/${FILE_NAME}`);
  }
}
