"use client";

import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import SocialSignIn from "../SocialSignIn";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";
import toast, { Toaster } from "react-hot-toast";
import AuthDialogContext from "@/app/context/AuthDialogContext";
import { useAuth } from "@/context/AuthContext";

interface SignInProps {
  signInOpen?: (value: boolean) => void;
  onOpenSignUp?: () => void;
  onOpenForgotPassword?: () => void;
}

const Signin: React.FC<SignInProps> = ({
  signInOpen,
  onOpenSignUp,
  onOpenForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const authDialog = useContext(AuthDialogContext);
  const { signInWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      toast.error("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const profile = await signInWithEmail(email, password);

      toast.success("Signed in successfully!");
      authDialog?.setIsSuccessDialogOpen(true);

      setTimeout(() => {
        authDialog?.setIsSuccessDialogOpen(false);
        if (signInOpen) signInOpen(false);
        router.push("/admin");
      }, 1000);
    } catch (err: any) {
      console.error("Sign in error:", err);
      let message = "Invalid email or password.";
      if (err.message && err.message.includes("pending administrator approval")) {
        message = "Your account is pending administrator approval. Please wait until approved.";
      } else if (err.message && err.message.includes("rejected")) {
        message = "Your account has been rejected or suspended by the administrator.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        message = "Incorrect email or password.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later or reset password.";
      } else if (err.message) {
        message = err.message;
      }

      setErrorMsg(message);
      toast.error(message);
      authDialog?.setIsFailedDialogOpen(true);
      setTimeout(() => {
        authDialog?.setIsFailedDialogOpen(false);
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="mb-8 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <SocialSignIn
        onSuccess={() => {
          if (signInOpen) signInOpen(false);
        }}
        onError={(msg) => {
          setErrorMsg(msg);
        }}
      />

      <span className="z-1 relative my-6 block text-center">
        <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-border dark:bg-dark_border"></span>
        <span className="text-body-secondary relative z-10 inline-block bg-white px-3 text-base dark:bg-darklight">
          OR
        </span>
      </span>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600 dark:text-red-400 text-left">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-[20px]">
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border placeholder:text-gray-400 border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-[20px]">
          <input
            type="password"
            required
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary hover:bg-darkprimary dark:hover:bg-darkprimary! px-5 py-3 text-base text-white transition duration-300 ease-in-out disabled:opacity-60 font-medium"
          >
            {loading && <Loader />}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2 items-center">
        <button
          type="button"
          onClick={() => {
            if (onOpenForgotPassword) onOpenForgotPassword();
          }}
          className="text-sm font-medium text-dark hover:text-primary dark:text-gray-300 dark:hover:text-primary transition"
        >
          Forget Password?
        </button>
        <p className="text-body-secondary text-sm">
          Not a member yet?{" "}
          <button
            type="button"
            onClick={() => {
              if (onOpenSignUp) onOpenSignUp();
            }}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </div>
    </>
  );
};

export default Signin;
