# 📱 Daddy Client — Setup Guide

Daddy's personal portal to receive calls and messages from Empy.  
Built as a Progressive Web App (PWA) — install it on your phone's home screen!

---

## 🚀 Step 1: Get ZegoCloud App ID

1. Go to [console.zegocloud.com](https://console.zegocloud.com)
2. Open your project → **Project Settings**
3. Copy the **AppID** (a 10-digit number e.g. `1234567890`)
4. Your Server Secret is already pre-filled: `0ba973aa2322bc1af61354aff598c4cd`

---

## 🔥 Step 2: Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database** (Start in production mode)
4. Enable **Storage**
5. Enable **Cloud Messaging** (for push notifications)
6. Go to **Project Settings → Your apps → Add app (Web)**
7. Copy the config values into `daddy-client/.env.local`

### Firestore Security Rules (paste in Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{msg} {
      allow read, write: if true;  // Personal family app — both users trusted
    }
    match /calls/{call} {
      allow read, write: if true;
    }
  }
}
```

### Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /voice-messages/{file} {
      allow read, write: if true;
    }
  }
}
```

### VAPID Key (for push notifications):
- Firebase Console → Project Settings → Cloud Messaging → **Web Push certificates**
- Click **Generate key pair** → copy the key into `VITE_FIREBASE_VAPID_KEY`

---

## ⚙️ Step 3: Configure .env.local

Edit `daddy-client/.env.local` with your values:
```env
VITE_ZEGO_APP_ID=1234567890         ← your numeric App ID
VITE_ZEGO_SERVER_SECRET=0ba973aa2322bc1af61354aff598c4cd
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=your-project
# ... etc
```

**Also update** `public/firebase-messaging-sw.js` with the same Firebase config values (required for background push notifications — service workers can't read env vars).

---

## 🖥️ Step 4: Run locally or deploy

### Run locally:
```bash
cd daddy-client
npm install
npm run dev
# Opens at http://localhost:5174
```

### Deploy to Vercel (FREE — recommended for phone install):
```bash
cd daddy-client
npm install -g vercel
vercel deploy
```
Or push this `daddy-client/` folder to a GitHub repo and connect it to [vercel.com](https://vercel.com).

---

## 📱 Step 5: Install on your phone

Once deployed, open the URL in your phone's browser:

**Android (Chrome):**
- Tap the 3-dot menu → **Add to Home Screen**

**iPhone (Safari):**
- Tap the Share icon → **Add to Home Screen**

---

## 🔔 How calling works

1. **Empy calls** → Firestore gets a `calls` document with `status: "ringing"`
2. **Your app** shows the incoming call overlay with ringtone
3. **You tap Accept** → ZegoCloud connects you both in room `empy-daddy-room`
4. **You call back** → Same flow in reverse — Empy's app shows incoming call
5. All audio/video goes through ZegoCloud's WebRTC infrastructure

---

## 📝 Notes

- Both Empy's app and Daddy's app share the **same Firebase project** and **same ZegoCloud credentials**
- Messages are stored in Firestore → real-time sync across both devices
- Voice messages → stored in Firebase Storage
- Push notifications work when the app is installed as PWA and browser is closed
