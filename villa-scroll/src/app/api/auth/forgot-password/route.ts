import { NextRequest, NextResponse } from "next/server";
import {
  createResetChallengeCookie,
  findUserForReset,
  getUserCount,
  RESET_COOKIE_NAME,
  syncUsersFromCloud,
} from "@/lib/auth";
import { getSiteConfigCloud } from "@/lib/db";
import { sendRealEmail } from "@/lib/email";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    await syncUsersFromCloud();
    if (getUserCount() === 0) {
      return NextResponse.json(
        { ok: false, error: "No admin account has been set up yet." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const identifier = String(body?.identifier ?? "").trim();
    if (!identifier) {
      return NextResponse.json(
        { ok: false, error: "Enter your Admin User ID or registered Email Address." },
        { status: 400 }
      );
    }

    const match = findUserForReset(identifier);
    if (!match) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No admin account matched that User ID or Email, or no recovery email is saved.",
        },
        { status: 404 }
      );
    }

    const { user, targetEmail } = match;
    const { code, cookieToken, expiresAt } = createResetChallengeCookie({
      userId: user.id,
      username: user.username,
      email: targetEmail,
    });

    const { config: siteConfig } = await getSiteConfigCloud();
    const villaTitle = `${siteConfig.brand.brandFirstLetter}${siteConfig.brand.brandMiddleText} ${siteConfig.brand.brandLastWord}`;

    const html = `
      <div style="margin:0;padding:28px 16px;background:#f6f1e6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1812;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #dcc484;overflow:hidden;">
          <div style="background:#15120d;padding:24px 28px;border-bottom:3px solid #d4af37;">
            <div style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#f2ca50;font-weight:700;">
              ${villaTitle} &bull; Admin Security
            </div>
            <h1 style="margin:6px 0 0;font-size:20px;color:#fff9ec;">Password Reset Verification Code</h1>
          </div>
          <div style="padding:26px 28px;">
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a4236;">
              A password reset was requested for Admin User ID <strong>${user.username}</strong>. Enter the 6-digit code below within 15 minutes:
            </p>
            <div style="margin:20px 0;padding:18px;text-align:center;background:#faf6ed;border:1.5px dashed #c9a84c;border-radius:12px;">
              <div style="font-size:32px;letter-spacing:0.28em;font-weight:800;color:#8b6914;font-family:monospace;">
                ${code}
              </div>
            </div>
            <p style="margin:0;font-size:12px;color:#6e6454;">
              If you did not request this reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;

    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      "https://avijitvilla.vercel.app";
    const referer = request.headers.get("referer") || `${origin}/admin`;

    const emailRes = await sendRealEmail({
      to: targetEmail,
      subject: `${code} is your ${villaTitle} Admin Password Reset Code`,
      text: `Your ${villaTitle} Admin Password Reset Code for User ID "${user.username}" is: ${code}\n\nThis code expires in 15 minutes.`,
      html,
      fromName: `${villaTitle} Security`,
    });

    // If direct SMTP failed, dispatch via FormSubmit with proper Origin & Referer headers
    let delivered = emailRes.dispatched;
    if (!delivered) {
      try {
        const fsRes = await fetch(
          `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Origin: origin,
              Referer: referer,
            },
            body: JSON.stringify({
              _subject: `${code} is your ${villaTitle} Admin Password Reset Code`,
              name: `${villaTitle} Security`,
              message: `Your ${villaTitle} Admin Password Reset Code for User ID "${user.username}" is: ${code}\n\nEnter this 6-digit code on the admin login page within 15 minutes to reset your password.`,
              "Reset Code": code,
              "User ID": user.username,
              _captcha: "false",
              _template: "box",
            }),
          }
        );
        const fsJson = await fsRes.json().catch(() => null);
        if (fsRes.ok && (fsJson?.success === true || fsJson?.success === "true")) {
          delivered = true;
        }
      } catch {
        // Fallback
      }
    }

    // Do NOT return resetCode in the JSON response so the user must get it from their email
    const response = NextResponse.json({
      ok: true,
      maskedEmail: maskEmail(targetEmail),
      targetEmail,
      username: user.username,
      emailDelivered: delivered,
      message: `A 6-digit verification code has been sent to ${maskEmail(targetEmail)}. Check your Gmail inbox and enter the code below.`,
    });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(RESET_COOKIE_NAME, cookieToken, {
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
        error: err instanceof Error ? err.message : "Could not initiate password reset.",
      },
      { status: 500 }
    );
  }
}

