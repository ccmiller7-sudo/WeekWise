# WeekWise Finance — Production Environment Variables

## Required (already configured)
- `DATABASE_URL` — Neon/PostgreSQL connection string
- `RESEND_API_KEY` — Resend API key for transactional emails (welcome, weekly digest, trial reminders)

## Stripe Configuration

### 1. Stripe Publishable Key (client-side)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```
Not strictly required since we use pre-generated payment links, but needed for future Stripe Elements integration.

### 2. Stripe Secret Key (server-side) ⚠️ REQUIRED for full functionality
```
STRIPE_SECRET_KEY=sk_live_...
```
Used for:
- Retrieving subscription details from Stripe after checkout
- Creating Customer Portal sessions for self-service billing
- Verifying webhook signatures

**How to get it:** Stripe Dashboard → Developers → API Keys → Secret key

### 3. Stripe Webhook Signing Secret (server-side)
```
STRIPE_WEBHOOK_SECRET=whsec_...
```
Used to verify that incoming webhook events genuinely came from Stripe.

**How to get it:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://YOUR_DOMAIN/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. After creating the endpoint, copy the "Signing secret" (starts with `whsec_`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in `.env`

**Without this secret:** The webhook endpoint still receives events but cannot verify they came from Stripe. For production, always set this.

### 4. Stripe Customer Portal (self-service billing)
To enable the "Manage Billing" button in Settings:
1. Go to Stripe Dashboard → Settings → Customer Portal
2. Configure allowed actions (cancel, upgrade/downgrade, update payment method)
3. Save the configuration (no URL needed — the portal session API handles this)

**Prerequisites:**
- `STRIPE_SECRET_KEY` must be set in `.env`
- The user must have completed a Stripe checkout (so they have a `stripe_customer_id`)
- Customer Portal must be configured in the Stripe Dashboard

The "Manage Billing" button creates a portal session via `POST /api/portal-session` (handled server-side) and opens it in a new tab.

## Current Payment Links (Pre-generated)
These work without additional configuration:
- Monthly: https://buy.stripe.com/6oU9ATdYdbrc8AZ9yS9MY00
- Annual: https://buy.stripe.com/fZubJ1g6l9j418xbH09MY01

The app redirects users to these links for subscription checkout. After payment, Stripe sends a webhook event to `/api/webhook` which updates the user's subscription status.

## API Routes
- Webhook endpoint: `/api/webhook` (POST only) — configure in Stripe Dashboard
- Stripe Customer Portal sessions are created server-side via `createPortalSession` server function (not a public API route)

## Plaid Configuration (Bank Linking)
```
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

**How to get them:**
1. Sign up at https://dashboard.plaid.com/signup
2. Get `client_id` and `secret` from the dashboard
3. Set `PLAID_ENV` to `sandbox` (development) for testing, or `production` for live

**Without these:** The "Connect a bank account" option shows a "coming soon" message. Users can still import via CSV or add transactions manually.

## Resend (Email)
```
RESEND_API_KEY=re_...
```

**How to get it:**
1. Sign up at https://resend.com
2. Go to API Keys and create a new key
3. Add it as `RESEND_API_KEY` in `.env`

**Without this:** The app cannot send any emails (welcome emails, weekly digests, trial reminders, etc.).