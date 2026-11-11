import { NextRequest, NextResponse } from "next/server";
import { deleteSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  deleteSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  return response;
}

