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

  // Enforce fresh login on initial visit AND invalidate session whenever leaving /admin
  useEffect(() => {
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
            </form>
          </div>
        </div>
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
