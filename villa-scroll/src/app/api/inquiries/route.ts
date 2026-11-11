import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  deleteInquiryCloud,
  listInquiriesCloud,
  updateInquiryStatusCloud,
} from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, inquiries: await listInquiriesCloud() });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id);
    const status = String(body?.status ?? "").trim();
    if (!Number.isFinite(id) || !["new", "read", "replied", "archived"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid inquiry update." }, { status: 400 });
    }
    await updateInquiryStatusCloud(id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Update failed." },
      { status: 400 }
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
    return NextResponse.json({ ok: false, error: "Invalid id." }, { status: 400 });
  }

  await deleteInquiryCloud(id);
  return NextResponse.json({ ok: true });
}
