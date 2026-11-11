import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getUserCount,
  pushUsersToCloud,
  SESSION_COOKIE_NAME,
  syncUsersFromCloud,
} from "@/lib/auth";
import { isCloudKvConfigured, isServerlessRuntime } from "@/lib/cloudStore";

export async function POST(request: NextRequest) {
  try {
    await syncUsersFromCloud();
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

    await pushUsersToCloud();

    const { rawToken, expiresAt } = createSession(user.id, user);
    const response = NextResponse.json({
      ok: true,
      user,
      isServerless: isServerlessRuntime(),
      cloudSynced: isCloudKvConfigured(),
    });
    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";
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
        error: err instanceof Error ? err.message : "Setup failed.",
      },
      { status: 400 }
    );
  }
}

