"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SITE_CONFIG,
  type SiteConfig,
} from "@/lib/defaultSiteConfig";
import {
  CONFIG_CHANNEL_NAME,
  PREVIEW_STORAGE_KEY,
  useSiteConfig,
} from "@/context/SiteConfigContext";
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

export interface AdminStudioWorkspaceProps {
  user: AdminUserItem;
  onLogout: () => Promise<void>;
  onSessionExpired: (msg: string) => void;
  onUserUpdated: (user: AdminUserItem) => void;
}

export default function AdminStudioWorkspace({
  user,
  onLogout,
  onSessionExpired,
  onUserUpdated,
}: AdminStudioWorkspaceProps) {
  const { setConfig: setGlobalConfig, refreshConfig } = useSiteConfig();

  const [activeTab, setActiveTab] = useState<AdminTab>("design");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [draft, setDraft] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [smtpInfo, setSmtpInfo] = useState({
    smtpUser: "",
    hasDbSmtpPass: false,
    hasEnvSmtpPass: false,
  });
  const [deploymentInfo, setDeploymentInfo] = useState({
    isServerless: false,
    cloudSynced: true,
    isEnvLocked: false,
    passwordHash: "",
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
        if (aJson.deployment) setDeploymentInfo(aJson.deployment);
        if (aJson.user) onUserUpdated(aJson.user);
      }
    }
    if (statusRes.ok) {
      const sJson = await statusRes.json();
      if (sJson?.dbStats) setDbStats(sJson.dbStats);
    }
  }, [onUserUpdated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadWorkspaceData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadWorkspaceData]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: draft }),
      });
      const json = await res.json();
      if (res.status === 401) {
        onSessionExpired("Session expired — please sign in again to save changes.");
        return;
      }
      if (res.ok && json?.ok) {
        setDraft(json.config);
        setGlobalConfig(json.config);
        try {
          if (json.cloudSynced) {
            localStorage.removeItem(PREVIEW_STORAGE_KEY);
          } else {
            localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(json.config));
          }
          if (typeof BroadcastChannel !== "undefined") {
            const ch = new BroadcastChannel(CONFIG_CHANNEL_NAME);
            ch.postMessage({ config: json.config });
            ch.close();
          }
        } catch {
          // Ignore browser storage errors
        }
        await refreshConfig();
        showToast(
          json.cloudSynced
            ? "All changes saved & published live across all devices!"
            : "Saved to server & browser preview! Connect Upstash Redis in Vercel Storage for permanent cross-device sync."
        );
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
      if (res.status === 401) {
        onSessionExpired("Session expired — please sign in again.");
        return;
      }
      if (res.ok && json?.ok) {
        setDraft(json.config);
        setGlobalConfig(json.config);
        try {
          localStorage.removeItem(PREVIEW_STORAGE_KEY);
          if (typeof BroadcastChannel !== "undefined") {
            const ch = new BroadcastChannel(CONFIG_CHANNEL_NAME);
            ch.postMessage({ config: json.config });
            ch.close();
          }
        } catch {
          // Ignore
        }
        await refreshConfig();
        showToast("Website restored to original defaults.");
      }
    } finally {
      setSaving(false);
    }
  };

  const showSaveToolbar =
    activeTab !== "inquiries" && activeTab !== "media" && activeTab !== "account";

  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const unreadCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <>
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
                User: <strong>{user.username}</strong> &bull; {user.role}{" "}
                {deploymentInfo.isServerless && !deploymentInfo.cloudSynced && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-300/40 text-amber-200 text-[9px] uppercase">
                    Temp Storage — Connect Vercel KV
                  </span>
                )}
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
              onClick={onLogout}
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
              onClick={onLogout}
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${isActive
                      ? "bg-[#d4af37] text-[#2b2000] border-[#f2ca50] font-bold"
                      : "bg-white/10 text-[#f5efe6] border-white/15 hover:bg-white/15"
                    }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {String(idx + 1).padStart(2, "0")}. {t.label}
                    </div>
                    <div
                      className={`text-[10px] truncate ${isActive ? "text-[#3b2c00]" : "text-[#cfc8bd]"
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
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5 border backdrop-blur-xl ${isActive
                    ? "bg-[#15120d] text-[#f2ca50] border-[#d4af37] shadow-[0_12px_28px_rgba(21,18,13,0.22)] translate-x-1"
                    : "bg-white/88 text-[#4a4236] border-[#c9a84c]/45 hover:border-[#8b6914] hover:bg-white hover:text-[#1c1812]"
                  }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-wide flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isActive
                          ? "bg-[#d4af37] text-[#2b2000]"
                          : "bg-[#faf6ed] text-[#8b6914] border border-[#e5d5aa]"
                        }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{t.label}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 truncate ${isActive ? "text-[#e5d5aa]" : "text-[#6e6454]"
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
          <div className="lg:hidden flex items-center justify-between gap-2 rounded-2xl bg-white/90 border border-[#c9a84c]/55 px-3.5 py-2.5 shadow-sm">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#8b6914]">
                Editing Section
              </div>
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
              deploymentInfo={deploymentInfo}
              dbStats={dbStats}
              onAccountUpdated={onUserUpdated}
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
    </>
  );
}
