import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, Auth } from "firebase/auth";
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
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSyDvBozP-B9kN9obvqClhWN9zJGcNX2Nw4U",
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "portfolio-aa68d.firebaseapp.com",
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "portfolio-aa68d",
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "portfolio-aa68d.firebasestorage.app",
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "68031141787",
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:68031141787:web:9fae466a51db9ad0bc333e",
};

// Initialize Firebase safely for SSR & Client
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();

export default app;
