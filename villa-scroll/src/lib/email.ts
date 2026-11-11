import nodemailer from "nodemailer";
import { getAppSettingCloud, getSiteConfigCloud } from "./db";

export interface SendRealEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  fromName?: string;
}

export interface SendRealEmailResult {
  dispatched: boolean;
  channel: "smtp" | "resend" | "web3forms" | "none";
  message: string;
}

export async function getSmtpCredentials(): Promise<{
  smtpUser: string;
  smtpPass: string;
  ownerEmail: string;
  villaTitle: string;
}> {
  const { config: siteConfig } = await getSiteConfigCloud();
  const villaTitle = `${siteConfig.brand.brandFirstLetter}${siteConfig.brand.brandMiddleText} ${siteConfig.brand.brandLastWord}`;
  const ownerEmail =
    process.env.ADMIN_EMAIL ||
    siteConfig.contact.ownerEmail ||
    "dasavijit427488@gmail.com";
  const dbSmtpUser = await getAppSettingCloud("smtp_user");
  const dbSmtpPass = await getAppSettingCloud("smtp_pass");
  const smtpUser = dbSmtpUser || process.env.SMTP_USER || ownerEmail;
  const rawPass =
    dbSmtpPass ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    "";
  // Google App Passwords are often copied with spaces ("xxxx xxxx xxxx xxxx"); strip whitespace for SMTP auth
  const smtpPass = rawPass.replace(/\s+/g, "");
  return { smtpUser, smtpPass, ownerEmail, villaTitle };
}

export async function sendRealEmail(input: SendRealEmailInput): Promise<SendRealEmailResult> {
  const { smtpUser, smtpPass, villaTitle } = await getSmtpCredentials();
  const senderLabel = input.fromName || `${villaTitle} Concierge`;
  let lastSmtpError = "";

  // 1. Primary: Direct Gmail / Custom SMTP via Nodemailer (Port 465 SSL -> 587 STARTTLS)
  if (smtpPass && smtpUser) {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const primaryPort = Number(process.env.SMTP_PORT || 465);
    const ports = primaryPort === 465 ? [465, 587] : [primaryPort];

    for (const port of ports) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 9000,
          greetingTimeout: 9000,
          socketTimeout: 10000,
        });

        await transporter.sendMail({
          from: `"${senderLabel}" <${smtpUser}>`,
          to: input.to,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
          subject: input.subject,
          text: input.text,
          html: input.html,
        });

        return {
          dispatched: true,
          channel: "smtp",
          message: `Email delivered directly to ${input.to}.`,
        };
      } catch (err) {
        lastSmtpError = err instanceof Error ? err.message : "SMTP dispatch error.";
      }
    }
  }

  // 2. Secondary: Resend HTTP Email API (works reliably on Vercel serverless)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.RESEND_FROM_EMAIL || `${senderLabel} <onboarding@resend.dev>`,
          to: [input.to],
          ...(input.replyTo ? { reply_to: input.replyTo } : {}),
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });
      if (resendRes.ok) {
        return {
          dispatched: true,
          channel: "resend",
          message: `Email delivered to ${input.to} via Resend.`,
        };
      }
      const errBody = await resendRes.text().catch(() => "");
      return {
        dispatched: false,
        channel: "none",
        message: errBody || "Resend delivery failed.",
      };
    } catch (err) {
      return {
        dispatched: false,
        channel: "none",
        message: err instanceof Error ? err.message : "Resend request error.",
      };
    }
  }

  // 3. Tertiary: Web3Forms HTTPS API (optional free key on Vercel)
  const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
  if (web3Key) {
    try {
      const w3Res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: web3Key,
          from_name: senderLabel,
          subject: input.subject,
          message: input.text,
        }),
      });
      const w3Json = await w3Res.json().catch(() => null);
      if (w3Res.ok && w3Json?.success) {
        return {
          dispatched: true,
          channel: "web3forms",
          message: `Email delivered to ${input.to}.`,
        };
      }
    } catch {
      // Continue to fallback
    }
  }

  return {
    dispatched: false,
    channel: "none",
    message: lastSmtpError || "No server SMTP / Resend credentials configured yet.",
  };
}

