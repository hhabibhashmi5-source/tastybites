// Server route: validates a customer review and stores it (hidden by default).
// Uses the service-role key so no public insert policy is needed; an admin
// approves reviews before they show on the home page.
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const comment = String(body.comment ?? "").trim();
    const rating = Number(body.rating);

    // ---- Validation (mirrors the DB CHECK constraints) ----
    const errors = {};
    if (name.length < 1 || name.length > 80) errors.name = "Enter your name.";
    if (comment.length < 1 || comment.length > 500)
      errors.comment = "Review must be 1–500 characters.";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      errors.rating = "Pick a rating from 1 to 5 stars.";

    if (Object.keys(errors).length > 0) {
      return Response.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("reviews")
      .insert({ name, rating, comment });

    if (error) {
      console.error("review insert error:", error);
      return Response.json(
        { error: "Could not save your review." },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("review route error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
