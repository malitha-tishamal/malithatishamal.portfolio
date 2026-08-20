"use client";

import React, { useState } from "react";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface ForgotPasswordProps {
  onClose?: () => void;
  onOpenSignIn?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose, onOpenSignIn }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      console.error("Password reset error:", err);
      let msg = "Failed to send password reset email.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email address format.";
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

      <h2 className="text-2xl font-bold text-dark dark:text-white mb-2 text-center">
        Reset Password
      </h2>
      <p className="text-sm text-body-secondary dark:text-gray-400 mb-6 text-center">
        Enter your registered email address and we will send you a password reset link.
      </p>

      {submitted ? (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-center mb-6">
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
            Reset email sent to <strong>{email}</strong>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please check your inbox (and spam folder) to reset your password.
          </p>
          <button
            onClick={() => {
              if (onOpenSignIn) onOpenSignIn();
              else if (onClose) onClose();
            }}
            className="mt-4 inline-block w-full rounded-md bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-[22px]">
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-gray-400 focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-5 py-3 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader />}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            if (onOpenSignIn) onOpenSignIn();
            else if (onClose) onClose();
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Remember your password? Sign In
        </button>
      </div>
    </>
  );
};

export default ForgotPassword;
