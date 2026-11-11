import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSiteConfig,
  resetAllSiteConfig,
  saveAllSiteConfig,
  saveSiteSection,
} from "@/lib/db";
import type { SiteConfig } from "@/lib/defaultSiteConfig";

export async function GET() {
  try {
    const config = getSiteConfig();
    return NextResponse.json(
      { ok: true, config },
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
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
      saveSiteSection(sectionKey, body.data, user.username);
      return NextResponse.json({ ok: true, config: getSiteConfig() });
    }

    const updated = saveAllSiteConfig(body?.config ?? body ?? {}, user.username);
    return NextResponse.json({ ok: true, config: updated });
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
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action === "reset") {
      const config = resetAllSiteConfig(user.username);
      return NextResponse.json({ ok: true, config });
    }
    return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Reset failed." },
      { status: 500 }
    );
  }
}

