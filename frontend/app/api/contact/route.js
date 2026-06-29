// Server route: validates a contact submission and stores it in Supabase.
// Uses the service-role key (server-only) so no public insert policy is needed.
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();

    // ---- Validation ----
    const errors = {};
    if (name.length < 1 || name.length > 100) errors.name = "Enter your name.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (message.length < 1 || message.length > 2000)
      errors.message = "Message must be 1–2000 characters.";

    if (Object.keys(errors).length > 0) {
      return Response.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });

    if (error) {
      console.error("contact insert error:", error);
      return Response.json({ error: "Could not save your message." }, { status: 500 });
    }

    // Notify the admin by email. Best-effort: a failed/!configured email must
    // not fail the request — the message is already saved and visible in the
    // admin dashboard either way.
    await sendEmail({
      subject: `New contact message from ${name}`,
      replyTo: email,
      html: `
        <h2>New contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("contact route error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
