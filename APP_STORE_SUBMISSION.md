# App Store Submission Guide — WeekWise Finance

## Prerequisites

- macOS with Xcode 16+ installed
- Apple Developer account ($99/year)
- App Store Connect listing created

## Build & Archive

### 1. Install dependencies

```bash
cd /home/team/shared/site
npm install
npx cap sync ios
```

### 2. Build the web app

```bash
bun run vite build
```

### 3. Copy web assets to iOS project

```bash
npx cap copy ios
```

### 4. Open in Xcode

```bash
npx cap open ios
```

### 5. Configure in Xcode

- Select the **App** target
- Set **Signing & Capabilities** → Team to your Apple Developer account
- Set **Bundle Identifier** to `com.weekwise.app`
- Set **Deployment Target** to iOS 16.0+
- Ensure all provisioning profiles are valid

### 6. Archive & Upload

- Select **Product → Archive**
- In the Organizer window, click **Distribute App**
- Select **App Store Connect**
- Follow the prompts to upload

## Production URL

The app is configured to load from:

```
https://week-wise-xi.vercel.app
```

This is set in `capacitor.config.ts` under `server.url`. The app runs as a PWA wrapper — all content is served from this URL.

**Important:** The production URL must be:
1. HTTPS (configured)
2. Publicly accessible (verified)
3. Serving the full WeekWise Finance app (verified)

## Demo Account for Review

Apple requires a demo account for App Store review:

- **Email:** `demo@weekwise.app`
- **Password:** `Demo123456`

Include these credentials in the App Store Connect "Review Notes" section.

## App Store Metadata

### App Name
WeekWise Finance

### Subtitle
Your money, explained in one minute a week

### Description
WeekWise Finance automatically sorts your spending, surfaces one weekly insight, and recommends one actionable step — no dashboards, no busywork.

Link your bank accounts via Plaid, import transactions via CSV, or manually add entries. Get AI-powered insights about your spending habits and ask questions like "How much did I spend eating out this month?"

Features:
- Auto-categorize transactions with AI
- Weekly spending insights and recommendations
- AI-powered financial coach
- Bank account linking via Plaid
- CSV import
- Subscription tracking

### Keywords
finance, budgeting, spending, money, savings, personal finance, budget tracker, expense tracker

### Category
Finance

### Age Rating
4+

## Notes

- The app uses a Capacitor wrapper with a server-based architecture (not a traditional native app). All content is server-rendered from the production URL.
- Plaid integration uses sandbox credentials for testing. For production App Store review, the Plaid environment should be set to "sandbox" (already configured).
- Stripe handles all subscription payments. The app does not process payments directly.
- The app includes a 14-day free trial with no credit card required.