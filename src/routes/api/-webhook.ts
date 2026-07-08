// Stripe webhook handler — processes subscription lifecycle events
// This file is prefixed with "-" to exclude it from the page route tree.
// API routes are handled by @tanstack/react-start at runtime.
//
// Production setup:
// 1. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
// 2. Configure Stripe webhook endpoint URL: https://YOUR_DOMAIN/api/webhook
// 3. Subscribe to events: checkout.session.completed, invoice.paid,
//    customer.subscription.updated, customer.subscription.deleted

import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/webhook")({
  POST: async ({ request }: { request: Request }) => {
    try {
      const body = await request.text();
      const sig = request.headers.get("stripe-signature") || "";
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: any;

      if (webhookSecret && sig) {
        // Production: verify webhook signature
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
          apiVersion: "2025-02-24.acacia" as any,
        });
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        // Dev mode: skip verification
        console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
        event = JSON.parse(body);
      }

      const { updateSubscriptionStatus, getSubscriptionByStripeId, updateSubscriptionCustomerId } =
        await import("~/lib/db");

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.client_reference_id;
          const customerId = session.customer;
          const subscriptionId = session.subscription;

          console.log(`Webhook: checkout.session.completed (user=${userId}, sub=${subscriptionId})`);

          if (userId) {
            // Store the Stripe customer ID
            if (customerId) {
              await updateSubscriptionCustomerId(userId, customerId);
            }

            // If we have a subscription, fetch period_end from Stripe
            if (subscriptionId) {
              try {
                const Stripe = (await import("stripe")).default;
                const stripe = new Stripe(
                  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
                  { apiVersion: "2025-02-24.acacia" as any }
                );
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const periodEnd = new Date(subscription.current_period_end * 1000)
                  .toISOString().split("T")[0];
                await updateSubscriptionStatus(userId, "active", subscriptionId, periodEnd);
              } catch (err) {
                // Fallback if Stripe API call fails
                const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString().split("T")[0];
                await updateSubscriptionStatus(userId, "active", subscriptionId, periodEnd);
              }
            } else {
              await updateSubscriptionStatus(userId, "active");
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          console.log(`Webhook: invoice.paid (sub=${subscriptionId})`);

          if (subscriptionId) {
            const sub = await getSubscriptionByStripeId(subscriptionId);
            if (sub) {
              const periodEnd = new Date(invoice.period_end * 1000)
                .toISOString().split("T")[0];
              await updateSubscriptionStatus(sub.user_id, "active", subscriptionId, periodEnd);
            }
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const stripeStatus = subscription.status;
          const subscriptionId = subscription.id;
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
            .toISOString().split("T")[0];

          // Map Stripe status to our status labels
          const statusMap: Record<string, string> = {
            active: "active",
            canceled: "canceled",
            past_due: "past_due",
            incomplete: "incomplete",
            incomplete_expired: "expired",
            trialing: "trialing",
            unpaid: "past_due",
          };
          const mappedStatus = statusMap[stripeStatus] || stripeStatus;

          console.log(`Webhook: ${event.type} (sub=${subscriptionId}, status=${mappedStatus})`);

          const sub = await getSubscriptionByStripeId(subscriptionId);
          if (sub) {
            await updateSubscriptionStatus(sub.user_id, mappedStatus, subscriptionId, currentPeriodEnd);
          }
          break;
        }

        default:
          console.log(`Webhook: unhandled event type ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
  },
});