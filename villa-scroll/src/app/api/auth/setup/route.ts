import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getUserCount,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (getUserCount() > 0) {
      return NextResponse.json(
        { ok: false, error: "Initial setup is already completed. Please sign in." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const displayName = String(body?.displayName ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    const user = createUser({
      username,
      displayName: displayName || username,
      email,
      password,
      role: "owner",
    });

    const { rawToken, expiresAt } = createSession(user.id);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      expires: expiresAt,
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Setup failed.",
      },
      { status: 400 }
    );
  }
}

