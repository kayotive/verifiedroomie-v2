import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const TO = "askverifiedroomie@gmail.com";
const FROM = "VerifiedRoomie <noreply@verifiedroomie.com>";

const CONTACT_TOPICS: Record<string, string> = {
  account: "Account",
  verification: "Verification",
  report: "Report a problem",
  other: "Other",
};
const FEEDBACK_TOPICS: Record<string, string> = {
  idea: "Idea",
  problem: "Problem",
  praise: "Praise",
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request.");
  }

  // Hidden field that real people never fill in. Bots do. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const kind = body.kind === "feedback" ? "feedback" : body.kind === "contact" ? "contact" : null;
  if (!kind) return bad("Invalid request.");

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 10) return bad("Please write at least a few words (10 characters).");
  if (message.length > 2000) return bad("Your message is too long (maximum 2000 characters).");

  const topics = kind === "feedback" ? FEEDBACK_TOPICS : CONTACT_TOPICS;
  const topicKey = typeof body.topic === "string" && topics[body.topic] ? body.topic : "other";
  const topicLabel = topics[topicKey] ?? "Other";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  let email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";

  if (kind === "feedback") {
    if (!user) return bad("Please log in to send feedback.", 401);
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    name = p?.full_name ?? name ?? "";
    email = user.email ?? email;
  } else {
    if (!name) return bad("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email address.");
  }

  const page = typeof body.page === "string" ? body.page.slice(0, 300) : null;
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("contact: missing Supabase env vars");
    return bad("Something went wrong. Please try again later.", 500);
  }
  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });

  // Simple spam protection: at most 5 messages per hour from the same connection
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      return bad("You have sent several messages already. Please try again later.", 429);
    }
  }

  const { error: insertError } = await admin.from("messages").insert({
    kind,
    topic: topicKey,
    name: name || null,
    email: email || null,
    message,
    user_id: user?.id ?? null,
    page,
    user_agent: userAgent || null,
    ip,
  });
  if (insertError) {
    console.error("contact: could not save message", insertError.message);
    return bad("Something went wrong. Please try again later.", 500);
  }

  // Email the team. The message is already saved, so a failed email does not lose it.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const label = kind === "feedback" ? "Feedback" : "Contact";
    const rows: [string, string][] = [
      ["From", `${esc(name || "Unknown")}${email ? ` &lt;${esc(email)}&gt;` : ""}`],
      ["Type", `${label}: ${esc(topicLabel)}`],
    ];
    if (page) rows.push(["Page", esc(page)]);
    if (user) rows.push(["Account", "Logged-in member"]);
    if (userAgent) rows.push(["Device", esc(userAgent)]);

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px">
<h2 style="margin:0 0 12px">New ${label.toLowerCase()} message</h2>
<table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:2px 12px 2px 0;color:#64748b;vertical-align:top">${k}</td><td style="padding:2px 0">${v}</td></tr>`
  )
  .join("")}
</table>
<div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;font-size:15px">${esc(message)}</div>
<p style="color:#64748b;font-size:13px">Reply to this email to answer ${esc(name || "them")} directly.</p>
</div>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [TO],
          ...(email ? { reply_to: email } : {}),
          subject: `[${label}] ${topicLabel} from ${name || "a member"}`,
          html,
        }),
      });
      if (!res.ok) console.error("contact: Resend error", res.status, await res.text());
    } catch (e) {
      console.error("contact: email failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}