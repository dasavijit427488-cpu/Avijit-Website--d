import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb, getSiteConfig } from "./db";
import { isCloudKvConfigured, kvGetJson, kvSetJson } from "./cloudStore";

const KV_USERS_KEY = "villa:users";

export const SESSION_COOKIE_NAME = "villa_admin_session";
export const RESET_COOKIE_NAME = "villa_pwd_reset";
const SESSION_TTL_DAYS = 14;
const RESET_TTL_MS = 15 * 60 * 1000;

export interface PublicUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

function getSigningSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (envSecret && envSecret.length >= 16) return envSecret;
  const seed = `${process.env.ADMIN_USERNAME || "villa"}|${process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || "avijit-studio-key"}|avijit-villa-cms-v1`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

export async function syncUsersFromCloud(): Promise<void> {
  if (!isCloudKvConfigured()) return;
  const remoteUsers = await kvGetJson<UserRow[]>(KV_USERS_KEY);
  if (!Array.isArray(remoteUsers) || remoteUsers.length === 0) return;
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO users (username, display_name, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       display_name = excluded.display_name,
       email = excluded.email,
       password_hash = excluded.password_hash,
       role = excluded.role,
       updated_at = excluded.updated_at`
  );
  for (const r of remoteUsers) {
    if (r?.username && r?.password_hash) {
      stmt.run(
        String(r.username).toLowerCase(),
        String(r.display_name || r.username),
        String(r.email || ""),
        String(r.password_hash),
        String(r.role || "owner"),
        String(r.created_at || new Date().toISOString()),
        String(r.updated_at || new Date().toISOString())
      );
    }
  }
}

export async function pushUsersToCloud(): Promise<boolean> {
  if (!isCloudKvConfigured()) return false;
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users ORDER BY id ASC").all() as unknown as UserRow[];
  return kvSetJson(KV_USERS_KEY, rows);
}

function signPayload(payloadObj: Record<string, unknown>): string {
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifySignedPayload<T extends Record<string, unknown>>(token: string | undefined): T | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(payloadB64)
      .digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as T;
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, "hex");
    const derived = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derived.length) return false;
    return crypto.timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function rowToPublicUser(row: UserRow): PublicUser {
  return {
    id: Number(row.id),
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

/**
 * If Vercel/hosting env vars define ADMIN_USERNAME and (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH),
 * automatically guarantee that admin exists in SQLite (even on fresh serverless /tmp cold starts)
 * so the /admin gate never reverts to initial setup.
 */
export function ensureEnvAdminSeeded(): void {
  const envUser = (process.env.ADMIN_USERNAME || "avijit").trim().toLowerCase();
  const envHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  const envPlain = process.env.ADMIN_PASSWORD || "Avijit@2008";

  const db = getDb();
  const existing = db
    .prepare("SELECT id, password_hash FROM users WHERE LOWER(username) = ?")
    .get(envUser) as { id: number; password_hash: string } | undefined;

  const now = new Date().toISOString();
  const desiredHash = envHash.includes(":") ? envHash : hashPassword(envPlain);

  if (!existing) {
    const email = (
      process.env.ADMIN_EMAIL ||
      getSiteConfig().contact.ownerEmail ||
      "dasavijit427488@gmail.com"
    ).trim();
    db.prepare(
      `INSERT INTO users (username, display_name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'owner', ?, ?)`
    ).run(envUser, process.env.ADMIN_DISPLAY_NAME || "Avijit Das", email, desiredHash, now, now);
    return;
  }

  // Keep primary owner credentials aligned when fixed defaults apply
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD && envUser === "avijit") {
    if (!verifyPassword("Avijit@2008", existing.password_hash)) {
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
        desiredHash,
        now,
        existing.id
      );
    }
  }
}

export function getUserCount(): number {
  ensureEnvAdminSeeded();
  const db = getDb();
  const res = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  return Number(res.c);
}

export function listUsers(): PublicUser[] {
  ensureEnvAdminSeeded();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM users ORDER BY id ASC")
    .all() as unknown as UserRow[];
  return rows.map(rowToPublicUser);
}

export function createUser(input: {
  username: string;
  displayName: string;
  email?: string;
  password: string;
  role?: string;
}): PublicUser {
  const db = getDb();
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    throw new Error(
      "User ID must be 3-32 characters (letters, numbers, dot, underscore, or hyphen)."
    );
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE LOWER(username) = ?")
    .get(username);
  if (existing) {
    throw new Error("This User ID is already registered.");
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(input.password);
  const res = db
    .prepare(
      `INSERT INTO users (username, display_name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      username,
      input.displayName.trim() || username,
      (input.email ?? "").trim(),
      passwordHash,
      input.role ?? "client",
      now,
      now
    );

  const created = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(Number(res.lastInsertRowid)) as unknown as UserRow;
  return rowToPublicUser(created);
}

export function authenticateUser(
  usernameInput: string,
  password: string
): PublicUser | null {
  ensureEnvAdminSeeded();
  const db = getDb();
  const username = usernameInput.trim().toLowerCase();
  if (!username || !password) return null;

  const row = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = ?")
    .get(username) as unknown as UserRow | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return rowToPublicUser(row);
}

export function createSession(userId: number, userObj?: PublicUser): {
  rawToken: string;
  expiresAt: Date;
} {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  let u = userObj;
  if (!u) {
    const row = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as unknown as UserRow | undefined;
    if (row) u = rowToPublicUser(row);
  }

  // Signed stateless token works even across cold Vercel serverless containers
  const rawToken = signPayload({
    uid: userId,
    u: u?.username || "admin",
    name: u?.displayName || "Admin",
    email: u?.email || "",
    role: u?.role || "owner",
    createdAt: u?.createdAt || now.toISOString(),
    jti: crypto.randomBytes(12).toString("hex"),
    exp: expiresAt.getTime(),
  });
  const tokenHash = hashToken(rawToken);

  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now.toISOString());
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(tokenHash, userId, expiresAt.toISOString(), now.toISOString());

  return { rawToken, expiresAt };
}

export function deleteSessionByToken(rawToken: string | undefined): void {
  if (!rawToken) return;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(rawToken));
}

export async function getSessionUser(): Promise<PublicUser | null> {
  ensureEnvAdminSeeded();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const db = getDb();
  const tokenHash = hashToken(rawToken);
  const nowIso = new Date().toISOString();

  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(tokenHash, nowIso) as unknown as UserRow | undefined;

  if (row) return rowToPublicUser(row);

  // Fallback: verify stateless HMAC session across serverless cold containers
  const signed = verifySignedPayload<{
    uid: number;
    u: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    exp: number;
  }>(rawToken);
  if (!signed || !signed.exp || Date.now() > signed.exp) {
    return null;
  }

  const byName = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = ?")
    .get(String(signed.u).toLowerCase()) as unknown as UserRow | undefined;
  if (byName) return rowToPublicUser(byName);

  return {
    id: Number(signed.uid) || 1,
    username: String(signed.u),
    displayName: String(signed.name || signed.u),
    email: String(signed.email || ""),
    role: String(signed.role || "owner"),
    createdAt: String(signed.createdAt || nowIso),
  };
}

export function findUserForReset(identifierInput: string): {
  user: PublicUser;
  targetEmail: string;
} | null {
  ensureEnvAdminSeeded();
  const db = getDb();
  const q = identifierInput.trim().toLowerCase();
  if (!q) return null;

  let row = db
    .prepare(
      "SELECT * FROM users WHERE LOWER(username) = ? OR (email != '' AND LOWER(email) = ?) LIMIT 1"
    )
    .get(q, q) as unknown as UserRow | undefined;

  const ownerFallbackEmail = (
    process.env.ADMIN_EMAIL ||
    getSiteConfig().contact.ownerEmail ||
    "dasavijit427488@gmail.com"
  ).trim();

  if (!row) {
    if (
      q === ownerFallbackEmail.toLowerCase() ||
      q === "avijit" ||
      q === "admin" ||
      q.includes("dasavijit") ||
      q.includes("avijit")
    ) {
      row = db
        .prepare("SELECT * FROM users ORDER BY id ASC LIMIT 1")
        .get() as unknown as UserRow | undefined;
    }
  }

  if (!row) return null;
  const targetEmail = (row.email || ownerFallbackEmail || "dasavijit427488@gmail.com").trim();
  if (!targetEmail || !targetEmail.includes("@")) return null;

  return { user: rowToPublicUser(row), targetEmail };
}

export function createResetChallengeCookie(input: {
  userId: number;
  username: string;
  email: string;
}): { code: string; cookieToken: string; expiresAt: Date } {
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  const codeHash = hashToken(`${input.username}:${code}:${getSigningSecret()}`);
  const cookieToken = signPayload({
    uid: input.userId,
    u: input.username,
    email: input.email,
    ch: codeHash,
    exp: expiresAt.getTime(),
  });
  return { code, cookieToken, expiresAt };
}

export function verifyResetAndApplyPassword(
  cookieToken: string | undefined,
  codeInput: string,
  newPassword: string
): { user: PublicUser; passwordHash: string } {
  if (!cookieToken) {
    throw new Error("Reset session expired or missing. Please request a new code.");
  }
  const parsed = verifySignedPayload<{
    uid: number;
    u: string;
    email: string;
    ch: string;
    exp: number;
  }>(cookieToken);

  if (!parsed || !parsed.exp || Date.now() > parsed.exp) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  const cleanCode = codeInput.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error("Please enter the 6-digit verification code sent to your email.");
  }

  const expectedHash = hashToken(`${parsed.u}:${cleanCode}:${getSigningSecret()}`);
  const a = Buffer.from(parsed.ch, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid verification code. Please check your email and try again.");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  const db = getDb();
  const nextHash = hashPassword(newPassword);
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = ?")
    .get(parsed.u.toLowerCase()) as unknown as UserRow | undefined;

  if (existing) {
    db.prepare(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
    ).run(nextHash, now, existing.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
    const updated = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(existing.id) as unknown as UserRow;
    return { user: rowToPublicUser(updated), passwordHash: nextHash };
  }

  const res = db
    .prepare(
      `INSERT INTO users (username, display_name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'owner', ?, ?)`
    )
    .run(parsed.u.toLowerCase(), parsed.u, parsed.email, nextHash, now, now);

  const created = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(Number(res.lastInsertRowid)) as unknown as UserRow;
  return { user: rowToPublicUser(created), passwordHash: nextHash };
}

export function getUserPasswordHash(userId: number): string {
  const db = getDb();
  const row = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(userId) as { password_hash: string } | undefined;
  return row?.password_hash ?? "";
}

export function updateUserAccount(
  userId: number,
  input: {
    currentPassword: string;
    newUsername?: string;
    displayName?: string;
    email?: string;
    newPassword?: string;
  }
): PublicUser {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as unknown as UserRow | undefined;
  if (!existing) {
    throw new Error("Account not found.");
  }
  if (!verifyPassword(input.currentPassword, existing.password_hash)) {
    throw new Error("Current password is incorrect.");
  }

  const nextUsername = input.newUsername
    ? input.newUsername.trim().toLowerCase()
    : existing.username;

  if (!/^[a-z0-9_.-]{3,32}$/.test(nextUsername)) {
    throw new Error(
      "New User ID must be 3-32 characters (letters, numbers, dot, underscore, or hyphen)."
    );
  }

  if (nextUsername !== existing.username) {
    const conflict = db
      .prepare("SELECT id FROM users WHERE LOWER(username) = ? AND id != ?")
      .get(nextUsername, userId);
    if (conflict) {
      throw new Error("That User ID is already in use.");
    }
  }

  let nextPasswordHash = existing.password_hash;
  if (input.newPassword && input.newPassword.length > 0) {
    if (input.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    nextPasswordHash = hashPassword(input.newPassword);
  }

  const nextDisplay = (input.displayName ?? existing.display_name).trim() || nextUsername;
  const nextEmail = (input.email ?? existing.email).trim();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE users
     SET username = ?, display_name = ?, email = ?, password_hash = ?, updated_at = ?
     WHERE id = ?`
  ).run(nextUsername, nextDisplay, nextEmail, nextPasswordHash, now, userId);

  const updated = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as unknown as UserRow;
  return rowToPublicUser(updated);
}

export function deleteSecondaryUser(
  actingUserId: number,
  targetUserId: number
): void {
  if (actingUserId === targetUserId) {
    throw new Error("You cannot delete your own active account.");
  }
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id = ?").run(targetUserId);
}
