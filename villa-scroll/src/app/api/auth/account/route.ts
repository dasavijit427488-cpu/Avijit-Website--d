import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  deleteSecondaryUser,
  getSessionUser,
  getUserPasswordHash,
  listUsers,
  pushUsersToCloud,
  syncUsersFromCloud,
  updateUserAccount,
} from "@/lib/auth";
import { isCloudKvConfigured, isServerlessRuntime } from "@/lib/cloudStore";
import { getAppSettingCloud, setAppSettingCloud } from "@/lib/db";
import { sendRealEmail } from "@/lib/email";

export async function GET() {
  await syncUsersFromCloud();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const users = listUsers();
  const smtpUser = (await getAppSettingCloud("smtp_user")) || process.env.SMTP_USER || "";
  const dbPass = await getAppSettingCloud("smtp_pass");
  const hasDbSmtpPass = Boolean(dbPass);
  const hasEnvSmtpPass = Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);
  const passwordHash = getUserPasswordHash(user.id);
  const isEnvLocked = Boolean(
    process.env.ADMIN_USERNAME &&
      (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH)
  );

  return NextResponse.json({
    ok: true,
    user,
    users,
    smtp: {
      smtpUser,
      hasDbSmtpPass,
      hasEnvSmtpPass,
    },
    deployment: {
      isServerless: isServerlessRuntime(),
      cloudSynced: !isServerlessRuntime() || isCloudKvConfigured(),
      isEnvLocked,
      passwordHash,
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

    if (body?.action === "test_smtp") {
      const savedSmtpUser = await getAppSettingCloud("smtp_user");
      const targetEmail = String(body?.toEmail || user.email || savedSmtpUser || process.env.SMTP_USER || "").trim();
      if (!targetEmail) {
        return NextResponse.json({ ok: false, error: "Provide an email address to test." }, { status: 400 });
      }
      const res = await sendRealEmail({
        to: targetEmail,
        subject: "Avijit Villa — Email Delivery Test Successful",
        text: "Your website real-email delivery (Contact Form & Admin Password Reset Code) is active and working properly.",
        html: "<div style='font-family:sans-serif;padding:20px;border:1px solid #d4af37;border-radius:12px;'><h2>Email Delivery Active</h2><p>Your Avijit Villa Contact Form &amp; Password Reset OTP email delivery is working properly.</p></div>",
      });
      return NextResponse.json({ ok: res.dispatched, message: res.message }, { status: res.dispatched ? 200 : 400 });
    }

    if (body?.action === "update_smtp") {
      const smtpUser = String(body?.smtpUser ?? "").trim();
      const smtpPass = String(body?.smtpPass ?? "").trim();
      await setAppSettingCloud("smtp_user", smtpUser);
      if (smtpPass !== "__KEEP__") {
        await setAppSettingCloud("smtp_pass", smtpPass);
      }
      return NextResponse.json({
        ok: true,
        smtp: {
          smtpUser,
          hasDbSmtpPass: Boolean(await getAppSettingCloud("smtp_pass")),
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
    await pushUsersToCloud();

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
    await pushUsersToCloud();
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

