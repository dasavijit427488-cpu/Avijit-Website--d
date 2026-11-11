import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  createSession,
  getUserCount,
  SESSION_COOKIE_NAME,
  syncUsersFromCloud,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await syncUsersFromCloud();
    if (getUserCount() === 0) {
      return NextResponse.json(
        { ok: false, error: "No admin account created yet. Complete setup first." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    const user = authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid User ID or Password." },
        { status: 401 }
      );
    }

    const { rawToken } = createSession(user.id, user);
    const response = NextResponse.json({ ok: true, user });
    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Authentication error.",
      },
      { status: 500 }
    );
  }
}

