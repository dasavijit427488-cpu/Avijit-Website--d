import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteInquiry, listInquiries, updateInquiryStatus } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, inquiries: listInquiries() });
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
    updateInquiryStatus(id, status);
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

  deleteInquiry(id);
  return NextResponse.json({ ok: true });
}

