import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  deleteSecondaryUser,
  getSessionUser,
  listUsers,
  updateUserAccount,
} from "@/lib/auth";
import { getAppSetting, setAppSetting } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const users = listUsers();
  const smtpUser = getAppSetting("smtp_user") || process.env.SMTP_USER || "";
  const hasDbSmtpPass = Boolean(getAppSetting("smtp_pass"));
  const hasEnvSmtpPass = Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);

  return NextResponse.json({
    ok: true,
    user,
    users,
    smtp: {
      smtpUser,
      hasDbSmtpPass,
      hasEnvSmtpPass,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body?.action === "update_smtp") {
      const smtpUser = String(body?.smtpUser ?? "").trim();
      const smtpPass = String(body?.smtpPass ?? "").trim();
      setAppSetting("smtp_user", smtpUser);
      if (smtpPass !== "__KEEP__") {
        setAppSetting("smtp_pass", smtpPass);
      }
      return NextResponse.json({
        ok: true,
        smtp: {
          smtpUser,
          hasDbSmtpPass: Boolean(getAppSetting("smtp_pass")),
          hasEnvSmtpPass: Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS),
        },
      });
    }

    const updated = updateUserAccount(user.id, {
      currentPassword: String(body?.currentPassword ?? ""),
      newUsername: body?.newUsername !== undefined ? String(body.newUsername) : undefined,
      displayName: body?.displayName !== undefined ? String(body.displayName) : undefined,
      email: body?.email !== undefined ? String(body.email) : undefined,
      newPassword: body?.newPassword !== undefined ? String(body.newPassword) : undefined,
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Update failed." },
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
    const body = await request.json();
    const created = createUser({
      username: String(body?.username ?? ""),
      displayName: String(body?.displayName ?? ""),
      email: String(body?.email ?? ""),
      password: String(body?.password ?? ""),
      role: "client",
    });
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "User creation failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const idParam = request.nextUrl.searchParams.get("id");
    const targetId = Number(idParam);
    if (!Number.isFinite(targetId)) {
      return NextResponse.json({ ok: false, error: "Invalid user id." }, { status: 400 });
    }
    deleteSecondaryUser(user.id, targetId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Delete failed." },
      { status: 400 }
    );
  }
}

