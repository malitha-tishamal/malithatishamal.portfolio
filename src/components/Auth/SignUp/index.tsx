"use client";

import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";
import toast, { Toaster } from "react-hot-toast";
import AuthDialogContext from "@/app/context/AuthDialogContext";
import { useAuth } from "@/context/AuthContext";

interface SignUpProps {
  signUpOpen?: (value: boolean) => void;
  onOpenSignIn?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ signUpOpen, onOpenSignIn }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const authDialog = useContext(AuthDialogContext);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUpWithEmail(name, email, password);
      if (res.isApproved) {
        toast.success("Admin account created successfully!");
        if (signUpOpen) signUpOpen(false);
        router.push("/admin");
      } else {
        setSuccessInfo(res.message);
        toast.success("Registration submitted! Pending admin approval.");
        authDialog?.setIsUserRegistered(true);
        setTimeout(() => {
          authDialog?.setIsUserRegistered(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      let msg = "Failed to create account.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email address format.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 6 characters.";
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="mb-6 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      {successInfo ? (
        <div className="my-6 rounded-lg bg-green-500/10 border border-green-500/30 p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
            Registration Successful!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            {successInfo}
          </p>
          <button
            type="button"
            onClick={() => {
              if (onOpenSignIn) onOpenSignIn();
              else if (signUpOpen) signUpOpen(false);
            }}
            className="w-full rounded-md bg-primary py-3 text-base font-medium text-white transition hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          <SocialSignUp
            onSuccess={() => {
              if (signUpOpen) signUpOpen(false);
            }}
          />

          <span className="z-1 relative my-6 block text-center">
            <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-border dark:bg-dark_border"></span>
            <span className="text-body-secondary relative z-10 inline-block bg-white px-3 text-base dark:bg-darklight">
              OR
            </span>
          </span>

          <form onSubmit={handleSubmit}>
            <div className="mb-[18px]">
              <input
                type="text"
                placeholder="Full Name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-gray-400 focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="mb-[18px]">
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-gray-400 focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="mb-[18px]">
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-gray-400 focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="mb-6">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-darkprimary! dark:hover:bg-darkprimary! disabled:opacity-60"
              >
                {loading && <Loader />}
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <p className="text-body-secondary mb-4 text-xs text-center">
            By creating an account you agree with our{" "}
            <a href="#!" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>

          <p className="text-body-secondary text-sm text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                if (onOpenSignIn) onOpenSignIn();
              }}
              className="pl-1 text-primary font-medium hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </>
      )}
    </>
  );
};

export default SignUp;
