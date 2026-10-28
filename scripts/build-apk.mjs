#!/usr/bin/env node
/**
 * Builds an installable release APK on this machine (no EAS account needed).
 *
 *   npm run apk                          -> backend at http://<this PC's LAN IP>:5000/api
 *   npm run apk -- https://my.api/api    -> any backend URL
 *   npm run apk -- --install             -> also installs on the USB-connected phone (adb)
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const install = args.includes('--install');
const urlArg = args.find((a) => /^https?:\/\//.test(a));

function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal && /^(192\.168|10)\./.test(net.address)) return net.address;
    }
  }
  return null;
}

const apiUrl = urlArg ?? process.env.EXPO_PUBLIC_NATIVE_API_URL ?? (lanIp() && `http://${lanIp()}:5000/api`);
if (!apiUrl) {
  console.error('Could not detect a LAN IP. Pass the backend URL: npm run apk -- http://192.168.x.x:5000/api');
  process.exit(1);
}

const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_NATIVE_API_URL: apiUrl, NODE_ENV: 'production' } });

console.log(`\nBuilding APK with backend: ${apiUrl}\n`);
if (!existsSync(join(root, 'android'))) run('npx expo prebuild --platform android --no-install');
run(process.platform === 'win32' ? 'gradlew.bat assembleRelease' : './gradlew assembleRelease', join(root, 'android'));

const apk = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
console.log(`\nAPK ready: ${apk}`);
if (install) run(`adb install -r "${apk}"`);
