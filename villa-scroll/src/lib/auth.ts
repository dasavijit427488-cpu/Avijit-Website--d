import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const SESSION_COOKIE_NAME = "villa_admin_session";
const SESSION_TTL_DAYS = 14;

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

export function getUserCount(): number {
  const db = getDb();
  const res = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  return Number(res.c);
}

export function listUsers(): PublicUser[] {
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

export function createSession(userId: number): {
  rawToken: string;
  expiresAt: Date;
} {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  // Clean up expired sessions periodically
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

  if (!row) return null;
  return rowToPublicUser(row);
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

