import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSiteConfigCloud,
  resetAllSiteConfigCloud,
  saveAllSiteConfigCloud,
  saveSiteSectionCloud,
} from "@/lib/db";
import type { SiteConfig } from "@/lib/defaultSiteConfig";

export async function GET() {
  try {
    const { config, cloudSynced, isServerless } = await getSiteConfigCloud();
    return NextResponse.json(
      { ok: true, config, cloudSynced, isServerless },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load site config." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized — Please sign in again." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body?.section && body?.data !== undefined) {
      const sectionKey = String(body.section) as keyof SiteConfig;
      const validKeys: (keyof SiteConfig)[] = [
        "brand",
        "hero",
        "rooms",
        "materiality",
        "masterplan",
        "contact",
        "design",
      ];
      if (!validKeys.includes(sectionKey)) {
        return NextResponse.json({ ok: false, error: "Invalid section key." }, { status: 400 });
      }
      const res = await saveSiteSectionCloud(sectionKey, body.data, user.username);
      return NextResponse.json({ ok: true, ...res });
    }

    const res = await saveAllSiteConfigCloud(body?.config ?? body ?? {}, user.username);
    return NextResponse.json({ ok: true, ...res });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to save site config." },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized — Please sign in again." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action === "reset") {
      const res = await resetAllSiteConfigCloud(user.username);
      return NextResponse.json({ ok: true, ...res });
    }
    return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Reset failed." },
      { status: 500 }
    );
  }
}
