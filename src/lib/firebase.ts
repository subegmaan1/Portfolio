import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | undefined;
let dbInstance: Firestore | undefined;

try {
  const metaEnv = (import.meta as any).env || {};
  const config = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || fallbackConfig?.apiKey,
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig?.authDomain,
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || fallbackConfig?.projectId,
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig?.storageBucket,
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig?.messagingSenderId,
    appId: metaEnv.VITE_FIREBASE_APP_ID || fallbackConfig?.appId,
  };

  const firestoreDatabaseId = metaEnv.VITE_FIRESTORE_DATABASE_ID || fallbackConfig?.firestoreDatabaseId;

  if (config.apiKey && config.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase initialization notice (running with resilient local storage fallback):', err);
}

export const db = dbInstance as Firestore;
export default app;

