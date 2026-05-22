# Laag Ta! ✈️

> **Dali, adventure awaits!** — Your universal travel companion, built in Cagayan de Oro, Philippines.

"Laag Ta!" means *"Let's go explore!"* in Bisaya/Cebuano — the language of Mindanao and the Visayas. It's the spirit of wandering with joy, and that's exactly what this app is about.

---

## Features

| Screen | What it does |
|--------|-------------|
| **Translate** | AI-powered translation via Claude. Voice + text input. Listen, copy, or save phrases. |
| **Phrases** | 360+ offline phrases across 8 languages in 6 categories. Works without internet. |
| **Nearby** | Find restaurants, hotels, pharmacies & more on a live map using your GPS. |
| **Currency** | Live exchange rates for PHP, USD, EUR, GBP, AUD, JPY, KRW, VND, THB, SGD. |
| **About** | App info, settings, and the story behind Laag Ta! |

---

## Running Locally

### Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 1. Install app dependencies

```bash
cd C:\Users\User\laag-ta
npm install
```

### 2. Generate app assets (icon & splash)

```bash
npm install canvas   # one-time install
npm run generate:assets
```

This creates `assets/icon.png`, `assets/splash.png`, and `assets/adaptive-icon.png`.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend URL
```

### 4. Start the backend locally

```bash
cd laagta-backend
npm install
cp .env.example .env
# Fill in your ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, EXCHANGE_RATES_API_KEY
npx vercel dev
# Backend runs at http://localhost:3000
```

### 5. Start the Expo app

```bash
# Back in the project root:
npx expo start
```

Scan the QR code with **Expo Go** on your phone. Make sure your phone and computer are on the same Wi-Fi network.

---

## Project Structure

```
laag-ta/
├── App.tsx                    # Root component
├── app.json                   # Expo config (bundle ID, permissions, plugins)
├── eas.json                   # EAS Build config (iOS + Android production)
├── src/
│   ├── constants/
│   │   ├── colors.ts          # Brand color system
│   │   ├── currencies.ts      # Currency metadata (symbols, flags, decimals)
│   │   └── phrases.ts         # 360+ offline phrases in 8 languages
│   ├── components/
│   │   └── LaagTaLogo.tsx     # Reusable logo with SVG airplane
│   ├── hooks/
│   │   └── usePhrasebook.ts   # AsyncStorage-backed saved phrases
│   ├── navigation/
│   │   └── TabNavigator.tsx   # Bottom tab bar
│   └── screens/
│       ├── TranslateScreen.tsx
│       ├── PhrasesScreen.tsx
│       ├── NearbyScreen.tsx
│       ├── CurrencyScreen.tsx
│       └── AboutScreen.tsx
├── laagta-backend/            # Node.js backend (deploys to Vercel)
│   ├── api/
│   │   ├── translate.js       # POST /api/translate → Claude
│   │   ├── nearby.js          # POST /api/nearby → Google Places
│   │   └── rates.js           # GET /api/rates → Open Exchange Rates
│   ├── vercel.json
│   └── .env.example
├── assets/                    # icon.svg, splash.svg (+ generated PNGs)
└── scripts/
    └── generate-assets.js     # Generates icon.png and splash.png
```

---

## Backend — Deploying to Vercel

### 1. Create a Vercel account

Sign up at [vercel.com](https://vercel.com) (free tier works).

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Deploy

```bash
cd laagta-backend
vercel
# Follow the prompts — select your account, create a new project
# Vercel will auto-detect Node.js functions in /api
```

### 4. Set environment variables on Vercel

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add GOOGLE_PLACES_API_KEY
vercel env add EXCHANGE_RATES_API_KEY
```

Or set them via the Vercel dashboard: Project → Settings → Environment Variables.

### 5. Deploy to production

```bash
vercel --prod
```

Your backend URL will be: `https://laagta-backend.vercel.app` (or your custom domain).

### 6. Update the app

In `eas.json` → `build.production.env`, set:
```json
"EXPO_PUBLIC_API_URL": "https://your-project.vercel.app"
```

---

## EAS Build — App Store & Google Play

### Prerequisites
- [EAS CLI](https://docs.expo.dev/eas-update/getting-started/): `npm install -g eas-cli`
- Expo account: [expo.dev](https://expo.dev)
- Apple Developer account (iOS): [developer.apple.com](https://developer.apple.com) — $99/year
- Google Play Console account (Android): [play.google.com/console](https://play.google.com/console) — $25 one-time

### 1. Log in & configure

```bash
eas login
eas build:configure
```

Update `eas.json` with your Apple credentials and `app.json` with your EAS project ID.

### 2. Build for iOS

```bash
eas build --platform ios --profile production
```

### 3. Build for Android

```bash
eas build --platform android --profile production
```

Builds run in the cloud — you'll get a download link when done (~15–30 min).

### 4. Submit to App Store

```bash
eas submit --platform ios --profile production
```

Requires Apple App Store Connect app already created with bundle ID `com.syvillegacutan.laagta`.

### 5. Submit to Google Play

```bash
eas submit --platform android --profile production
```

Requires a Google Play service account JSON key at `./google-service-account.json`.

---

## API Keys You Need

| Key | Service | Where to Get |
|-----|---------|--------------|
| `ANTHROPIC_API_KEY` | Claude AI (translation) | [console.anthropic.com](https://console.anthropic.com) |
| `GOOGLE_PLACES_API_KEY` | Google Places (nearby) | [console.cloud.google.com](https://console.cloud.google.com) |
| `EXCHANGE_RATES_API_KEY` | Open Exchange Rates | [openexchangerates.org](https://openexchangerates.org) |
| `GOOGLE_MAPS_API_KEY` | Google Maps (Android map) | Same Google Cloud project, enable Maps SDK |

---

## Notes on react-native-maps (Android)

React Native Maps uses Google Maps on Android. You need to add your Google Maps API key to `app.json`:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

On iOS, Apple Maps is used by default — no additional key needed.

---

## About

Built with ❤️ by **Syville Gacutan** in Cagayan de Oro, Philippines.  
Solo designed and developed. *Gihimo nako ni para sa atong mga maghilaagay!*

---

## Quick Command Reference

```bash
# Run locally with Expo Go
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator
npx expo start --ios

# Deploy backend to Vercel
cd laagta-backend && vercel --prod

# Build iOS production
eas build --platform ios --profile production

# Build Android production
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```
