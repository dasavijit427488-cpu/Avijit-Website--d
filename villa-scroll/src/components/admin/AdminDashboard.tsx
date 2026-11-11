"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminBackdrop3D from "./AdminBackdrop3D";
import {
  DEFAULT_SITE_CONFIG,
  type SiteConfig,
} from "@/lib/defaultSiteConfig";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { MediaAssetItem } from "./AdminHelpers";
import {
  BrandEditor,
  ContactEditor,
  HeroAndRoomsEditor,
  MasterplanEditor,
  MaterialityEditor,
} from "./AdminSectionEditors";
import { DesignAndLayoutEditor } from "./AdminDesignEditor";
import {
  AccountAndSystemPanel,
  InquiriesPanel,
  MediaLibraryPanel,
  type AdminUserItem,
  type DbStatsInfo,
  type InquiryItem,
} from "./AdminOperationsPanels";

type AdminTab =
  | "design"
  | "brand"
  | "hero"
  | "materiality"
  | "masterplan"
  | "contact"
  | "inquiries"
  | "media"
  | "account";

const TABS: { id: AdminTab; label: string; hint: string }[] = [
  { id: "design", label: "Colors, Fonts & Animations", hint: "Customize colors, fonts, text/page positions & animations" },
  { id: "brand", label: "Brand & Header", hint: "Edit website title, header portrait logo & monogram" },
  { id: "hero", label: "Hero & 3D Rooms", hint: "Edit opening banner text and 3D scroll room cards" },
  { id: "materiality", label: "Materiality & Gallery", hint: "Edit house photos, 3D frames, volumes & architect quote" },
  { id: "masterplan", label: "Masterplan & Wings", hint: "Edit estate overview, 4 signature zones, wings & land stats" },
  { id: "contact", label: "Contact & Form", hint: "Edit profile avatar, email, phone, WhatsApp & address" },
  { id: "inquiries", label: "Inquiries Inbox", hint: "View & manage visitor messages stored in database" },
  { id: "media", label: "Media Library", hint: "Upload & organize custom images" },
  { id: "account", label: "Account & DB", hint: "Change User ID, Password, Gmail SMTP & check DB status" },
];

export default function AdminDashboard() {
  const { setConfig: setGlobalConfig, refreshConfig } = useSiteConfig();

  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState<AdminUserItem | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("design");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Setup Form State
  const [setupUsername, setSetupUsername] = useState("");
  const [setupDisplayName, setSetupDisplayName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");

  // Login Form State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // CMS & Data State
  const [draft, setDraft] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [smtpInfo, setSmtpInfo] = useState({
    smtpUser: "",
    hasDbSmtpPass: false,
    hasEnvSmtpPass: false,
  });
  const [dbStats, setDbStats] = useState<DbStatsInfo>({
    usersCount: 0,
    sectionsCount: 6,
    inquiriesCount: 0,
    mediaCount: 0,
    dbSizeKb: 0,
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadWorkspaceData = useCallback(async () => {
    const [cfgRes, inqRes, medRes, acctRes, statusRes] = await Promise.all([
      fetch("/api/site-config", { cache: "no-store" }),
      fetch("/api/inquiries", { cache: "no-store" }),
      fetch("/api/upload", { cache: "no-store" }),
      fetch("/api/auth/account", { cache: "no-store" }),
      fetch("/api/auth/status", { cache: "no-store" }),
    ]);

    if (cfgRes.ok) {
      const cJson = await cfgRes.json();
      if (cJson?.ok && cJson?.config) setDraft(cJson.config);
    }
    if (inqRes.ok) {
      const iJson = await inqRes.json();
      if (iJson?.ok) setInquiries(iJson.inquiries || []);
    }
    if (medRes.ok) {
      const mJson = await medRes.json();
      if (mJson?.ok) setMediaAssets(mJson.assets || []);
    }
    if (acctRes.ok) {
      const aJson = await acctRes.json();
      if (aJson?.ok) {
        setUsers(aJson.users || []);
        if (aJson.smtp) setSmtpInfo(aJson.smtp);
        if (aJson.user) setUser(aJson.user);
      }
    }
    if (statusRes.ok) {
      const sJson = await statusRes.json();
      if (sJson?.dbStats) setDbStats(sJson.dbStats);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        setNeedsSetup(Boolean(json?.needsSetup));
        if (json?.dbStats) setDbStats(json.dbStats);
        if (json?.authenticated && json?.user) {
          setUser(json.user);
          await loadWorkspaceData();
        }
      } catch {
        // Ignore network errors
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadWorkspaceData]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (setupPassword !== setupConfirm) {
      setAuthError("Passwords do not match.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: setupUsername,
          displayName: setupDisplayName,
          email: setupEmail,
          password: setupPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setAuthError(json?.error || "Setup failed.");
      } else {
        setNeedsSetup(false);
        setUser(json.user);
        await loadWorkspaceData();
        showToast("Admin account created & logged in!");
      }
    } catch {
      setAuthError("Network error while creating account.");
    } finally {
      setAuthSubmitting(false);
    }
  };

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
        setLoginPassword("");
        await loadWorkspaceData();
      }
    } catch {
      setAuthError("Network error while logging in.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: draft }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setDraft(json.config);
        setGlobalConfig(json.config);
        await refreshConfig();
        showToast("All changes saved to SQLite database & published live!");
      } else {
        showToast(json?.error || "Failed to save changes.");
      }
    } catch {
      showToast("Error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Restore ALL website text and photos back to original default?")) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setDraft(json.config);
        setGlobalConfig(json.config);
        await refreshConfig();
        showToast("Website restored to original defaults.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#f6efe0] text-[#1c1812] flex items-center justify-center font-playfair admin-playfair overflow-x-clip px-4">
        <AdminBackdrop3D />
        <div className="relative z-10 px-6 py-4 rounded-2xl bg-white/88 backdrop-blur-xl border border-[#c9a84c]/60 shadow-lg text-sm font-semibold uppercase tracking-[0.2em] text-[#8b6914] text-center">
          Connecting to Database...
        </div>
      </div>
    );
  }

  // First-Time Setup OR Client Login Gate (With Architectural Silk Grid + 3D Studio Objects)
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#f6efe0] text-[#1c1812] font-playfair admin-playfair flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-clip">
        <AdminBackdrop3D />
        <div className="relative z-10 admin-card-enter w-full max-w-md rounded-3xl overflow-hidden bg-white/92 backdrop-blur-xl border border-[#c9a84c]/70 shadow-[0_28px_80px_rgba(120,90,30,0.22)]">
          <div className="bg-[#15120d] px-7 py-6 border-b-2 border-[#d4af37]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#f2ca50] font-bold">
                Avijit Villa CMS &bull; SQLite Database
              </span>
              <Link href="/" className="text-[11px] text-[#e5dccb] hover:text-[#f2ca50] underline">
                View Site
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-[#fff9ec] mt-1.5">
              {needsSetup ? "Create Client ID & Password" : "Client Admin Login"}
            </h1>
            <p className="text-xs text-[#cfc8bd] mt-1">
              {needsSetup
                ? "Set your own private User ID and Password to unlock full website customization."
                : "Sign in with your User ID and Password to customize the entire website."}
            </p>
          </div>

          <div className="p-7">
            {needsSetup ? (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    Set Your User ID *
                  </span>
                  <input
                    required
                    type="text"
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    placeholder="e.g. avijit or client_admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    Your Name
                  </span>
                  <input
                    type="text"
                    value={setupDisplayName}
                    onChange={(e) => setSetupDisplayName(e.target.value)}
                    placeholder="e.g. Avijit Das"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    Set Password (Min 6 chars) *
                  </span>
                  <input
                    required
                    type="password"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    Confirm Password *
                  </span>
                  <input
                    required
                    type="password"
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    placeholder="••••••••"
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
                  {authSubmitting ? "Saving Account..." : "Set ID & Password & Enter Dashboard"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                    User ID
                  </span>
                  <input
                    required
                    type="text"
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
                  {authSubmitting ? "Verifying..." : "Login to Customize Website"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showSaveToolbar =
    activeTab !== "inquiries" && activeTab !== "media" && activeTab !== "account";

  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const unreadCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="relative min-h-screen bg-[#f6efe0] text-[#1c1812] font-playfair admin-playfair pb-28 lg:pb-16 overflow-x-clip">
      {/* Studio Architectural Pearl Grid + New 3D Floating Objects */}
      <AdminBackdrop3D />

      {/* Top Sticky Admin Bar (Clean Mobile & Desktop) */}
      <header className="sticky top-0 z-40 bg-[#15120d]/95 backdrop-blur-xl text-white border-b-2 border-[#d4af37] px-3 sm:px-6 lg:px-8 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src={draft.brand.headerLogoUrl || "/images/avijit-header-dp.jpg"}
              alt="Admin"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-[1.5px] border-[#d4af37] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-[#fff9ec] leading-tight truncate">
                Website Studio &amp; CMS
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#f2ca50] truncate">
                User: <strong>{user.username}</strong> &bull; {user.role}
              </div>
            </div>
          </div>

          {/* Desktop Action Controls (lg+) */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-white/25 hover:border-[#f2ca50] text-xs font-semibold text-[#f5efe6] transition-colors"
            >
              Preview Live Site ↗
            </Link>

            {showSaveToolbar && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleResetAll}
                  className="px-3.5 py-2 rounded-xl border border-red-400/40 text-xs font-semibold text-red-200 hover:bg-red-500/15 cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAll}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save & Publish"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Mobile & Tablet Compact Header Controls (< lg) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-expanded={mobileNavOpen}
              className="px-3 py-2 min-h-[40px] rounded-xl bg-[#2a241b] border border-[#d4af37]/65 text-xs font-bold text-[#f2ca50] flex items-center gap-1.5 cursor-pointer"
            >
              <span>{mobileNavOpen ? "✕ Close" : "☰ Sections"}</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#d4af37] text-[#2b2000] text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Clean Expandable Menu Drawer (< lg) */}
        {mobileNavOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-3 pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[68vh] overflow-y-auto pb-1">
            {TABS.map((t, idx) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(t.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-[#d4af37] text-[#2b2000] border-[#f2ca50] font-bold"
                      : "bg-white/10 text-[#f5efe6] border-white/15 hover:bg-white/15"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {String(idx + 1).padStart(2, "0")}. {t.label}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? "text-[#3b2c00]" : "text-[#cfc8bd]"
                      }`}
                    >
                      {t.hint}
                    </div>
                  </div>
                  {t.id === "inquiries" && unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#15120d] text-[#f2ca50] text-[10px] font-bold shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            <Link
              href="/"
              target="_blank"
              className="sm:col-span-2 w-full text-center py-2.5 rounded-xl border border-[#d4af37]/60 text-xs font-bold text-[#f2ca50] bg-white/5"
            >
              Open Live Website ↗
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Desktop Numbered Sticky Navigation Sidebar (lg+) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-2 sticky top-24">
          {TABS.map((t, idx) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5 border backdrop-blur-xl ${
                  isActive
                    ? "bg-[#15120d] text-[#f2ca50] border-[#d4af37] shadow-[0_12px_28px_rgba(21,18,13,0.22)] translate-x-1"
                    : "bg-white/88 text-[#4a4236] border-[#c9a84c]/45 hover:border-[#8b6914] hover:bg-white hover:text-[#1c1812]"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-wide flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-[#d4af37] text-[#2b2000]"
                          : "bg-[#faf6ed] text-[#8b6914] border border-[#e5d5aa]"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{t.label}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 truncate ${
                      isActive ? "text-[#e5d5aa]" : "text-[#6e6454]"
                    }`}
                  >
                    {t.hint}
                  </div>
                </div>
                {t.id === "inquiries" && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-[#2b2000] text-[10px] font-bold shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Active Panel */}
        <main className="lg:col-span-9 space-y-5 min-w-0">
          {/* Quick Mobile Section Switcher Strip (< lg) */}
          <div className="flex lg:hidden items-center justify-between gap-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#c9a84c]/55 px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#8b6914] block">
                Editing Section
              </span>
              <div className="text-sm font-bold text-[#1c1812] truncate">
                {activeTabMeta.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="shrink-0 px-3 py-2 rounded-xl bg-[#faf6ed] border border-[#c9a84c] text-[11px] font-bold text-[#8b6914] cursor-pointer"
            >
              Switch Section ▾
            </button>
          </div>

          {/* Helpful Friendly Banner for Desktop & Mobile */}
          <div className="admin-card-enter rounded-2xl bg-white/90 backdrop-blur-xl border border-[#c9a84c]/55 px-4 sm:px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8b6914]">
                Active Section
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1c1812] leading-tight">
                {activeTabMeta.label}
              </h2>
              <p className="text-xs text-[#574e40] mt-0.5">{activeTabMeta.hint}</p>
            </div>
            {showSaveToolbar && (
              <span className="self-start sm:self-center text-[11px] px-3 py-1.5 rounded-full bg-[#faf6ed] border border-[#dcc484] text-[#8b6914] font-semibold">
                Save changes with &ldquo;Save &amp; Publish&rdquo;
              </span>
            )}
          </div>

          {activeTab === "design" && (
            <DesignAndLayoutEditor draft={draft} setDraft={setDraft} />
          )}
          {activeTab === "brand" && (
            <BrandEditor
              draft={draft}
              setDraft={setDraft}
              mediaAssets={mediaAssets}
              onMediaUploaded={(asset) => setMediaAssets((prev) => [asset, ...prev])}
            />
          )}
          {activeTab === "hero" && (
            <HeroAndRoomsEditor
              draft={draft}
              setDraft={setDraft}
              mediaAssets={mediaAssets}
              onMediaUploaded={(asset) => setMediaAssets((prev) => [asset, ...prev])}
            />
          )}
          {activeTab === "materiality" && (
            <MaterialityEditor
              draft={draft}
              setDraft={setDraft}
              mediaAssets={mediaAssets}
              onMediaUploaded={(asset) => setMediaAssets((prev) => [asset, ...prev])}
            />
          )}
          {activeTab === "masterplan" && (
            <MasterplanEditor
              draft={draft}
              setDraft={setDraft}
              mediaAssets={mediaAssets}
              onMediaUploaded={(asset) => setMediaAssets((prev) => [asset, ...prev])}
            />
          )}
          {activeTab === "contact" && (
            <ContactEditor
              draft={draft}
              setDraft={setDraft}
              mediaAssets={mediaAssets}
              onMediaUploaded={(asset) => setMediaAssets((prev) => [asset, ...prev])}
            />
          )}
          {activeTab === "inquiries" && (
            <InquiriesPanel
              inquiries={inquiries}
              onRefresh={loadWorkspaceData}
              onStatusChange={async (id, status) => {
                await fetch("/api/inquiries", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id, status }),
                });
                await loadWorkspaceData();
                showToast(`Inquiry #${id} marked as ${status}.`);
              }}
              onDelete={async (id) => {
                await fetch(`/api/inquiries?id=${id}`, { method: "DELETE" });
                await loadWorkspaceData();
                showToast(`Inquiry #${id} deleted.`);
              }}
            />
          )}
          {activeTab === "media" && (
            <MediaLibraryPanel
              assets={mediaAssets}
              onUploaded={(asset) => {
                setMediaAssets((prev) => [asset, ...prev]);
                showToast(`Uploaded ${asset.original_name}`);
              }}
              onDelete={async (id) => {
                await fetch(`/api/upload?id=${id}`, { method: "DELETE" });
                await loadWorkspaceData();
                showToast("Media asset removed.");
              }}
            />
          )}
          {activeTab === "account" && (
            <AccountAndSystemPanel
              currentUser={user}
              users={users}
              smtpUser={smtpInfo.smtpUser}
              hasDbSmtpPass={smtpInfo.hasDbSmtpPass}
              hasEnvSmtpPass={smtpInfo.hasEnvSmtpPass}
              dbStats={dbStats}
              onAccountUpdated={(updated) => setUser(updated)}
              onRefreshAccount={loadWorkspaceData}
            />
          )}
        </main>
      </div>

      {/* Sticky Mobile Action Bar (< lg) */}
      {showSaveToolbar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#15120d]/95 backdrop-blur-xl border-t-2 border-[#d4af37] px-3 py-2.5 flex items-center justify-between gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.28)]">
          <Link
            href="/"
            target="_blank"
            className="px-3 py-2.5 rounded-xl border border-white/25 text-xs font-semibold text-[#f5efe6] shrink-0"
          >
            Preview ↗
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleResetAll}
            className="px-3 py-2.5 rounded-xl border border-red-400/40 text-xs font-semibold text-red-200 cursor-pointer shrink-0"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-60 text-center"
          >
            {saving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      )}

      {/* Bottom Floating Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 px-5 py-3 rounded-xl bg-[#15120d] text-[#f2ca50] border border-[#d4af37] text-xs font-bold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

