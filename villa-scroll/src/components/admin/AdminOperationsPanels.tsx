"use client";

import React, { useRef, useState } from "react";
import { AdminSectionCard, FieldInput, type MediaAssetItem } from "./AdminHelpers";

export interface InquiryItem {
  id: number;
  source: string;
  name: string;
  email: string;
  phone: string;
  arrival_protocol: string;
  requirement: string;
  email_dispatched: number;
  delivery_channel: string;
  status: string;
  created_at: string;
}

export interface AdminUserItem {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface DbStatsInfo {
  usersCount: number;
  sectionsCount: number;
  inquiriesCount: number;
  mediaCount: number;
  dbSizeKb: number;
}

export function InquiriesPanel({
  inquiries,
  onStatusChange,
  onDelete,
  onRefresh,
}: {
  inquiries: InquiryItem[];
  onStatusChange: (id: number, status: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  return (
    <AdminSectionCard
      title={`Client Inquiries & Leads Database (${inquiries.length})`}
      subtitle="Every Contact Form submission and Private Viewing request is stored permanently in SQLite."
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRefresh}
          className="px-3.5 py-1.5 rounded-lg border border-[#c9a84c] text-xs font-bold uppercase tracking-wider text-[#8b6914] hover:bg-[#faf6ed] cursor-pointer"
        >
          Refresh Inbox
        </button>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] p-8 text-center text-sm text-[#6e6454]">
          No inquiries submitted yet. When visitors submit the Contact Form or Private Viewing Modal, they appear here automatically.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="rounded-xl bg-[#fcf9f2] border border-[#dcc484]/70 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#efe3c4] pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-[#1c1812]">{inq.name}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#dcc484] text-[#8b6914] font-bold">
                      {inq.source === "viewing_modal" ? "Viewing Request" : "Contact Form"}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        inq.status === "replied"
                          ? "bg-emerald-100 text-emerald-800"
                          : inq.status === "read"
                            ? "bg-amber-100 text-amber-900"
                            : inq.status === "archived"
                              ? "bg-stone-200 text-stone-700"
                              : "bg-[#15120d] text-[#f2ca50]"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#574e40] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Email: <strong className="text-[#8b6914]">{inq.email}</strong></span>
                    {inq.phone && <span>Phone: <strong>{inq.phone}</strong></span>}
                    {inq.arrival_protocol && <span>Arrival: <strong>{inq.arrival_protocol}</strong></span>}
                  </div>
                </div>
                <span className="text-[11px] text-[#6e6454]">
                  {new Date(inq.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-[#2c251c] leading-relaxed bg-white p-3.5 rounded-lg border border-[#efe3c4]">
                {inq.requirement}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {(["new", "read", "replied", "archived"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onStatusChange(inq.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                        inq.status === st
                          ? "bg-[#8b6914] text-white border-[#8b6914]"
                          : "bg-white text-[#574e40] border-[#dcc484] hover:border-[#8b6914]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${inq.email}?subject=${encodeURIComponent("Re: Your Villa Inquiry")}`}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] text-xs font-bold cursor-pointer"
                  >
                    Reply Email
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete(inq.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSectionCard>
  );
}

export function MediaLibraryPanel({
  assets,
  onUploaded,
  onDelete,
}: {
  assets: MediaAssetItem[];
  onUploaded: (asset: MediaAssetItem) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json?.ok) {
          onUploaded(json.asset);
        } else {
          setMsg(json?.error || "Upload error");
        }
      }
      setMsg("Upload completed.");
    } catch {
      setMsg("Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <AdminSectionCard
      title={`Uploaded Media Library (${assets.length})`}
      subtitle="Upload custom photos (JPG, PNG, WebP) saved directly inside your server database & storage."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-5 py-2.5 rounded-xl bg-[#15120d] hover:bg-[#2a241b] text-[#f2ca50] text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "+ Upload New Image(s)"}
        </button>
        {msg && <span className="text-xs font-semibold text-[#8b6914]">{msg}</span>}
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] p-8 text-center text-sm text-[#6e6454]">
          No custom images uploaded yet. Upload images here or directly from any image field in the editor tabs.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {assets.map((a) => (
            <div
              key={a.id}
              className="rounded-xl bg-[#fcf9f2] border border-[#dcc484] overflow-hidden flex flex-col"
            >
              <div className="h-32 bg-[#15120d]">
                <img src={a.url} alt={a.original_name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1c1812] truncate" title={a.original_name}>
                    {a.original_name}
                  </div>
                  <div className="text-[10px] text-[#6e6454]">
                    {Math.round(a.size_bytes / 1024)} KB
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(a.url);
                      setMsg(`Copied URL: ${a.url}`);
                    }}
                    className="text-[10px] font-bold uppercase text-[#8b6914] hover:underline cursor-pointer"
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    className="text-[10px] font-bold uppercase text-red-600 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSectionCard>
  );
}

export function AccountAndSystemPanel({
  currentUser,
  users,
  smtpUser,
  hasDbSmtpPass,
  hasEnvSmtpPass,
  deploymentInfo,
  dbStats,
  onAccountUpdated,
  onRefreshAccount,
}: {
  currentUser: AdminUserItem;
  users: AdminUserItem[];
  smtpUser: string;
  hasDbSmtpPass: boolean;
  hasEnvSmtpPass: boolean;
  deploymentInfo: {
    isServerless: boolean;
    isEnvLocked: boolean;
    passwordHash: string;
  };
  dbStats: DbStatsInfo;
  onAccountUpdated: (u: AdminUserItem) => void;
  onRefreshAccount: () => Promise<void>;
}) {
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [email, setEmail] = useState(currentUser.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [acctMsg, setAcctMsg] = useState<string | null>(null);
  const [acctErr, setAcctErr] = useState<string | null>(null);

  const [addUsername, setAddUsername] = useState("");
  const [addDisplay, setAddDisplay] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const [smtpUserInput, setSmtpUserInput] = useState(smtpUser);
  const [smtpPassInput, setSmtpPassInput] = useState("");
  const [smtpMsg, setSmtpMsg] = useState<string | null>(null);

  const handleUpdateSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcctMsg(null);
    setAcctErr(null);

    const res = await fetch("/api/auth/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newUsername,
        displayName,
        email,
        newPassword: newPassword || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      setAcctErr(json?.error || "Update failed");
    } else {
      onAccountUpdated(json.user);
      setCurrentPassword("");
      setNewPassword("");
      setAcctMsg("Account credentials updated in SQLite database!");
      await onRefreshAccount();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    const res = await fetch("/api/auth/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: addUsername,
        displayName: addDisplay,
        email: addEmail,
        password: addPassword,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      setAddMsg(json?.error || "Failed to add user");
    } else {
      setAddUsername("");
      setAddDisplay("");
      setAddEmail("");
      setAddPassword("");
      setAddMsg(`Created user "${json.created.username}"!`);
      await onRefreshAccount();
    }
  };

  const handleDeleteUser = async (id: number) => {
    await fetch(`/api/auth/account?id=${id}`, { method: "DELETE" });
    await onRefreshAccount();
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpMsg(null);
    const res = await fetch("/api/auth/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_smtp",
        smtpUser: smtpUserInput,
        smtpPass: smtpPassInput.trim() ? smtpPassInput.trim() : "__KEEP__",
      }),
    });
    const json = await res.json();
    if (res.ok && json?.ok) {
      setSmtpPassInput("");
      setSmtpMsg("Gmail SMTP settings saved in database!");
      await onRefreshAccount();
    }
  };

  const handleTestSmtp = async () => {
    setSmtpMsg("Sending test email...");
    const res = await fetch("/api/auth/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test_smtp",
        toEmail: currentUser.email || smtpUserInput,
      }),
    });
    const json = await res.json();
    setSmtpMsg(json?.ok ? json.message : json?.message || json?.error || "Test failed — verify Gmail App Password.");
  };

  const envSnippet = [
    `ADMIN_USERNAME=${currentUser.username}`,
    `ADMIN_PASSWORD_HASH=${deploymentInfo.passwordHash}`,
    `ADMIN_EMAIL=${currentUser.email || smtpUserInput || "dasavijit427488@gmail.com"}`,
    `SMTP_USER=${smtpUserInput || currentUser.email || "dasavijit427488@gmail.com"}`,
    `GMAIL_APP_PASSWORD=YOUR_16_CHAR_GMAIL_APP_PASSWORD`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="SQLite Database Engine Overview"
        subtitle="Built-in persistent relational storage located at data/villa.db."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
            <div className="text-[10px] uppercase tracking-wider text-[#8b6914] font-bold">Users</div>
            <div className="text-xl font-bold text-[#1c1812] mt-1">{dbStats.usersCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
            <div className="text-[10px] uppercase tracking-wider text-[#8b6914] font-bold">CMS Sections</div>
            <div className="text-xl font-bold text-[#1c1812] mt-1">{dbStats.sectionsCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
            <div className="text-[10px] uppercase tracking-wider text-[#8b6914] font-bold">Inquiries</div>
            <div className="text-xl font-bold text-[#1c1812] mt-1">{dbStats.inquiriesCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
            <div className="text-[10px] uppercase tracking-wider text-[#8b6914] font-bold">Media Assets</div>
            <div className="text-xl font-bold text-[#1c1812] mt-1">{dbStats.mediaCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
            <div className="text-[10px] uppercase tracking-wider text-[#8b6914] font-bold">DB Size</div>
            <div className="text-xl font-bold text-[#1c1812] mt-1">{dbStats.dbSizeKb} KB</div>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Your Client Login ID & Password"
        subtitle="Change your User ID or Password anytime. Current password is required to save security changes."
      >
        <form onSubmit={handleUpdateSelf} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="User ID (Username)" value={newUsername} onChange={setNewUsername} />
            <FieldInput label="Display Name" value={displayName} onChange={setDisplayName} />
            <FieldInput label="Account Email" value={email} onChange={setEmail} type="email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Current Password (Required)"
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
              placeholder="Enter current password"
            />
            <FieldInput
              label="New Password (Optional)"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              placeholder="Min 6 chars — leave blank to keep current"
            />
          </div>
          {acctErr && <div className="text-xs text-red-600 font-semibold">{acctErr}</div>}
          {acctMsg && <div className="text-xs text-emerald-700 font-semibold">{acctMsg}</div>}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
          >
            Update My Credentials
          </button>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Manage Client / Team Accounts"
        subtitle="Create additional User IDs & Passwords for clients or staff."
      >
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]"
            >
              <div className="text-sm">
                <strong className="text-[#1c1812]">{u.username}</strong>{" "}
                <span className="text-[#6e6454]">({u.displayName})</span>{" "}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#dcc484] text-[#8b6914] font-bold ml-1">
                  {u.role}
                </span>
              </div>
              {u.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Remove User
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateUser} className="pt-4 border-t border-[#efe3c4] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
            Add New Client Account
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FieldInput label="User ID" value={addUsername} onChange={setAddUsername} placeholder="e.g. client01" />
            <FieldInput label="Full Name" value={addDisplay} onChange={setAddDisplay} placeholder="Client Name" />
            <FieldInput label="Email" value={addEmail} onChange={setAddEmail} type="email" placeholder="client@mail.com" />
            <FieldInput label="Password" value={addPassword} onChange={setAddPassword} type="password" placeholder="Min 6 chars" />
          </div>
          {addMsg && <div className="text-xs font-semibold text-[#8b6914]">{addMsg}</div>}
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#15120d] text-[#f2ca50] text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            + Create Client User
          </button>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Direct Gmail SMTP Email Delivery"
        subtitle="Optional: Store a Google 16-character App Password in SQLite so visitor inquiries arrive automatically in your Gmail inbox."
      >
        <div className="text-xs text-[#574e40] bg-[#fcf9f2] p-3.5 rounded-xl border border-[#e5d5aa]">
          Status:{" "}
          <strong className={hasDbSmtpPass || hasEnvSmtpPass ? "text-emerald-700" : "text-amber-800"}>
            {hasDbSmtpPass
              ? "Active (Database Gmail App Password Configured)"
              : hasEnvSmtpPass
                ? "Active (.env.local App Password Configured)"
                : "Not Configured Yet (Using FormSubmit / Email App Fallback)"}
          </strong>
        </div>

        <form onSubmit={handleSaveSmtp} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Gmail Sender Address"
              value={smtpUserInput}
              onChange={setSmtpUserInput}
              type="email"
              placeholder="yourname@gmail.com"
            />
            <FieldInput
              label="Gmail 16-Char App Password"
              value={smtpPassInput}
              onChange={setSmtpPassInput}
              type="password"
              placeholder={hasDbSmtpPass ? "•••••••• (leave blank to keep)" : "xxxx xxxx xxxx xxxx"}
            />
          </div>
          {smtpMsg && <div className="text-xs text-emerald-700 font-semibold">{smtpMsg}</div>}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-[#c9a84c] text-[#8b6914] hover:bg-[#faf6ed] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Save SMTP Settings
            </button>
            <button
              type="button"
              onClick={handleTestSmtp}
              className="px-4 py-2 rounded-xl bg-[#15120d] text-[#f2ca50] hover:brightness-110 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Send Test Email Now
            </button>
          </div>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Vercel / Netlify Permanent Admin & Email Lock"
        subtitle={
          deploymentInfo.isEnvLocked
            ? "Locked permanently via Environment Variables — nobody can reset or bypass Admin setup across Vercel cold restarts."
            : "Add these Environment Variables in Vercel → Project Settings → Environment Variables so your User ID, Password & Gmail Email delivery stay permanently locked across every serverless cold start."
        }
      >
        <div className="text-xs text-[#574e40] bg-[#fcf9f2] p-3.5 rounded-xl border border-[#e5d5aa] font-mono whitespace-pre-wrap break-all select-all">
          {envSnippet}
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(envSnippet);
            setSmtpMsg("Copied Vercel Environment Variables!");
          }}
          className="px-4 py-2 rounded-xl border border-[#c9a84c] text-[#8b6914] hover:bg-[#faf6ed] text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Copy Env Vars for Vercel
        </button>
      </AdminSectionCard>
    </div>
  );
}

