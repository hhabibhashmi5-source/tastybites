// Stripe webhook — the RELIABLE order-saving path. Stripe calls this server to
// server after a successful payment, so the order is recorded even if the
// customer closes the tab and never returns to /cart.
//
// Setup: create an endpoint in the Stripe dashboard pointing at
//   https://<your-site>/api/stripe/webhook
// for the event "checkout.session.completed", then put its signing secret in
// the STRIPE_WEBHOOK_SECRET environment variable.
import Stripe from "stripe";
import { saveOrderFromSession } from "@/lib/order-fulfillment";

// Stripe needs the raw request body + Node crypto for signature verification.
export const runtime = "nodejs";

export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — webhook disabled.");
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers.get("stripe-signature");
  const body = await req.text(); // raw body required for signature verification

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data.object.id;
    try {
      // Re-retrieve to be sure customer_details + shipping are populated.
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const result = await saveOrderFromSession(session);
      console.log(
        `Webhook saved order ${result.id} for session ${sessionId} (existed=${result.alreadyExisted})`
      );
    } catch (err) {
      // Return 500 so Stripe retries this delivery.
      console.error(`Webhook failed to save session ${sessionId}:`, err.message);
      return Response.json({ error: "Failed to save order." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
