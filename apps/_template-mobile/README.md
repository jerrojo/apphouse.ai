# PRISMA Mobile Template

**Expo 51 · React Native · TypeScript · iOS · Android · Huawei AppGallery**

This is the official PRISMA mobile template. When you create a new **Mobile** or **Full-stack** project in PRISMA, this template is automatically scaffolded into `apps/<your-slug>/` in the monorepo.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo 51 (SDK 51) + Expo Router 3 |
| Language | TypeScript 5 |
| Navigation | Expo Router (file-based) |
| State | Zustand + TanStack Query |
| Backend | Supabase (auth, DB, storage) |
| Animations | React Native Reanimated 3 |
| Gestures | React Native Gesture Handler 2 |
| Design tokens | `src/lib/theme.ts` — mirrors PRISMA web system |
| Multi-store | iOS App Store · Google Play · Huawei AppGallery |

---

## Platform Support

### iOS
Standard Expo build via EAS. Requires Apple Developer account.

```bash
pnpm build:ios      # EAS cloud build
pnpm submit:ios     # Submit to App Store Connect
```

### Android (Google Play)
Standard Expo build via EAS. Requires Google Play Console account.

```bash
pnpm build:android  # EAS cloud build (AAB)
pnpm submit:android # Submit to Google Play
```

### Huawei AppGallery (HMS)
Builds an APK without Google Play Services using the `huawei` EAS profile.
The `src/lib/hms.ts` compatibility layer auto-detects HMS and routes push notifications, location, and maps to Huawei's equivalents.

```bash
pnpm build:huawei   # EAS cloud build (APK, HMS_ENABLED=true)
# Then upload the APK manually to AppGallery Connect
```

**To add full HMS support:**
1. Register your app at [developer.huawei.com](https://developer.huawei.com)
2. Download `agconnect-services.json` and place it in the project root
3. Install HMS packages:
   ```bash
   npx expo install @hmscore/react-native-hms-push @hmscore/react-native-hms-location
   ```
4. Uncomment the HMS code blocks in `src/lib/hms.ts`

---

## Project Structure

```
app/
  _layout.tsx          ← Root layout (navigation shell)
  index.tsx            ← Entry point → HomeScreen
  (tabs)/              ← Tab navigation (add tabs here)
    _layout.tsx
    home.tsx
    profile.tsx

src/
  screens/             ← Screen components
    home.tsx           ← Home / dashboard screen
  lib/
    theme.ts           ← PRISMA design tokens (colors, typography, spacing)
    hms.ts             ← Huawei HMS compatibility layer
    supabase.ts        ← Supabase client

assets/                ← App icons, splash screen
```

---

## Design System

All design tokens live in `src/lib/theme.ts`. Use them everywhere:

```tsx
import { colors, typography, spacing, radius, shadows } from "@/lib/theme";

<View style={{
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
  padding: spacing["4"],
  ...shadows.md,
}}>
  <Text style={{ color: colors.foreground, fontSize: typography.base }}>
    Hello PRISMA
  </Text>
</View>
```

The token system mirrors the PRISMA web design system so your mobile app feels like a native extension of the web platform.

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run on iOS simulator
pnpm dev:ios

# Run on Android emulator
pnpm dev:android
```

---

## Customization Checklist

- [ ] Update `app.json`: `name`, `slug`, `bundleIdentifier`, `package`
- [ ] Replace `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png`
- [ ] Update `src/lib/supabase.ts` with your Supabase project URL and anon key
- [ ] Build your screens in `src/screens/` using the design tokens
- [ ] Add tab navigation in `app/(tabs)/` as needed
- [ ] Configure push notifications (FCM for Android/iOS, HMS for Huawei)
- [ ] Set up EAS project ID in `app.json` → `extra.eas.projectId`
