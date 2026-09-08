"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider, githubProvider } from "@/lib/firebase";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Guard ref: true while a social popup is active
  // Prevents onAuthStateChanged from firing early signOut mid-popup
  const isSocialAuthInProgress = useRef<boolean>(false);

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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // If a social popup flow is in-flight, skip onAuthStateChanged to prevent race conditions
      if (isSocialAuthInProgress.current) {
        setLoading(false);
        return;
      }

      if (fbUser) {
        const cleanEmail = (fbUser.email || "").toLowerCase().trim();
        let profile = await fetchUserProfile(fbUser.uid);
        const isSuper = isInitialAdmin(cleanEmail);

        // Auto-approve the initial super admin so they can access the admin panel to approve others
        if (isSuper && profile && (!profile.isApproved || profile.status !== "approved" || profile.role !== "admin")) {
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
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setUser(fbUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Sign Up -> ROLE: ADMIN, STATUS: PENDING, NO AUTO-LOGIN
  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    const isSuper = isInitialAdmin(cleanEmail);

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      photoURL: cred.user.photoURL || "",
      role: "admin",
      status: isSuper ? "approved" : "pending",
      isApproved: isSuper ? true : false,
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

    // New accounts are pending: strictly sign out immediately (no auto-login)
    await signOut(auth);
    setUser(null);
    setUserProfile(null);

    return {
      success: true,
      isApproved: isSuper,
      message: isSuper
        ? "Admin account created successfully! You can now sign in."
        : "Account created successfully! Your account is pending administrator approval before you can sign in.",
    };
  };

  // Email/Password Sign In -> CHECKS APPROVAL
  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
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
    return profile;
  };

  // Social Sign In / Up Helper -> REGISTRATION CREATES ROLE: ADMIN, STATUS: PENDING, NO AUTO-LOGIN
  const handleSocialAuth = async (
    providerInstance: typeof googleProvider | typeof githubProvider,
    providerName: "google" | "github"
  ) => {
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

  const signInWithGoogle = () => handleSocialAuth(googleProvider, "google");
  const signInWithGithub = () => handleSocialAuth(githubProvider, "github");

  // Reset Password
  const resetPassword = async (email: string) => {
    if (!email) throw new Error("Please enter your email address.");
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
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
