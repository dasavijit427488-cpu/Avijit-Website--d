"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AdminBackdrop3D from "./AdminBackdrop3D";
import type { AdminUserItem } from "./AdminOperationsPanels";

const AdminStudioWorkspace = dynamic(() => import("./AdminStudioWorkspace"), {
  loading: () => (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="px-6 py-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#c9a84c]/65 shadow-lg text-xs font-bold uppercase tracking-[0.2em] text-[#8b6914]">
        Opening Studio...
      </div>
    </div>
  ),
});

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUserItem | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Forgot Password states
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1=enter identifier, 2=enter code+newpass
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Enforce fresh login on initial visit AND invalidate session whenever leaving /admin
  useEffect(() => {
    // Preload admin workspace chunk immediately in background so login transition is instant
    void import("./AdminStudioWorkspace");

    const terminateAdminSession = () => {
      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/auth/logout");
        } else {
          void fetch("/api/auth/logout", { method: "POST", keepalive: true });
        }
      } catch {
        // Ignore navigation errors
      }
    };

    const handlePageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) {
        setUser(null);
        setLoginUsername("");
        setLoginPassword("");
        void fetch("/api/auth/logout", { method: "POST", cache: "no-store" }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", terminateAdminSession);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pagehide", terminateAdminSession);
      window.removeEventListener("pageshow", handlePageShow);
      // NOTE: Do not terminate session inside React effect cleanup so component re-renders preserve active admin login
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setAuthError(json?.error || "Invalid User ID or Password.");
      } else {
        setUser(json.user);
        setLoginUsername("");
        setLoginPassword("");
      }
    } catch {
      setAuthError("Network error while logging in.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setForgotError(json?.error || "Could not send reset code. Check your User ID or email.");
      } else {
        setForgotCode(""); // Must remain empty so user enters it from their Gmail inbox
        setForgotSuccess(
          json?.message ||
            `A 6-digit verification code has been sent to ${json?.maskedEmail || forgotIdentifier}. Check your Gmail inbox and enter the code below.`
        );
        setForgotStep(2);
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError("New password must be at least 6 characters.");
      return;
    }
    setForgotSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: forgotCode.trim(),
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setForgotError(json?.error || "Invalid or expired reset code. Please try again.");
      } else {
        setForgotSuccess("Password reset successful! You can now log in with your new password.");
        setTimeout(() => {
          setShowForgotPw(false);
          setForgotStep(1);
          setForgotIdentifier("");
          setForgotCode("");
          setForgotNewPassword("");
          setForgotConfirmPassword("");
          setForgotError(null);
          setForgotSuccess(null);
        }, 1800);
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#f6efe0] text-[#1c1812] font-playfair admin-playfair flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-clip">
        <AdminBackdrop3D />
        <div className="relative z-10 admin-card-enter w-full max-w-md rounded-3xl overflow-hidden bg-white/92 backdrop-blur-xl border border-[#c9a84c]/70 shadow-[0_28px_80px_rgba(120,90,30,0.22)]">
          <div className="bg-[#15120d] px-7 py-6 border-b-2 border-[#d4af37]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#f2ca50] font-bold">
                Avijit Villa CMS
              </span>
              <Link href="/" className="text-[11px] text-[#e5dccb] hover:text-[#f2ca50] underline">
                View Site
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-[#fff9ec] mt-1.5">
              Client Admin Login
            </h1>
            <p className="text-xs text-[#cfc8bd] mt-1">
              Sign in with your User ID and Password to customize the website.
            </p>
          </div>

          <div className="p-7">
            <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  User ID
                </span>
                <input
                  required
                  type="text"
                  autoComplete="off"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your User ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  Password
                </span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                />
              </label>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs font-bold uppercase tracking-[0.16em] shadow-md cursor-pointer disabled:opacity-60"
              >
                {authSubmitting ? "Verifying..." : "Login"}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPw(true);
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotIdentifier("");
                    setForgotCode("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                  }}
                  className="text-xs text-[#8b6914] hover:text-[#5a4408] underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPw && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForgotPw(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl overflow-hidden bg-white/95 border border-[#c9a84c]/70 shadow-[0_28px_80px_rgba(120,90,30,0.28)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#15120d] px-6 py-5 border-b-2 border-[#d4af37] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#f2ca50] font-bold block">
                    Avijit Villa CMS
                  </span>
                  <h2 className="text-lg font-bold text-[#fff9ec] mt-0.5">
                    {forgotStep === 1 ? "Reset Password" : "Enter Reset Code"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPw(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#e8dfd0] flex items-center justify-center transition-colors cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {forgotStep === 1 ? (
                  <form onSubmit={handleForgotStep1} className="space-y-4">
                    <p className="text-xs text-[#5a4f3e] leading-relaxed">
                      Enter your <strong>User ID</strong> or <strong>registered email</strong>. A 6-digit reset code will be sent to your recovery email.
                    </p>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                        User ID or Email
                      </span>
                      <input
                        required
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. admin or your@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                      />
                    </label>

                    {forgotError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                        {forgotError}
                      </div>
                    )}
                    {forgotSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium space-y-1">
                        <div>{forgotSuccess}</div>
                        <div className="text-[10px] text-emerald-600">
                          Tip: Check your Gmail <strong>Inbox</strong> or <strong>Spam / Promotions</strong> folder.
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={forgotSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs font-bold uppercase tracking-[0.16em] shadow-md cursor-pointer disabled:opacity-60"
                    >
                      {forgotSubmitting ? "Sending Code..." : "Send Reset Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotStep2} className="space-y-4">
                    {forgotSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium space-y-1">
                        <div>{forgotSuccess}</div>
                        <div className="text-[10px] text-emerald-600">
                          Tip: Check your Gmail <strong>Inbox</strong> or <strong>Spam / Promotions</strong> folder.
                        </div>
                      </div>
                    )}
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                        6-Digit Reset Code
                      </span>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter the 6-digit code"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm tracking-[0.3em] text-center font-bold"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                        New Password
                      </span>
                      <input
                        required
                        type="password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                        Confirm New Password
                      </span>
                      <input
                        required
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                      />
                    </label>

                    {forgotError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                        {forgotError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); setForgotError(null); setForgotSuccess(null); }}
                        className="flex-1 py-2.5 rounded-xl border border-[#c9a84c] text-[#8b6914] text-xs font-bold uppercase tracking-[0.12em] cursor-pointer hover:bg-[#faf6ed] transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={forgotSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs font-bold uppercase tracking-[0.12em] shadow-md cursor-pointer disabled:opacity-60"
                      >
                        {forgotSubmitting ? "Resetting..." : "Reset Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f6efe0] text-[#1c1812] font-playfair admin-playfair pb-28 lg:pb-16 overflow-x-clip">
      <AdminBackdrop3D />
      <AdminStudioWorkspace
        user={user}
        onLogout={handleLogout}
        onSessionExpired={(msg) => {
          setUser(null);
          setAuthError(msg);
        }}
        onUserUpdated={setUser}
      />
    </div>
  );
}
