import { NextResponse } from "next/server";
import { getSessionUser, getUserCount, syncUsersFromCloud } from "@/lib/auth";
import { isCloudKvConfigured, isServerlessRuntime } from "@/lib/cloudStore";
import { getDatabaseStats } from "@/lib/db";

export async function GET() {
  try {
    await syncUsersFromCloud();
    const userCount = getUserCount();
    const user = await getSessionUser();
    const dbStats = getDatabaseStats();
    return NextResponse.json(
      {
        ok: true,
        needsSetup: userCount === 0,
        authenticated: Boolean(user),
        user,
        dbStats,
        cloudSynced: !isServerlessRuntime() || isCloudKvConfigured(),
        isServerless: isServerlessRuntime(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
