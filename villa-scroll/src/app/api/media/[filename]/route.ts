import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMediaBlobCloud, UPLOADS_DIR } from "@/lib/db";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const safeName = path.basename(filename || "");
  if (!safeName || safeName.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const fallbackContentType = MIME_BY_EXT[ext] || "application/octet-stream";

  const filePath = path.join(UPLOADS_DIR, safeName);
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": fallbackContentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const cloudBlob = await getMediaBlobCloud(safeName);
  if (cloudBlob?.base64) {
    const buf = Buffer.from(cloudBlob.base64, "base64");
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": cloudBlob.mimeType || fallbackContentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
