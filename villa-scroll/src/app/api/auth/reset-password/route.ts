import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  pushUsersToCloud,
  RESET_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  syncUsersFromCloud,
  verifyResetAndApplyPassword,
} from "@/lib/auth";
import { isServerlessRuntime } from "@/lib/cloudStore";

export async function POST(request: NextRequest) {
  try {
    await syncUsersFromCloud();
    const body = await request.json();
    const code = String(body?.code ?? "").trim();
    const newPassword = String(body?.newPassword ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: "New passwords do not match." },
        { status: 400 }
      );
    }

    const resetCookie = request.cookies.get(RESET_COOKIE_NAME)?.value;
    const { user, passwordHash } = verifyResetAndApplyPassword(
      resetCookie,
      code,
      newPassword
    );
    await pushUsersToCloud();

    const { rawToken, expiresAt } = createSession(user.id, user);
    const response = NextResponse.json({
      ok: true,
      user,
      newPasswordHash: passwordHash,
      isServerless: isServerlessRuntime(),
    });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(RESET_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Password reset failed.",
      },
      { status: 400 }
    );
  }
}

