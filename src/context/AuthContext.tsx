"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import type { User, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, loadAuthModule, getFirebaseAuth, getSocialProviders } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  isApproved: boolean;
  provider: "password" | "google" | "github";
  createdAt: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; isApproved: boolean; message: string }>;
  signInWithGoogle: () => Promise<UserProfile>;
  signInWithGithub: () => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Local hint that a session may exist. Public pages only load the auth bundle
// when this is set, so anonymous visitors never pay for firebase/auth.
const AUTH_HINT_KEY = "mts_auth_session";

const hasAuthHint = () => {
  try {
    return typeof window !== "undefined" && localStorage.getItem(AUTH_HINT_KEY) === "1";
  } catch {
    return false;
  }
};

const setAuthHint = (value: boolean) => {
  try {
    if (value) localStorage.setItem(AUTH_HINT_KEY, "1");
    else localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    // Storage can be blocked (private mode); the header simply stays signed out.
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Guard ref: true while a social popup is active
  // Prevents onAuthStateChanged from firing early signOut mid-popup
  const isSocialAuthInProgress = useRef<boolean>(false);
  const startAuthListenerRef = useRef<(() => void) | null>(null);

  // Helper to fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (err: any) {
      console.warn("Notice fetching user profile:", err?.message || err);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    const auth = await getFirebaseAuth();
    if (auth.currentUser) {
      const profile = await fetchUserProfile(auth.currentUser.uid);
      setUserProfile(profile);
    }
  };

  const INITIAL_SUPER_ADMIN_EMAIL = (
    process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || "malithatishamal@gmail.com"
  ).toLowerCase().trim();

  const isInitialAdmin = (email: string) => {
    if (!email) return false;
    return email.toLowerCase().trim() === INITIAL_SUPER_ADMIN_EMAIL;
  };

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      if (unsubscribe || cancelled) return;
      const mod = await loadAuthModule();
      if (cancelled || unsubscribe) return;
      const auth = await getFirebaseAuth();
      if (cancelled || unsubscribe) return;

      unsubscribe = mod.onAuthStateChanged(auth, async (fbUser) => {
        // If a social popup flow is in-flight, skip onAuthStateChanged to prevent race conditions
        if (isSocialAuthInProgress.current) {
          setLoading(false);
          return;
        }

        if (fbUser) {
          const cleanEmail = (fbUser.email || "").toLowerCase().trim();
          const usesPassword = fbUser.providerData.some((p) => p.providerId === "password");

          // Password accounts must confirm their email before any session is
          // accepted. Social providers verify the address themselves.
          if (usesPassword && !fbUser.emailVerified) {
            await mod.signOut(auth);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          let profile = await fetchUserProfile(fbUser.uid);
          const isSuper = isInitialAdmin(cleanEmail);

          // Auto-approve the initial super admin so they can access the admin panel to approve others
          if (isSuper && fbUser.emailVerified && profile && (!profile.isApproved || profile.status !== "approved" || profile.role !== "admin")) {
            try {
              await updateDoc(doc(db, "users", fbUser.uid), {
                role: "admin",
                status: "approved",
                isApproved: true,
                updatedAt: serverTimestamp(),
              });
              profile = {
                ...profile,
                role: "admin",
                status: "approved",
                isApproved: true,
              };
            } catch (e) {
              console.warn("Could not auto-approve initial super admin:", e);
            }
          }

          // If no profile document or if not approved, strictly reject session (no auto-login)
          if (!profile || profile.status === "rejected" || profile.status !== "approved" || !profile.isApproved) {
            await mod.signOut(auth);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          setUser(fbUser);
          setUserProfile(profile);
          setAuthHint(true);
        } else {
          setUser(null);
          setUserProfile(null);
          setAuthHint(false);
        }
        setLoading(false);
      });
    };
    startAuthListenerRef.current = () => void start();

    // Admin routes need the session right away to guard the panel. Public
    // pages only restore an existing session (and therefore only load the
    // auth chunk) when this browser has signed in before.
    const isAdminRoute =
      typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined") {
      if (isAdminRoute) {
        void start();
      } else if (!hasAuthHint()) {
        setLoading(false);
      } else if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => void start(), { timeout: 2500 });
      } else {
        timerId = setTimeout(() => void start(), 1500);
      }
    }

    return () => {
      cancelled = true;
      startAuthListenerRef.current = null;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
      unsubscribe?.();
    };
  }, []);

  // Idle session timeout: signed-in accounts are signed out after 30 minutes
  // without interaction, limiting the window for an unattended admin session.
  const endSession = async () => {
    const mod = await loadAuthModule();
    const auth = await getFirebaseAuth();
    await mod.signOut(auth);
    setAuthHint(false);
  };

  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    let lastMark = 0;

    const reset = () => {
      const now = Date.now();
      if (now - lastMark < 5000) return;
      lastMark = now;
      clearTimeout(timer);
      timer = setTimeout(() => {
        void endSession();
      }, IDLE_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    timer = setTimeout(() => {
      void endSession();
    }, IDLE_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [user]);

  // Email/Password Sign Up -> verification email, ROLE: ADMIN, STATUS: PENDING, NO AUTO-LOGIN
  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } =
      await loadAuthModule();
    const auth = await getFirebaseAuth();
    const cleanEmail = email.toLowerCase().trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    try {
      await sendEmailVerification(cred.user);
    } catch (verifyErr) {
      console.warn("Could not send verification email:", verifyErr);
    }

    const isSuper = isInitialAdmin(cleanEmail);

    // Even the bootstrap admin starts pending: the profile is promoted by the
    // verified owner on first successful sign-in (see the auth listener).
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      photoURL: cred.user.photoURL || "",
      role: "admin",
      status: "pending",
      isApproved: false,
      provider: "password",
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "users", cred.user.uid), newProfile);
    } catch (setErr: any) {
      console.error("Firestore user profile save error:", setErr);
      if (setErr.code === "permission-denied") {
        throw new Error("Firestore permission denied. Please update your Firestore Security Rules in Firebase Console.");
      }
      throw setErr;
    }

    // New accounts must verify their email and be approved: no auto-login.
    await signOut(auth);
    setUser(null);
    setUserProfile(null);

    return {
      success: true,
      isApproved: false,
      message: isSuper
        ? "Account created! Check your inbox for the verification link, then sign in."
        : "Account created! Confirm your email address, then wait for administrator approval before you can sign in.",
    };
  };

  // Email/Password Sign In -> CHECKS VERIFICATION + APPROVAL
  const signInWithEmail = async (email: string, pass: string) => {
    const { signInWithEmailAndPassword, sendEmailVerification, signOut } = await loadAuthModule();
    const auth = await getFirebaseAuth();
    const cleanEmail = email.toLowerCase().trim();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);

    if (!cred.user.emailVerified) {
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Ignore; the account simply cannot sign in yet.
      }
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      throw new Error(
        "Please verify your email address first. We sent a fresh verification link to your inbox."
      );
    }

    let profile = await fetchUserProfile(cred.user.uid);
    const isSuper = isInitialAdmin(cleanEmail);

    if (!profile) {
      profile = {
        uid: cred.user.uid,
        name: cred.user.displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        photoURL: cred.user.photoURL || "",
        role: "admin",
        status: isSuper ? "approved" : "pending",
        isApproved: isSuper,
        provider: "password",
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, "users", cred.user.uid), profile);
      } catch (setErr: any) {
        console.error("Firestore user profile save error:", setErr);
      }
    }

    if (isSuper && (!profile.isApproved || profile.status !== "approved" || profile.role !== "admin")) {
      try {
        await updateDoc(doc(db, "users", cred.user.uid), {
          role: "admin",
          status: "approved",
          isApproved: true,
          updatedAt: serverTimestamp(),
        });
        profile = {
          ...profile,
          role: "admin",
          status: "approved",
          isApproved: true,
        };
      } catch (e) {
        console.warn("Could not auto-approve initial super admin:", e);
      }
    }

    // Check approval status
    if (profile.status === "rejected") {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      throw new Error("Your account has been rejected or suspended by the administrator.");
    }

    if (profile.status !== "approved" || !profile.isApproved) {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      throw new Error("Your account is pending administrator approval. Please wait until an administrator approves your account.");
    }

    setUser(cred.user);
    setUserProfile(profile);
    setAuthHint(true);
    startAuthListenerRef.current?.();
    return profile;
  };

  // Social Sign In / Up Helper -> REGISTRATION CREATES ROLE: ADMIN, STATUS: PENDING, NO AUTO-LOGIN
  const handleSocialAuth = async (
    providerInstance: GoogleAuthProvider | GithubAuthProvider,
    providerName: "google" | "github"
  ) => {
    const { signInWithPopup, signOut } = await loadAuthModule();
    const auth = await getFirebaseAuth();
    isSocialAuthInProgress.current = true;
    try {
      const result = await signInWithPopup(auth, providerInstance);
      const fbUser = result.user;
      const cleanEmail = (fbUser.email || "").toLowerCase().trim();

      let profile = await fetchUserProfile(fbUser.uid);
      const isSuper = isInitialAdmin(cleanEmail);

      if (!profile) {
        // NEW REGISTRATION via social auth -> Role: admin, Status: pending (unless super admin)
        profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split("@")[0] || "User",
          email: cleanEmail,
          photoURL: fbUser.photoURL || "",
          role: "admin",
          status: isSuper ? "approved" : "pending",
          isApproved: isSuper ? true : false,
          provider: providerName,
          createdAt: serverTimestamp(),
        };

        try {
          await setDoc(doc(db, "users", fbUser.uid), profile);
        } catch (setErr: any) {
          console.error("Firestore user profile save error:", setErr);
          if (setErr.code === "permission-denied") {
            throw new Error("Firestore permission denied. Please update your Firestore Security Rules in Firebase Console.");
          }
          throw setErr;
        }

        // New accounts cannot sign in until approved: sign out immediately (no auto-login)
        if (!isSuper) {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          throw new Error("Account registered with " + (providerName === "google" ? "Google" : "GitHub") + "! Your account is pending administrator approval before you can sign in.");
        }
      } else {
        // EXISTING USER CHECK
        if (isSuper && (!profile.isApproved || profile.status !== "approved" || profile.role !== "admin")) {
          try {
            await updateDoc(doc(db, "users", fbUser.uid), {
              role: "admin",
              status: "approved",
              isApproved: true,
              updatedAt: serverTimestamp(),
            });
            profile = {
              ...profile,
              role: "admin",
              status: "approved",
              isApproved: true,
            };
          } catch (e) {
            console.warn("Could not auto-approve super admin:", e);
          }
        }

        if (profile.status === "rejected") {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          throw new Error("Your account has been rejected or suspended by the administrator.");
        }

        if (profile.status !== "approved" || !profile.isApproved) {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          throw new Error("Your account is pending administrator approval. Please wait until an administrator approves your account.");
        }
      }

      setUser(fbUser);
      setUserProfile(profile);
      setAuthHint(true);
      startAuthListenerRef.current?.();
      return profile;
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return null as any;
      }
      throw err;
    } finally {
      isSocialAuthInProgress.current = false;
    }
  };

  const signInWithGoogle = async () => {
    const { googleProvider } = await getSocialProviders();
    return handleSocialAuth(googleProvider, "google");
  };
  const signInWithGithub = async () => {
    const { githubProvider } = await getSocialProviders();
    return handleSocialAuth(githubProvider, "github");
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    if (!email) throw new Error("Please enter your email address.");
    const { sendPasswordResetEmail } = await loadAuthModule();
    const auth = await getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    await endSession();
    setUser(null);
    setUserProfile(null);
  };

  const isAdmin = Boolean(
    userProfile &&
    userProfile.role === "admin" &&
    userProfile.isApproved &&
    userProfile.status === "approved"
  );

  const isApproved = Boolean(
    userProfile &&
    userProfile.isApproved &&
    userProfile.status === "approved"
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isApproved,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        resetPassword,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
