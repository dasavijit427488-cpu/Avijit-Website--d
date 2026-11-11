import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import os from "os";
import path from "path";
import {
  DEFAULT_SITE_CONFIG,
  type SiteConfig,
} from "./defaultSiteConfig";
import {
  isCloudKvConfigured,
  isServerlessRuntime,
  kvDelete,
  kvGetJson,
  kvSetJson,
} from "./cloudStore";

function resolveDataDir(): string {
  const localData = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localData)) {
      fs.mkdirSync(localData, { recursive: true });
    }
    const probeFile = path.join(localData, ".rw_check");
    fs.writeFileSync(probeFile, "ok");
    fs.unlinkSync(probeFile);
    return localData;
  } catch {
    // Vercel / Netlify serverless deployments mount the app directory read-only; /tmp is writable
    const tmpData = path.join(os.tmpdir(), "villa-scroll-data");
    try {
      if (!fs.existsSync(tmpData)) {
        fs.mkdirSync(tmpData, { recursive: true });
      }
    } catch {
      // Ignore directory probe failure; getSiteConfig still falls back to DEFAULT_SITE_CONFIG
    }
    return tmpData;
  }
}

export const DATA_DIR = resolveDataDir();
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const DB_PATH = path.join(DATA_DIR, "villa.db");

const SECTION_KEYS: (keyof SiteConfig)[] = [
  "brand",
  "hero",
  "rooms",
  "materiality",
  "masterplan",
  "contact",
  "design",
];

let dbInstance: DatabaseSync | null = null;

function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS site_sections (
      section_key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL DEFAULT 'system'
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL DEFAULT 'contact_form',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      arrival_protocol TEXT NOT NULL DEFAULT '',
      requirement TEXT NOT NULL,
      email_dispatched INTEGER NOT NULL DEFAULT 0,
      delivery_channel TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      url TEXT NOT NULL,
      uploaded_by TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  // Seed default sections if missing
  const now = new Date().toISOString();
  const insertStmt = db.prepare(
    `INSERT OR IGNORE INTO site_sections (section_key, data_json, updated_at, updated_by)
     VALUES (?, ?, ?, 'system')`
  );
  for (const key of SECTION_KEYS) {
    insertStmt.run(key, JSON.stringify(DEFAULT_SITE_CONFIG[key]), now);
  }

  // Sync previously seeded room scroll timings if still on legacy frame bounds
  const existingRoomsRow = db
    .prepare("SELECT data_json FROM site_sections WHERE section_key = 'rooms'")
    .get() as { data_json: string } | undefined;
  if (existingRoomsRow?.data_json) {
    try {
      const parsed = JSON.parse(existingRoomsRow.data_json);
      if (
        Array.isArray(parsed) &&
        parsed.some(
          (r) =>
            (r?.id === "bedroom" && r?.exitEnd === 0.72) ||
            (r?.id === "bathroom" && r?.enterStart === 0.75)
        )
      ) {
        const defaultMap = new Map(
          DEFAULT_SITE_CONFIG.rooms.map((r) => [r.id, r])
        );
        const migrated = parsed.map((r) => {
          const def = defaultMap.get(r?.id);
          if (!def) return r;
          return {
            ...r,
            enterStart: def.enterStart,
            enterEnd: def.enterEnd,
            exitStart: def.exitStart,
            exitEnd: def.exitEnd,
          };
        });
        db.prepare(
          "UPDATE site_sections SET data_json = ?, updated_at = ? WHERE section_key = 'rooms'"
        ).run(JSON.stringify(migrated), now);
      }
    } catch {
      // Ignore parse error
    }
  }

  // Ensure design section defaults cleanly
  const existingDesignRow = db
    .prepare("SELECT data_json FROM site_sections WHERE section_key = 'design'")
    .get() as { data_json: string } | undefined;
  if (existingDesignRow?.data_json) {
    try {
      const parsedDesign = JSON.parse(existingDesignRow.data_json);
      let changed = false;
      if (
        (!parsedDesign?.roomsPlacement || parsedDesign?.roomsPlacement === "top-left") &&
        parsedDesign?.dynamicUrlSync === undefined
      ) {
        parsedDesign.roomsPlacement = "desktop-alternating";
        changed = true;
      }
      if (parsedDesign?.dynamicUrlSync === undefined) {
        parsedDesign.dynamicUrlSync = true;
        changed = true;
      }
      if (parsedDesign?.imageFraming && typeof parsedDesign.imageFraming === "object") {
        for (const [slotKey, framing] of Object.entries(parsedDesign.imageFraming)) {
          const f = framing as { posX?: number; posY?: number; zoom?: number } | null;
          if (f && f.posX === 15 && f.posY === 15 && f.zoom === 132) {
            parsedDesign.imageFraming[slotKey] = { ...f, posX: 50, posY: 50, zoom: 100 };
            changed = true;
          }
        }
      }
      if (changed) {
        db.prepare(
          "UPDATE site_sections SET data_json = ?, updated_at = ? WHERE section_key = 'design'"
        ).run(JSON.stringify(parsedDesign), now);
      }
    } catch {
      // Ignore parse error
    }
  }
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    ensureDirs();
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function mergeSection<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(stored) ? stored : defaults) as T;
  }
  if (defaults && typeof defaults === "object") {
    const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      const storedObj = stored as Record<string, unknown>;
      for (const k of Object.keys(out)) {
        if (k in storedObj && storedObj[k] !== undefined) {
          out[k] = mergeSection(out[k], storedObj[k]);
        }
      }
      for (const k of Object.keys(storedObj)) {
        if (!(k in out) && storedObj[k] !== undefined) {
          out[k] = storedObj[k];
        }
      }
    }
    return out as T;
  }
  return (stored !== undefined ? stored : defaults) as T;
}

export function getSiteConfig(): SiteConfig {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT section_key, data_json FROM site_sections").all() as Array<{
      section_key: string;
      data_json: string;
    }>;

    const map = new Map<string, unknown>();
    for (const row of rows) {
      try {
        map.set(row.section_key, JSON.parse(row.data_json));
      } catch {
        // Ignore malformed JSON and fall back to defaults
      }
    }

    return {
      brand: mergeSection(DEFAULT_SITE_CONFIG.brand, map.get("brand")),
      hero: mergeSection(DEFAULT_SITE_CONFIG.hero, map.get("hero")),
      rooms: mergeSection(DEFAULT_SITE_CONFIG.rooms, map.get("rooms")),
      materiality: mergeSection(DEFAULT_SITE_CONFIG.materiality, map.get("materiality")),
      masterplan: mergeSection(DEFAULT_SITE_CONFIG.masterplan, map.get("masterplan")),
      contact: mergeSection(DEFAULT_SITE_CONFIG.contact, map.get("contact")),
      design: mergeSection(DEFAULT_SITE_CONFIG.design, map.get("design")),
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export function saveSiteSection<K extends keyof SiteConfig>(
  sectionKey: K,
  value: SiteConfig[K],
  updatedBy: string
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO site_sections (section_key, data_json, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(section_key) DO UPDATE SET
       data_json = excluded.data_json,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`
  ).run(sectionKey, JSON.stringify(value), now, updatedBy);
}

export function saveAllSiteConfig(config: Partial<SiteConfig>, updatedBy: string): SiteConfig {
  const current = getSiteConfig();
  for (const key of SECTION_KEYS) {
    if (key in config && config[key] !== undefined) {
      const merged = mergeSection(current[key], config[key]);
      saveSiteSection(key, merged as SiteConfig[typeof key], updatedBy);
    }
  }
  return getSiteConfig();
}

export function resetAllSiteConfig(updatedBy: string): SiteConfig {
  for (const key of SECTION_KEYS) {
    saveSiteSection(key, DEFAULT_SITE_CONFIG[key], updatedBy);
  }
  return getSiteConfig();
}

export function getAppSetting(key: string): string {
  const db = getDb();
  const row = db
    .prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?")
    .get(key) as { setting_value: string } | undefined;
  return row?.setting_value ?? "";
}

export function setAppSetting(key: string, value: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       setting_value = excluded.setting_value,
       updated_at = excluded.updated_at`
  ).run(key, value, now);
}

export interface InquiryRecord {
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

export function insertInquiry(input: {
  source?: string;
  name: string;
  email: string;
  phone?: string;
  arrivalProtocol?: string;
  requirement: string;
  emailDispatched: boolean;
  deliveryChannel: string;
}): number {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db
    .prepare(
      `INSERT INTO inquiries (
        source, name, email, phone, arrival_protocol, requirement,
        email_dispatched, delivery_channel, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    )
    .run(
      input.source ?? "contact_form",
      input.name,
      input.email,
      input.phone ?? "",
      input.arrivalProtocol ?? "",
      input.requirement,
      input.emailDispatched ? 1 : 0,
      input.deliveryChannel,
      now
    );
  return Number(res.lastInsertRowid);
}

export function listInquiries(): InquiryRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM inquiries ORDER BY id DESC LIMIT 250")
    .all() as unknown as InquiryRecord[];
}

export function updateInquiryStatus(id: number, status: string): void {
  const db = getDb();
  db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, id);
}

export function deleteInquiry(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
}

export interface MediaAssetRecord {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export function insertMediaAsset(input: {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
}): MediaAssetRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db
    .prepare(
      `INSERT INTO media_assets (filename, original_name, mime_type, size_bytes, url, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.filename,
      input.originalName,
      input.mimeType,
      input.sizeBytes,
      input.url,
      input.uploadedBy,
      now
    );
  return {
    id: Number(res.lastInsertRowid),
    filename: input.filename,
    original_name: input.originalName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    url: input.url,
    uploaded_by: input.uploadedBy,
    created_at: now,
  };
}

export function listMediaAssets(): MediaAssetRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM media_assets ORDER BY id DESC LIMIT 200")
    .all() as unknown as MediaAssetRecord[];
}

export function deleteMediaAsset(id: number): MediaAssetRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM media_assets WHERE id = ?")
    .get(id) as unknown as MediaAssetRecord | undefined;
  if (!row) return null;
  db.prepare("DELETE FROM media_assets WHERE id = ?").run(id);
  return row;
}

export function getDatabaseStats(): {
  usersCount: number;
  sectionsCount: number;
  inquiriesCount: number;
  mediaCount: number;
  dbSizeKb: number;
} {
  const db = getDb();
  const usersCount = Number((db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c);
  const sectionsCount = Number(
    (db.prepare("SELECT COUNT(*) as c FROM site_sections").get() as { c: number }).c
  );
  const inquiriesCount = Number(
    (db.prepare("SELECT COUNT(*) as c FROM inquiries").get() as { c: number }).c
  );
  const mediaCount = Number(
    (db.prepare("SELECT COUNT(*) as c FROM media_assets").get() as { c: number }).c
  );
  let dbSizeKb = 0;
  try {
    dbSizeKb = Math.round(fs.statSync(DB_PATH).size / 1024);
  } catch {
    dbSizeKb = 0;
  }
  return { usersCount, sectionsCount, inquiriesCount, mediaCount, dbSizeKb };
}

/* ------------------------------------------------------------------ */
/*  Cloud-Synced Async Persistence (Upstash / Vercel KV + SQLite)     */
/* ------------------------------------------------------------------ */

const KV_SITE_KEY = "villa:site_config";
const KV_SETTINGS_KEY = "villa:app_settings";
const KV_INQUIRIES_KEY = "villa:inquiries";
const KV_MEDIA_KEY = "villa:media_assets";

function mergeFullConfig(raw: Partial<SiteConfig> | null | undefined): SiteConfig {
  if (!raw || typeof raw !== "object") return getSiteConfig();
  return {
    brand: mergeSection(DEFAULT_SITE_CONFIG.brand, raw.brand),
    hero: mergeSection(DEFAULT_SITE_CONFIG.hero, raw.hero),
    rooms: mergeSection(DEFAULT_SITE_CONFIG.rooms, raw.rooms),
    materiality: mergeSection(DEFAULT_SITE_CONFIG.materiality, raw.materiality),
    masterplan: mergeSection(DEFAULT_SITE_CONFIG.masterplan, raw.masterplan),
    contact: mergeSection(DEFAULT_SITE_CONFIG.contact, raw.contact),
    design: mergeSection(DEFAULT_SITE_CONFIG.design, raw.design),
  };
}

export async function getSiteConfigCloud(): Promise<{
  config: SiteConfig;
  cloudSynced: boolean;
  isServerless: boolean;
}> {
  const isServerless = isServerlessRuntime();
  if (isCloudKvConfigured()) {
    const remote = await kvGetJson<Partial<SiteConfig>>(KV_SITE_KEY);
    if (remote) {
      const merged = mergeFullConfig(remote);
      try {
        saveAllSiteConfig(merged, "cloud_sync");
      } catch {
        // Ignore local cache write errors
      }
      return { config: merged, cloudSynced: true, isServerless };
    }
  }
  return {
    config: getSiteConfig(),
    cloudSynced: !isServerless || isCloudKvConfigured(),
    isServerless,
  };
}

export async function saveSiteSectionCloud<K extends keyof SiteConfig>(
  sectionKey: K,
  value: SiteConfig[K],
  updatedBy: string
): Promise<{ config: SiteConfig; cloudSynced: boolean; isServerless: boolean }> {
  const isServerless = isServerlessRuntime();
  if (isCloudKvConfigured()) {
    const { config: current } = await getSiteConfigCloud();
    const mergedSection = mergeSection(current[sectionKey], value);
    const nextConfig: SiteConfig = { ...current, [sectionKey]: mergedSection };
    try {
      saveAllSiteConfig(nextConfig, updatedBy);
    } catch {
      // Ignore local SQLite write failure if read-only
    }
    const ok = await kvSetJson(KV_SITE_KEY, nextConfig);
    return { config: nextConfig, cloudSynced: ok, isServerless };
  }

  saveSiteSection(sectionKey, value, updatedBy);
  return {
    config: getSiteConfig(),
    cloudSynced: !isServerless,
    isServerless,
  };
}

export async function saveAllSiteConfigCloud(
  incoming: Partial<SiteConfig>,
  updatedBy: string
): Promise<{ config: SiteConfig; cloudSynced: boolean; isServerless: boolean }> {
  const isServerless = isServerlessRuntime();
  if (isCloudKvConfigured()) {
    const { config: current } = await getSiteConfigCloud();
    const nextConfig: SiteConfig = {
      brand: incoming.brand !== undefined ? mergeSection(current.brand, incoming.brand) : current.brand,
      hero: incoming.hero !== undefined ? mergeSection(current.hero, incoming.hero) : current.hero,
      rooms: incoming.rooms !== undefined ? mergeSection(current.rooms, incoming.rooms) : current.rooms,
      materiality:
        incoming.materiality !== undefined
          ? mergeSection(current.materiality, incoming.materiality)
          : current.materiality,
      masterplan:
        incoming.masterplan !== undefined
          ? mergeSection(current.masterplan, incoming.masterplan)
          : current.masterplan,
      contact: incoming.contact !== undefined ? mergeSection(current.contact, incoming.contact) : current.contact,
      design: incoming.design !== undefined ? mergeSection(current.design, incoming.design) : current.design,
    };
    try {
      saveAllSiteConfig(nextConfig, updatedBy);
    } catch {
      // Ignore local cache write failure
    }
    const ok = await kvSetJson(KV_SITE_KEY, nextConfig);
    return { config: nextConfig, cloudSynced: ok, isServerless };
  }

  const next = saveAllSiteConfig(incoming, updatedBy);
  return {
    config: next,
    cloudSynced: !isServerless,
    isServerless,
  };
}

export async function resetAllSiteConfigCloud(updatedBy: string): Promise<{
  config: SiteConfig;
  cloudSynced: boolean;
  isServerless: boolean;
}> {
  const isServerless = isServerlessRuntime();
  if (isCloudKvConfigured()) {
    try {
      resetAllSiteConfig(updatedBy);
    } catch {
      // Ignore
    }
    const ok = await kvSetJson(KV_SITE_KEY, DEFAULT_SITE_CONFIG);
    return { config: DEFAULT_SITE_CONFIG, cloudSynced: ok, isServerless };
  }
  const next = resetAllSiteConfig(updatedBy);
  return { config: next, cloudSynced: !isServerless, isServerless };
}

export async function getAppSettingCloud(key: string): Promise<string> {
  if (isCloudKvConfigured()) {
    const remote = await kvGetJson<Record<string, string>>(KV_SETTINGS_KEY);
    if (remote && typeof remote[key] === "string") {
      return remote[key];
    }
  }
  return getAppSetting(key);
}

export async function setAppSettingCloud(key: string, value: string): Promise<void> {
  try {
    setAppSetting(key, value);
  } catch {
    // Ignore local SQLite error if read-only
  }
  if (isCloudKvConfigured()) {
    const remote = (await kvGetJson<Record<string, string>>(KV_SETTINGS_KEY)) ?? {};
    remote[key] = value;
    await kvSetJson(KV_SETTINGS_KEY, remote);
  }
}

export async function insertInquiryCloud(input: {
  source?: string;
  name: string;
  email: string;
  phone?: string;
  arrivalProtocol?: string;
  requirement: string;
  emailDispatched: boolean;
  deliveryChannel: string;
}): Promise<number> {
  const id = insertInquiry(input);
  if (isCloudKvConfigured()) {
    const existing = (await kvGetJson<InquiryRecord[]>(KV_INQUIRIES_KEY)) ?? [];
    const nextRecord: InquiryRecord = {
      id: Date.now(),
      source: input.source ?? "contact_form",
      name: input.name,
      email: input.email,
      phone: input.phone ?? "",
      arrival_protocol: input.arrivalProtocol ?? "",
      requirement: input.requirement,
      email_dispatched: input.emailDispatched ? 1 : 0,
      delivery_channel: input.deliveryChannel,
      status: "new",
      created_at: new Date().toISOString(),
    };
    await kvSetJson(KV_INQUIRIES_KEY, [nextRecord, ...existing].slice(0, 250));
    return nextRecord.id;
  }
  return id;
}

export async function listInquiriesCloud(): Promise<InquiryRecord[]> {
  if (isCloudKvConfigured()) {
    const remote = await kvGetJson<InquiryRecord[]>(KV_INQUIRIES_KEY);
    if (Array.isArray(remote)) return remote;
  }
  return listInquiries();
}

export async function updateInquiryStatusCloud(id: number, status: string): Promise<void> {
  try {
    updateInquiryStatus(id, status);
  } catch {
    // Ignore
  }
  if (isCloudKvConfigured()) {
    const remote = (await kvGetJson<InquiryRecord[]>(KV_INQUIRIES_KEY)) ?? [];
    const updated = remote.map((r) => (Number(r.id) === id ? { ...r, status } : r));
    await kvSetJson(KV_INQUIRIES_KEY, updated);
  }
}

export async function deleteInquiryCloud(id: number): Promise<void> {
  try {
    deleteInquiry(id);
  } catch {
    // Ignore
  }
  if (isCloudKvConfigured()) {
    const remote = (await kvGetJson<InquiryRecord[]>(KV_INQUIRIES_KEY)) ?? [];
    await kvSetJson(
      KV_INQUIRIES_KEY,
      remote.filter((r) => Number(r.id) !== id)
    );
  }
}

export async function insertMediaAssetCloud(
  input: {
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    uploadedBy: string;
  },
  base64Payload?: string
): Promise<MediaAssetRecord> {
  const localRec = insertMediaAsset(input);
  if (isCloudKvConfigured()) {
    if (base64Payload) {
      await kvSetJson(`villa:media:blob:${input.filename}`, {
        mimeType: input.mimeType,
        base64: base64Payload,
      });
    }
    const existing = (await kvGetJson<MediaAssetRecord[]>(KV_MEDIA_KEY)) ?? [];
    const cloudRec: MediaAssetRecord = { ...localRec, id: Date.now() };
    await kvSetJson(KV_MEDIA_KEY, [cloudRec, ...existing].slice(0, 200));
    return cloudRec;
  }
  return localRec;
}

export async function listMediaAssetsCloud(): Promise<MediaAssetRecord[]> {
  if (isCloudKvConfigured()) {
    const remote = await kvGetJson<MediaAssetRecord[]>(KV_MEDIA_KEY);
    if (Array.isArray(remote)) return remote;
  }
  return listMediaAssets();
}

export async function deleteMediaAssetCloud(id: number): Promise<MediaAssetRecord | null> {
  const localRemoved = deleteMediaAsset(id);
  if (isCloudKvConfigured()) {
    const remote = (await kvGetJson<MediaAssetRecord[]>(KV_MEDIA_KEY)) ?? [];
    const target = remote.find((a) => Number(a.id) === id) ?? localRemoved;
    await kvSetJson(
      KV_MEDIA_KEY,
      remote.filter((a) => Number(a.id) !== id)
    );
    if (target?.filename) {
      await kvDelete(`villa:media:blob:${target.filename}`);
    }
    return target ?? null;
  }
  return localRemoved;
}

export async function getMediaBlobCloud(
  filename: string
): Promise<{ mimeType: string; base64: string } | null> {
  if (!isCloudKvConfigured()) return null;
  return kvGetJson<{ mimeType: string; base64: string }>(`villa:media:blob:${filename}`);
}


