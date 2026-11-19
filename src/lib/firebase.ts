import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const clean = (val?: string): string => {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "") // remove quotes if pasted
    .replace(/[^\x20-\x7E]/g, "") // remove non-printable ASCII / newlines \r \n \t
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

// Initialize Firebase safely for SSR & Client
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db: Firestore = getFirestore(app);

// Auth is loaded on demand: importing firebase/auth eagerly pulls ~88 kB of JS
// and starts the cross-origin auth iframe on every public page.
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

export default app;
