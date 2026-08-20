"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

const INITIAL_ADMIN_EMAIL = process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL?.toLowerCase() || "";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      const profile = await fetchUserProfile(auth.currentUser.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Sign Up
  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    const isInitialAdmin = INITIAL_ADMIN_EMAIL && email.toLowerCase() === INITIAL_ADMIN_EMAIL;
    const initialStatus = isInitialAdmin ? "approved" : "pending";
    const initialRole = isInitialAdmin ? "admin" : "user";
    const isApproved = isInitialAdmin ? true : false;

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name || email.split("@")[0],
      email: email.toLowerCase(),
      photoURL: cred.user.photoURL || "",
      role: initialRole,
      status: initialStatus,
      isApproved: isApproved,
      provider: "password",
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", cred.user.uid), newProfile);

    // If not approved initial admin, sign out immediately so they cannot access without approval
    if (!isApproved) {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      return {
        success: true,
        isApproved: false,
        message: "Account created successfully! Your account is pending administrator approval before you can sign in.",
      };
    }

    setUserProfile(newProfile);
    return {
      success: true,
      isApproved: true,
      message: "Admin account created successfully!",
    };
  };

  // Email/Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    let profile = await fetchUserProfile(cred.user.uid);

    // If no profile exists yet (legacy/edge case), create one
    if (!profile) {
      const isInitialAdmin = INITIAL_ADMIN_EMAIL && email.toLowerCase() === INITIAL_ADMIN_EMAIL;
      profile = {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split("@")[0],
        email: email.toLowerCase(),
        photoURL: cred.user.photoURL || "",
        role: isInitialAdmin ? "admin" : "user",
        status: isInitialAdmin ? "approved" : "pending",
        isApproved: isInitialAdmin ? true : false,
        provider: "password",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", cred.user.uid), profile);
    }

    // Check approval status
    if (profile.status === "rejected") {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      throw new Error("Your account has been rejected or suspended by the administrator.");
    }

    if (profile.status !== "approved" && !profile.isApproved) {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      throw new Error("Your account is pending administrator approval. Please wait until approved.");
    }

    setUserProfile(profile);
    return profile;
  };

  // Social Sign In / Up Helper
  const handleSocialAuth = async (providerInstance: typeof googleProvider | typeof githubProvider, providerName: "google" | "github") => {
    const result = await signInWithPopup(auth, providerInstance);
    const fbUser = result.user;
    const email = fbUser.email?.toLowerCase() || "";

    let profile = await fetchUserProfile(fbUser.uid);

    if (!profile) {
      const isInitialAdmin = INITIAL_ADMIN_EMAIL && email === INITIAL_ADMIN_EMAIL;
      const initialStatus = isInitialAdmin ? "approved" : "pending";
      const initialRole = isInitialAdmin ? "admin" : "user";
      const isApproved = isInitialAdmin ? true : false;

      profile = {
        uid: fbUser.uid,
        name: fbUser.displayName || email.split("@")[0] || "User",
        email: email,
        photoURL: fbUser.photoURL || "",
        role: initialRole,
        status: initialStatus,
        isApproved: isApproved,
        provider: providerName,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", fbUser.uid), profile);

      if (!isApproved) {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        throw new Error("Account registered via " + providerName + "! It is pending administrator approval before you can sign in.");
      }
    } else {
      if (profile.status === "rejected") {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        throw new Error("Your account has been rejected or suspended by the administrator.");
      }

      if (profile.status !== "approved" && !profile.isApproved) {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        throw new Error("Your account is pending administrator approval. Please wait until approved.");
      }
    }

    setUserProfile(profile);
    return profile;
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
    (userProfile.isApproved || userProfile.status === "approved")
  );

  const isApproved = Boolean(
    userProfile &&
    (userProfile.isApproved || userProfile.status === "approved")
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
