import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";
import { isCloudKvConfigured, isServerlessRuntime } from "@/lib/cloudStore";
import {
  deleteMediaAssetCloud,
  insertMediaAssetCloud,
  listMediaAssetsCloud,
  UPLOADS_DIR,
} from "@/lib/db";

const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel serverless payload compatible)

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, assets: await listMediaAssetsCloud() });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Image exceeds 4 MB limit." },
        { status: 400 }
      );
    }

    const mime = file.type || "image/jpeg";
    const extFromMime = ALLOWED_EXT[mime];
    const origExt = path.extname(file.name || "").toLowerCase();
    const validExt =
      extFromMime ||
      ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(origExt) ? origExt : "");

    if (!validExt) {
      return NextResponse.json(
        { ok: false, error: "Unsupported image format. Use JPG, PNG, WebP, GIF, or SVG." },
        { status: 400 }
      );
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${validExt}`;
    const destPath = path.join(UPLOADS_DIR, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      fs.writeFileSync(destPath, buffer);
    } catch {
      // Ignore ephemeral disk write failure if Cloud KV / data URL is used
    }

    const base64Str = buffer.toString("base64");
    const useInlineDataUrl =
      isServerlessRuntime() && !isCloudKvConfigured() && buffer.length <= 900 * 1024;
    const url = useInlineDataUrl
      ? `data:${mime};base64,${base64Str}`
      : `/api/media/${uniqueName}`;

    const asset = await insertMediaAssetCloud(
      {
        filename: uniqueName,
        originalName: file.name || uniqueName,
        mimeType: mime,
        sizeBytes: file.size,
        url,
        uploadedBy: user.username,
      },
      isCloudKvConfigured() ? base64Str : undefined
    );

    return NextResponse.json({ ok: true, url, asset });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "Invalid asset id." }, { status: 400 });
  }

  const removed = await deleteMediaAssetCloud(id);
  if (removed) {
    const filePath = path.join(UPLOADS_DIR, path.basename(removed.filename));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  return NextResponse.json({ ok: true });
}
