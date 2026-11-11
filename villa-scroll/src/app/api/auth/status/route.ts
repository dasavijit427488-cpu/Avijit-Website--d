import { NextResponse } from "next/server";
import { getSessionUser, getUserCount } from "@/lib/auth";
import { getDatabaseStats } from "@/lib/db";

export async function GET() {
  try {
    const userCount = getUserCount();
    const user = await getSessionUser();
    const dbStats = getDatabaseStats();
    return NextResponse.json({
      ok: true,
      needsSetup: userCount === 0,
      authenticated: Boolean(user),
      user,
      dbStats,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

