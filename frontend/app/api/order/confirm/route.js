// Server-only: called when the customer returns from Stripe. Verifies the
// payment really happened, then saves the order + items to the database via the
// shared, idempotent saver. The Stripe webhook is the reliable path (it fires
// even if the browser never returns); this just gives the returning customer an
// immediate confirmation and is safe to run alongside the webhook.
import Stripe from "stripe";
import { saveOrderFromSession, OrderError } from "@/lib/order-fulfillment";

export async function POST(req) {
  try {
    const { sessionId, items, name } = await req.json();
    if (!sessionId) {
      return Response.json({ error: "Missing session id." }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const result = await saveOrderFromSession(session, { items, name });

    return Response.json({
      id: result.id,
      name: result.name,
      total: result.total,
    });
  } catch (err) {
    // Business/validation problems → 400; everything else → 500.
    if (err instanceof OrderError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("Order confirm error:", err);
    return Response.json({ error: "Could not confirm order." }, { status: 500 });
  }
}
