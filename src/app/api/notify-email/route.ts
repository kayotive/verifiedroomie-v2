import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

// Called by a Supabase Database Webhook every time a row is added to `notifications`
// (the same rows the bell shows). It sends the person an email with a link.

const FROM = "VerifiedRoomie <noreply@verifiedroomie.com>";
const REPLY_TO = "askverifiedroomie@gmail.com";

type Notification = {
  id: string;
  user_id: string;
  kind: string | null;
  message: string | null;
  link: string | null;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteBase() {
  return SITE_URL.replace(/\/+$/, "");
}

function absoluteLink(link: string | null, fallback: string) {
  const target = link && link.trim() ? link.trim() : fallback;
  if (/^https?:\/\//i.test(target)) return target;
  return `${siteBase()}${target.startsWith("/") ? "" : "/"}${target}`;
}

// Decide the subject, the extra sentence and the button for each kind of notification
function build(n: Notification) {
  const kind = (n.kind ?? "").toLowerCase();
  const message = n.message?.trim() || "You have a new notification on VerifiedRoomie.";

  if (kind === "request_received") {
    return {
      subject: "You have a new connection request",
      headline: message,
      extra: "Kindly log in and visit your Requests page to accept their connection.",
      buttonText: "View the request",
      url: absoluteLink(n.link, "/requests"),
    };
  }
  if (kind === "request_accepted") {
    return {
      subject: "Your connection request was accepted",
      headline: message,
      extra: "Congratulations, you can now contact them.",
      buttonText: "Open my connections",
      url: absoluteLink(n.link, "/requests"),
    };
  }
  if (kind === "request_declined") {
    return {
      subject: "Update on your connection request",
      headline: message,
      extra: "Don't be discouraged. There are more people and listings waiting for you.",
      buttonText: "Open VerifiedRoomie",
      url: absoluteLink(n.link, "/requests"),
    };
  }
  if (kind === "refund") {
    return {
      subject: "Your Connect Point was returned",
      headline: message,
      extra: "",
      buttonText: "Browse listings",
      url: absoluteLink(n.link, "/feed"),
    };
  }
  if (kind === "id_verified") {
    return {
      subject: "Your ID has been verified",
      headline: message,
      extra: "",
      buttonText: "Open VerifiedRoomie",
      url: absoluteLink(n.link, "/dashboard"),
    };
  }
  if (kind === "id_rejected") {
    return {
      subject: "Your ID was not approved",
      headline: message,
      extra: "Please upload a clear photo of your ID again.",
      buttonText: "Upload my ID again",
      url: absoluteLink(n.link, "/verify"),
    };
  }
  if (kind === "photo_flagged") {
    return {
      subject: "Please change your profile photo",
      headline: message,
      extra: "",
      buttonText: "Change my photo",
      url: absoluteLink(n.link, "/profile"),
    };
  }
  return {
    subject: "New notification on VerifiedRoomie",
    headline: message,
    extra: "",
    buttonText: "Open VerifiedRoomie",
    url: absoluteLink(n.link, "/notifications"),
  };
}

function html(b: ReturnType<typeof build>) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f6bf0;">VerifiedRoomie</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">${esc(b.headline)}</p>
      ${b.extra ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#334155;">${esc(b.extra)}</p>` : ""}
      <p style="margin:0 0 24px;">
        <a href="${esc(b.url)}" style="display:inline-block;background:#1f6bf0;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">${esc(b.buttonText)}</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
        You are getting this because of activity on your VerifiedRoomie account. Need help? Write to ${REPLY_TO}
      </p>
    </div>
  </body>
</html>`;
}

export async function POST(request: NextRequest) {
  // Only Supabase (which knows the secret) may call this
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !url || !serviceKey) {
    return NextResponse.json({ error: "Server is not set up" }, { status: 500 });
  }

  let body: { type?: string; record?: Notification };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (body.type !== "INSERT" || !body.record?.user_id) {
    return NextResponse.json({ skipped: true });
  }
  const n = body.record;

  // Find the person's email address
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: found, error: userError } = await admin.auth.admin.getUserById(n.user_id);
  const to = found?.user?.email;
  if (userError || !to) {
    return NextResponse.json({ skipped: "no email" });
  }

  const content = build(n);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // If Supabase retries, the same notification is not emailed twice
      "Idempotency-Key": `notification-${n.id}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject: content.subject,
      html: html(content),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error", res.status, detail);
    return NextResponse.json({ error: "Email failed" }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}