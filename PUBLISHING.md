# 024 Global Connect — Store Publishing Guide

This app is built with **Expo (managed) + EAS Build**. You build the store binaries in the cloud, then submit them to the Apple App Store and Google Play. You do **not** need a Mac.

---

## 0. One-time prerequisites (you must do these — they cost money / require your identity)

| Requirement | Where | Cost |
|---|---|---|
| **Apple Developer Program** account | https://developer.apple.com/programs/ | $99 / year |
| **Google Play Console** account | https://play.google.com/console/signup | $25 one-time |
| **Expo account** (for EAS) | https://expo.dev | free tier is fine |
| EAS CLI | `npm i -g eas-cli` then `eas login` | free |

The app is already linked to an EAS project (`extra.eas.projectId` in `app.json`). If that project belongs to a different Expo account than yours, run `eas init` to relink.

---

## 1. App icon & splash — DONE (uses the 024 logo)

The app icon, splash, and Android adaptive icon are now generated from the official **024 Global logo** (`assets/images/icon.png`, `splash-icon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`, `favicon.png`). Run `npx expo-doctor` to validate before building. If you have a higher-resolution logo, drop it in and regenerate.

## 1b. Payments — Paystack

The mobile app takes payment through **Paystack** (same provider as the website), which supports **M-Pesa and card/bank** on its secure page. Make sure Paystack is in **live** mode (not test) before release. No extra app config is needed beyond the backend's existing `PAYSTACK_SECRET_KEY`.

---

## 2. Point the app at your PRODUCTION backend

`lib/api.ts` → `BASE_URL` is currently:

```
https://gonzaga-u98x.onrender.com/api
```

Confirm that is your live production API (with HTTPS — required by both stores). Update if you have a different production domain.

---

## 3. Build the binaries

```bash
cd 024global-mobile
eas login

# Android (produces an .aab for Play Store)
eas build --platform android --profile production

# iOS (produces an .ipa; EAS will prompt to create signing certs for you)
eas build --platform ios --profile production
```

The `production` profile already exists in `eas.json` with `autoIncrement`, so build/version numbers bump automatically. Builds run in the cloud; you'll get a download link and they're also stored on expo.dev.

---

## 4. Submit to the stores

```bash
# Google Play  (first submission: see note below)
eas submit --platform android --profile production --latest

# Apple App Store
eas submit --platform ios --profile production --latest
```

**Google first-submission note:** Google Play requires the *very first* build to be uploaded manually through the Play Console UI (create the app, upload the `.aab`, fill the store listing). After that, `eas submit` works for updates. You'll also need a Google service-account JSON key for automated submits — EAS walks you through it.

**Apple note:** `eas submit` uploads to App Store Connect; you then complete the listing (screenshots, description, privacy) and hit "Submit for Review" there.

---

## 5. Store listing assets you'll need to prepare

- **Screenshots** (both stores): capture the app in a simulator/device — the Home, Products, a dashboard, and one in dark mode make a strong set.
- **Privacy Policy URL** (required by both). The app collects account data (name, email, phone) and processes payments, so this is mandatory.
- Short + full description, category (Shopping / Business), content rating questionnaire.
- **Data safety form** (Google) / **App Privacy** (Apple): declare that you collect name, email, phone, and payment info.

---

## What's already handled in the code

- ✅ `app.json`: display name "024 Global Connect", iOS `bundleIdentifier` + `buildNumber`, Android `package` (`com.global024.app`), `ITSAppUsesNonExemptEncryption:false` (skips the export-compliance prompt).
- ✅ `eas.json`: development / preview / production profiles.
- ✅ Light + dark mode, adaptive to system, with an in-app toggle.
- ✅ No non-HTTPS network calls.

## Backend deploy (required for the mobile features to work)

The mobile app is fully **isolated** from the website: it only calls mobile-namespaced endpoints (`/api/mobile/products/…`, `/api/users/mobile/…`, `/api/orders/mobile/…`, plus new tracking/booking endpoints). The website's shared endpoints (`/api/products/`, `/api/users/me/`, `/api/users/password/reset/`) are unchanged.

Deploy the Django backend and run migrations:

```bash
# on the server / Render deploy
python manage.py migrate            # applies services 0005, users 0020, products 0013, orders 0018
```

Then confirm Paystack is in live mode (section 1b) and SMTP env vars are set for password-reset emails.

## Still recommended before launch

- Confirm Paystack live keys are active so real payments go through.
- Prepare a Privacy Policy URL and store screenshots (Home, Market, a dashboard, one in dark mode).
