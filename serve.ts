// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — static files first, SSR for the
// rest. Run `bun run build` before starting. Restart it with `bun run publish`.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server (provisioning starts it as `engine`; a team
// member's `bun run publish` runs as their own user), so publish never collides
// with an already-running server. Every sandbox user has passwordless sudo, so
// the takeover works across user boundaries.
import handler from "./dist/server/server.js";

// Pinned, NOT read from the environment. The published preview URL
// (<label>.<PUBLIC_SITE_DOMAIN>) is reverse-proxied to 0.0.0.0:3000 inside the
// sandbox, so the default site MUST bind there. Bun auto-loads .env files, so
// honouring process.env.PORT/HOST would let a stray env var or a .env in the site
// dir silently move the site off :3000 (or onto loopback) and break the public URL.
const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

// ── Stripe Webhook Handler ───────────────────────────────────────────────────
// Processes subscription lifecycle events from Stripe after checkout.
// Configured as a standalone middleware so it works regardless of TanStack Start's
// API route bundling. The -webhook.ts file in src/routes/api/ serves as the
// source of truth for development; this wraps it for production.
async function handleWebhook(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/webhook" || request.method !== "POST") {
    return null; // Not a webhook request
  }

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

    const { execSync } = await import("child_process");

    function teamDb(sql: string): any[] {
      const result = execSync(`team-db "${sql.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
      return JSON.parse(result);
    }

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
            teamDb(`UPDATE weekwise_subscriptions SET stripe_customer_id = '${customerId}' WHERE user_id = '${userId}'`);
          }

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
              teamDb(`UPDATE weekwise_subscriptions SET status = 'active', stripe_subscription_id = '${subscriptionId}', current_period_end = '${periodEnd}' WHERE user_id = '${userId}'`);
            } catch {
              const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString().split("T")[0];
              teamDb(`UPDATE weekwise_subscriptions SET status = 'active', stripe_subscription_id = '${subscriptionId}', current_period_end = '${periodEnd}' WHERE user_id = '${userId}'`);
            }
          } else {
            teamDb(`UPDATE weekwise_subscriptions SET status = 'active' WHERE user_id = '${userId}'`);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        console.log(`Webhook: invoice.paid (sub=${subscriptionId})`);

        if (subscriptionId) {
          const rows = teamDb(`SELECT user_id FROM weekwise_subscriptions WHERE stripe_subscription_id = '${subscriptionId}'`);
          if (rows.length > 0) {
            const periodEnd = new Date(invoice.period_end * 1000).toISOString().split("T")[0];
            teamDb(`UPDATE weekwise_subscriptions SET status = 'active', current_period_end = '${periodEnd}' WHERE stripe_subscription_id = '${subscriptionId}'`);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const stripeStatus = subscription.status;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString().split("T")[0];

        const statusMap: Record<string, string> = {
          active: "active", canceled: "canceled", past_due: "past_due",
          incomplete: "incomplete", incomplete_expired: "expired",
          trialing: "trialing", unpaid: "past_due",
        };
        const mappedStatus = statusMap[stripeStatus] || stripeStatus;

        console.log(`Webhook: ${event.type} (sub=${subscriptionId}, status=${mappedStatus})`);
        teamDb(`UPDATE weekwise_subscriptions SET status = '${mappedStatus}', current_period_end = '${currentPeriodEnd}' WHERE stripe_subscription_id = '${subscriptionId}'`);
        break;
      }
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
}

// Free PORT regardless of which user owns the current listener. lsof runs under
// sudo so it can see (and the kill can signal) a process owned by another user;
// the loop waits for the socket to actually release before we bind.
const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// Take over the port, re-freeing and retrying if another publish grabbed it in the
// gap between freeing and binding (last publish wins). Bun.serve throws EADDRINUSE
// synchronously, so without this a raced publish would die while the shell already
// reported success.
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        // Check for webhook requests first
        const webhookResponse = await handleWebhook(req);
        if (webhookResponse) return webhookResponse;

        const { pathname } = new URL(req.url);
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }
        return (
          handler as { fetch: (r: Request) => Response | Promise<Response> }
        ).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);