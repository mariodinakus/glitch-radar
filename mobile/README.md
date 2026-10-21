# GLITCH RADAR Native – Expo / React Native

This is a **native mobile client**, not a website shortcut or WebView-only wrapper. Main screens, topics, radar, saved news, login, profile and alerts are React Native. The **Desk** tab opens the full Vercel analytical dashboard in an embedded WebView for advanced instruments.

## Expo ownership
An Expo account exists, but no Expo account API connection or EAS project ID is currently available to the assistant. The repo intentionally does **not** copy the project ID of the separate MONO Kairos app. To associate with your existing Expo account:
```bash
cd mobile
npm install
npm run assets
npx eas-cli login
npx eas-cli init
npx eas-cli update:configure
npx eas-cli build --platform android --profile preview
```
On EAS init the app creates/links its **own** Expo project. Store its projectId as `EXPO_PUBLIC_EAS_PROJECT_ID` (for native push and EAS Update); `EXPO_PUBLIC_EAS_OWNER` is optional. The CLI may update app config directly; use the project ID from the created project, not another app. Configure EAS Environment Variables for EXPO_PUBLIC_EAS_PROJECT_ID and Supabase PUBLIC values. `npx eas-cli update --branch production --message "..." ` publishes a compatible JS update after linking (EAS Update is **not** the same as automatic GitHub commits; new native dependencies require a new APK).

## Android installation
The GitHub Action [Android APK](../.github/workflows/android-apk.yml) compiles a standalone installable Android release from this mobile project on every mobile commit. Download the `GLITCH-RADAR-Android-APK` artifact from its completed Actions run. This is a debug-key-signed preview release **not a Play Store release**. It is separate from remote EAS Build and doesn't authenticate to your Expo account.

## Data and profiles
The native Radar retrieves `/api/feed` from the existing Vercel backend with timeouts. Guest users can read and save news. Account login needs the **same Supabase project** as the web app, with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, redirect `glitchradar://auth/callback`, and [web schema](../supabase/schema.sql). Put no service-role keys in native bundles.

## Native Push
The app requests permission only after user taps Enable Push, signs them in and uploads their own Expo push token to the authenticated `/api/push/native` backend. To enable, run [native-push.sql](../supabase/native-push.sql) in Supabase, set Vercel service-role credentials, and configure EAS project ID and Android FCM credentials in the Expo project. The server cron sends to token owners whose alert preferences match. On Android SDK53+ remote notifications do **not** work in Expo Go; use the APK/development build. Currently the Vercel cron is daily, so it is not real-time breaking news on Hobby.

## Safety
The mobile app never embeds Supabase secret keys, Expo access tokens or VAPID private keys. A valid authenticated user session is checked server-side for push token registration. Live web data always comes from the public API. Offline, the cached last feed can be viewed, clearly marked stale.
