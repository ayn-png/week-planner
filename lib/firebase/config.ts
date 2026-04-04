import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use explicit literal property access so Next.js can statically inline the
// values into the client bundle. Dynamic bracket notation (process.env[key])
// is NOT replaced by Next.js and will be undefined in the browser.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate on the server only — on the client the values are already baked
// into the bundle by Next.js at build/boot time.
if (typeof window === 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => `NEXT_PUBLIC_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
  if (missing.length > 0) {
    console.error(
      '[Firebase] Missing env vars — add them to .env.local:\n' +
        missing.map((k) => `  - ${k}`).join('\n')
    );
  }
}

// Guard against double-initialization in Next.js HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
