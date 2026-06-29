// Tiny email sender using Resend's REST API (no npm dependency needed).
// Configured via env vars; if they're missing, sendEmail() is a safe no-op so
// the contact form keeps working without email set up.
//
//   RESEND_API_KEY      — from https://resend.com/api-keys
//   CONTACT_NOTIFY_TO   — where admin notifications are delivered (your inbox)
//   CONTACT_NOTIFY_FROM — verified sender, e.g. "TastyBites <onboarding@resend.dev>"
//
// resend.dev's onboarding@resend.dev sender works for testing without
// verifying a domain.

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_TO);
}

export async function sendEmail({ subject, html, replyTo }) {
  if (!isEmailConfigured()) {
    console.warn(
      "[email] RESEND_API_KEY / CONTACT_NOTIFY_TO not set — skipping email."
    );
    return { sent: false, skipped: true };
  }

  const from =
    process.env.CONTACT_NOTIFY_FROM || "TastyBites <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [process.env.CONTACT_NOTIFY_TO],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[email] Resend error:", res.status, detail);
      return { sent: false, error: detail };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, error: String(err) };
  }
}

// Escape user-supplied text before dropping it into an HTML email.
export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
