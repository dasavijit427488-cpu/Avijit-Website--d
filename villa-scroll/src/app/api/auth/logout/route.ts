import { NextRequest, NextResponse } from "next/server";
import { deleteSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  deleteSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    expires: new Date(0),
    path: "/",
  });
  return response;
}

