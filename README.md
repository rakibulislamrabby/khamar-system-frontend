# Khamar Manager frontend

One Expo project, two separate apps. Both use the same backend.

| Target | What you get | Command (from `frontend/`) | Port |
| --- | --- | --- | --- |
| Web | Landing page → sign in / register → desktop web dashboard | `npm run web` | 8081 |
| Native (Android) | Mobile app only: sign in → mobile home. No landing page, no web dashboard | `npm run native` | 8082 |

The same commands work from the repo root (`npm run web`, `npm run native`, `npm run backend`).
Web and native use different ports, so you can run both at once.

`npm run native` sets `EXPO_PUBLIC_APP_TARGET=native`. If you press `w` or open http://localhost:8082 in a browser, you get the **mobile app** in a phone-sized frame, not the website. That's handy for a quick check without a phone.

## Run locally

1. Install dependencies once: `npm install` in `backend/` and in `frontend/`.
2. Start the backend: `npm run backend` from the repo root (API on `http://localhost:5000/api`).
3. Start what you need:
   - **Web:** `npm run web`, then open http://localhost:8081.
   - **Android phone (Expo Go):** `npm run native`, then scan the QR code with the Expo Go app. The phone and this PC must be on the same Wi-Fi.
   - **Android emulator:** `npm run native:emulator`.
   - **Phone over USB, native build:** `npm run native:usb` (needs Android SDK and `adb`).

## Backend URL

`.env.local` sets `EXPO_PUBLIC_API_URL=http://localhost:5000/api`.

- Web uses it as is.
- On a phone, `localhost` would be the phone itself, so `src/api/client.ts` swaps it for this PC's LAN IP, the same one Metro uses (for example `http://192.168.0.103:5000/api`). The emulator uses `10.0.2.2`.
- To point the native app at another server, set `EXPO_PUBLIC_NATIVE_API_URL` (for example `https://khamar-system.vercel.app/api`).

### Phone can't connect?

Ubuntu's firewall (`ufw`) blocks incoming connections by default, so the phone can't reach Metro (8082) or the backend (5000). Allow them once:

```bash
sudo ufw allow from 192.168.0.0/16 to any port 5000 proto tcp
sudo ufw allow from 192.168.0.0/16 to any port 8081:8082 proto tcp
```

Then check, in this order:

1. `npm run backend` is running. Open `http://<PC LAN IP>:5000/health` in the phone's browser and confirm it returns JSON.
2. The phone is on the same Wi-Fi as the PC, not mobile data or a guest network.
3. You opened the QR code in **Expo Go**. `npm run native` doesn't feed an installed APK; an APK from `npm run apk` runs on its own and only needs the backend.

## Build an installable APK (no EAS account)

```bash
npm run apk                          # backend at http://<this PC's LAN IP>:5000/api
npm run apk -- https://my.api/api    # any backend URL
npm run apk -- --install             # also install on the USB-connected phone
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

## How the split works

- `src/lib/app-target.ts` decides website or mobile app: Android is always the mobile app, and the browser is too when `EXPO_PUBLIC_APP_TARGET=native`.
- `src/app/index.tsx` shows the landing page (`landing-page.web.tsx`) on the website; the mobile app goes through `mobile-entry.tsx` to sign-in or home. Sign-in and register pick the mobile or web screen the same way.
- `src/components/dashboard/index.ts` exports the web dashboard. On Android, `index.native.ts` replaces every dashboard screen with an empty placeholder, so none of the dashboard code ships in the APK.
