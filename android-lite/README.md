# GLITCH RADAR Native Android (fast APK)

This is a separately installable **native Android APK** with Java/Android SDK UI, a news radar, category filters, live source updates, persistent saved articles, search, and direct links into the complete GLITCH RADAR dashboard/account.

This is the lightweight fallback to the full Expo/React Native client in `mobile/`. It compiles without Gradle, Kotlin, Android Gradle Plugin or React Native's heavy NDK build. It **does not provide native push yet** (the full Expo app supports registration after external configuration).

- CI: `.github/workflows/native-android-apk.yml`
- Output: `GLITCH-RADAR-INSTALLABLE-APK` under GitHub Actions Artifacts
- Android app ID: `com.mariodinakus.glitchlite` (separate from the Expo app for conflict-free installations)
- Source API: `https://glitch-radar-github.vercel.app/api/feed`
- Local bookmarks/cache use Android SharedPreferences.
- GitHub Actions signs preview builds using a generated temporary key. Reinstalling the app from a newly generated build may require uninstalling the previous build; saved local content is then cleared. Configure a permanent private signing key before public release.
- The app opens account settings in the external GLITCH web dashboard. It does not claim Expo-linked account or real-time push configuration.

## v2.0 Android 2026 install-compatibility fix
- Targets Android 16 / API 36, supports Android API 24+.
- Uses a **new unique application ID** `com.mariodinakus.glitchradar2026` to avoid installation collisions with preview APKs signed by an unrelated temporary key.
- APK manifest metadata and signature checked at build time; CI additionally runs an actual Android 15 emulator install test.
- **Installer notice:** This is a separately signed test build. Future CI builds use different temporary signing keys and cannot automatically replace this build. For permanent updates configure an Android upload/signing keystore stored privately in GitHub Actions Secrets or use authenticated Expo EAS.
- Do not claim native push/profile on this lite client; it opens web account settings.
