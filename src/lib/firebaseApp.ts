import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";

/**
 * Firebase app bootstrap without the Firestore *runtime*.
 *
 * Firestore is ~55 kB gzipped and every public page used to download and
 * evaluate it before first paint (the footer, auth restore and the analytics
 * trackers all touched `db`). Importing this module instead keeps the social
 * pages' initial JS small: `loadFirestore()` / `getDb()` pull the SDK in only
 * when a component actually needs a snapshot listener.
 */

const clean = (val?: string): string => {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
};

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export { app };

type FirestoreModule = typeof import("firebase/firestore");
let firestoreModulePromise: Promise<FirestoreModule> | null = null;

export function loadFirestore(): Promise<FirestoreModule> {
  if (!firestoreModulePromise) {
    firestoreModulePromise = import("firebase/firestore");
  }
  return firestoreModulePromise;
}

export async function getDb(): Promise<Firestore> {
  const { getFirestore } = await loadFirestore();
  return getFirestore(app);
}

type AuthModule = typeof import("firebase/auth");
let authModulePromise: Promise<AuthModule> | null = null;

export function loadAuthModule(): Promise<AuthModule> {
  if (!authModulePromise) {
    authModulePromise = import("firebase/auth");
  }
  return authModulePromise;
}

export async function getFirebaseAuth() {
  const { getAuth } = await loadAuthModule();
  return getAuth(app);
}

export async function getSocialProviders() {
  const mod = await loadAuthModule();
  const googleProvider = new mod.GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  const githubProvider = new mod.GithubAuthProvider();
  return { googleProvider, githubProvider };
}
