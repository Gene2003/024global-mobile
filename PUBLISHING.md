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

## 1. Replace the placeholder app icon & splash (REQUIRED before store review)

The app currently ships the default Expo icon/splash (a React logo) — Apple/Google will reject or it will look unbranded. Replace these files with **your** 024 Global Connect branding, keeping the same filenames/paths:

- `assets/images/icon.png` — **1024×1024**, no transparency (App Store + base icon)
- `assets/images/splash-icon.png` — ~1284×2778 or a centered logo on transparent bg
- `assets/images/android-icon-foreground.png` / `-background.png` / `-monochrome.png` — Android adaptive icon layers
- `assets/images/favicon.png` — web

Tip: put your 1024px logo art in and run `npx expo-doctor` to validate. (The brand logo used on the Home screen lives at `assets/home/logo.png` but is only 200×200 — too small for the app icon; export a 1024px version.)

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

## Backend deploy (required for the new dashboards to work)

The mobile app now uses new backend endpoints (transporter bookings, real password reset, affiliate listing verification). Deploy the Django backend and run migrations:

```bash
# on the server / Render deploy
python manage.py migrate services   # applies 0005_add_in_transit_status
```

New/changed API endpoints: `/api/service-bookings/` (+ `/accept/ /pickup/ /deliver/ /decline/`), `/api/users/password/reset/` (+ `/confirm/`), `/api/users/agent/pending-listings/`, `/api/users/agent/listings/<id>/verify/`.

The password-reset email links to `FRONTEND_URL/reset-password?uid=…&token=…`, so make sure the **web** app has a reset-password page that POSTs to `/api/users/password/reset/confirm/` (the API is ready).

## Still recommended before launch

- Brand icon/splash (section 1 above).
- Confirm SMTP/email env vars are set on the backend so password-reset emails actually send.
