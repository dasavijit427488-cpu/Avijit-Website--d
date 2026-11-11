import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAppSetting, getSiteConfig, insertInquiry } from "@/lib/db";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLuxuryHtmlEmail(input: {
  villaTitle: string;
  footerLocation: string;
  name: string;
  email: string;
  phone?: string;
  arrivalProtocol?: string;
  requirement: string;
}): string {
  const safeVilla = escapeHtml(input.villaTitle);
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safePhone = escapeHtml(input.phone || "");
  const safeArrival = escapeHtml(input.arrivalProtocol || "");
  const safeReq = escapeHtml(input.requirement).replace(/\n/g, "<br />");
  const dateStr = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
    <div style="margin:0;padding:32px 16px;background-color:#f6f1e6;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1812;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dcc484;box-shadow:0 16px 40px rgba(120,90,30,0.12);">
        <tr>
          <td style="background:#14110d;padding:28px 32px;border-bottom:3px solid #d4af37;">
            <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#f2ca50;font-weight:700;margin-bottom:6px;">
              ${safeVilla} &bull; Estate Liaison
            </div>
            <h1 style="margin:0;font-size:24px;line-height:1.25;color:#fff9ec;font-weight:700;">
              New Private Residence Inquiry
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4236;">
              A visitor submitted their consultation details from the <strong>${safeVilla}</strong> website:
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf6ed;border:1px solid #e4d2a3;border-radius:14px;margin-bottom:22px;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #eadcb8;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Customer Name</div>
                  <div style="font-size:16px;color:#1c1812;font-weight:700;margin-top:3px;">${safeName}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #eadcb8;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Customer Email</div>
                  <div style="font-size:15px;color:#1c1812;font-weight:600;margin-top:3px;">
                    <a href="mailto:${safeEmail}" style="color:#8b6914;text-decoration:none;">${safeEmail}</a>
                  </div>
                </td>
              </tr>
              ${
                safePhone
                  ? `<tr>
                <td style="padding:14px 20px;border-bottom:1px solid #eadcb8;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Phone / Signal</div>
                  <div style="font-size:14px;color:#1c1812;margin-top:3px;">${safePhone}</div>
                </td>
              </tr>`
                  : ""
              }
              ${
                safeArrival
                  ? `<tr>
                <td style="padding:14px 20px;border-bottom:1px solid #eadcb8;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Arrival Protocol</div>
                  <div style="font-size:14px;color:#1c1812;margin-top:3px;">${safeArrival}</div>
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #eadcb8;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Requirement / Message</div>
                  <div style="font-size:14px;line-height:1.65;color:#2c251c;margin-top:6px;">${safeReq}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#8b6914;font-weight:700;">Received At</div>
                  <div style="font-size:12px;color:#574e40;margin-top:2px;">${escapeHtml(dateStr)} (IST)</div>
                </td>
              </tr>
            </table>
            <div style="text-align:center;">
              <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: Your Inquiry Regarding ${input.villaTitle}`)}" style="display:inline-block;padding:13px 26px;background:linear-gradient(135deg,#d4af37,#f2ca50);color:#2b2000;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;border-radius:10px;">
                Reply to ${safeName}
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#faf6ed;padding:16px 32px;border-top:1px solid #eadcb8;font-size:11px;color:#6e6454;text-align:center;">
            ${safeVilla} &bull; ${escapeHtml(input.footerLocation)}
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const arrivalProtocol = String(body?.arrival ?? "").trim();
    const source = String(body?.source ?? "contact_form").trim();
    const requirement = String(body?.requirement ?? "").trim();

    if (!name || !email || !requirement) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and requirement message are required." },
        { status: 400 }
      );
    }

    const siteConfig = getSiteConfig();
    const ownerEmail = siteConfig.contact.ownerEmail || "dasavijit427488@gmail.com";
    const ownerWhatsapp =
      siteConfig.contact.whatsappNumber.replace(/\D/g, "") || "919038904861";
    const villaTitle = `${siteConfig.brand.brandFirstLetter}${siteConfig.brand.brandMiddleText} ${siteConfig.brand.brandLastWord}`;
    const footerLocation = siteConfig.contact.footerLocationText;

    let emailDispatched = false;
    let deliveryChannel: "smtp" | "resend" | "formsubmit" | "manual" = "manual";
    let providerMessage = "";

    const htmlBody = buildLuxuryHtmlEmail({
      villaTitle,
      footerLocation,
      name,
      email,
      phone,
      arrivalProtocol,
      requirement,
    });
    const plainBody = [
      `${villaTitle.toUpperCase()} — NEW CLIENT INQUIRY`,
      "-----------------------------------",
      `Customer Name  : ${name}`,
      `Customer Email : ${email}`,
      ...(phone ? [`Phone / Signal : ${phone}`] : []),
      ...(arrivalProtocol ? [`Arrival        : ${arrivalProtocol}`] : []),
      `Requirement    : ${requirement}`,
      "-----------------------------------",
      `Location: ${footerLocation}`,
    ].join("\n");

    // 1. Primary: Direct Gmail SMTP via Nodemailer (reads SQLite app_settings first, then .env.local)
    const smtpPass =
      getAppSetting("smtp_pass") ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASS;
    const smtpUser =
      getAppSetting("smtp_user") || process.env.SMTP_USER || ownerEmail;

    if (smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"${villaTitle} Concierge" <${smtpUser}>`,
          to: ownerEmail,
          replyTo: `${name} <${email}>`,
          subject: `New ${villaTitle} Inquiry — ${name}`,
          text: plainBody,
          html: htmlBody,
        });

        emailDispatched = true;
        deliveryChannel = "smtp";
        providerMessage = "Delivered directly to Gmail inbox.";
      } catch (err) {
        providerMessage = err instanceof Error ? err.message : "SMTP dispatch error.";
      }
    }

    // 2. Secondary: Resend API if RESEND_API_KEY is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (!emailDispatched && resendKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL || `${villaTitle} <onboarding@resend.dev>`,
            to: [ownerEmail],
            reply_to: email,
            subject: `New ${villaTitle} Inquiry — ${name}`,
            text: plainBody,
            html: htmlBody,
          }),
        });
        if (resendRes.ok) {
          emailDispatched = true;
          deliveryChannel = "resend";
          providerMessage = "Delivered via Resend email service.";
        }
      } catch {
        // Fall through cleanly
      }
    }

    // 3. Fallback: FormSubmit formatted box template
    if (!emailDispatched) {
      const origin =
        request.headers.get("origin") ||
        request.nextUrl.origin ||
        "https://avijit-villa.vercel.app";
      const referer = request.headers.get("referer") || `${origin}/`;

      try {
        const forwardRes = await fetch(`https://formsubmit.co/ajax/${ownerEmail}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: origin,
            Referer: referer,
          },
          body: JSON.stringify({
            _subject: `New ${villaTitle} Inquiry — ${name}`,
            _replyto: email,
            _template: "box",
            "Customer Name": name,
            "Customer Email": email,
            ...(phone ? { "Customer Phone": phone } : {}),
            ...(arrivalProtocol ? { "Arrival Protocol": arrivalProtocol } : {}),
            "Client Requirement": requirement,
            Location: footerLocation,
          }),
        });

        const forwardJson = await forwardRes.json().catch(() => null);
        if (
          forwardRes.ok &&
          (forwardJson?.success === true || forwardJson?.success === "true")
        ) {
          emailDispatched = true;
          deliveryChannel = "formsubmit";
        }
        if (forwardJson?.message) {
          providerMessage = String(forwardJson.message);
        }
      } catch {
        // Offline/blocked fallback
      }
    }

    // Persist inquiry in SQLite Database so admin can always view & manage leads
    const inquiryId = insertInquiry({
      source,
      name,
      email,
      phone,
      arrivalProtocol,
      requirement,
      emailDispatched,
      deliveryChannel,
    });

    const whatsappText = [
      `New Inquiry — ${villaTitle}`,
      `Name: ${name}`,
      `Email: ${email}`,
      ...(phone ? [`Phone: ${phone}`] : []),
      ...(arrivalProtocol ? [`Arrival: ${arrivalProtocol}`] : []),
      `Requirement: ${requirement}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/${ownerWhatsapp}?text=${encodeURIComponent(
      whatsappText
    )}`;
    const mailtoUrl = `mailto:${ownerEmail}?subject=${encodeURIComponent(
      `New ${villaTitle} Inquiry — ${name}`
    )}&body=${encodeURIComponent(plainBody)}`;

    return NextResponse.json({
      ok: true,
      inquiryId,
      ownerEmail,
      emailDispatched,
      deliveryChannel,
      providerMessage,
      whatsappUrl,
      mailtoUrl,
      formattedText: whatsappText,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
