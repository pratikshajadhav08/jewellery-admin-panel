import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence is available at runtime for React Native auth persistence.
// Some Firebase type bundles omit it, so keep the import isolated here.
// @ts-expect-error React Native persistence export is present at runtime.
import { getReactNativePersistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

const missingKeys = requiredKeys.filter((key) => !process.env[key]);

export const firebaseConfigError =
  missingKeys.length > 0
    ? `Missing Firebase config: ${missingKeys.join(', ')}. Copy .env.example to .env and fill in your Firebase web app values.`
    : null;

export const isFirebaseConfigured = firebaseConfigError === null;

function createApp() {
  if (!isFirebaseConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const app: FirebaseApp | null = createApp();
export const db: Firestore | null = app ? getFirestore(app) : null;

function createAuth() {
  if (!app) return null;
  if (Platform.OS === 'web') return getAuth(app);

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth | null = createAuth();

export function requireDb() {
  if (!db) {
    throw new Error(firebaseConfigError ?? 'Firestore is not initialized.');
  }
  return db;
}

export function requireAuth() {
  if (!auth) {
    throw new Error(firebaseConfigError ?? 'Firebase Auth is not initialized.');
  }
  return auth;
}
