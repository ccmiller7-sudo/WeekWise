# WeekWise Finance

Your money, explained in one minute a week.

**WeekWise Finance** auto-sorts your spending, surfaces one weekly AI insight, and recommends one actionable step. No dashboards, no busywork.

## Features

- **Auto-categorized spending** — Transactions sorted into 9 categories automatically via AI
- **Bank sync via Plaid** — Connect your bank and pull transactions automatically
- **Weekly AI insights** — One key insight about your spending every week
- **Recommended actions** — One specific thing you can do to improve
- **Financial Coach** — Ask questions about your spending in plain English
- **CSV import** — Import transactions from any bank or credit card
- **Manual entry** — Add transactions on the go
- **Subscription detection** — See all your recurring charges in one place

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React + Vite)
- Turso (SQLite)
- OpenAI (GPT-4o-mini)
- Plaid (bank linking)
- Stripe (subscription billing)

## Getting Started

```bash
bun install
bun run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `PLAID_CLIENT_ID` | Plaid client ID for bank linking |
| `PLAID_SECRET` | Plaid secret for bank linking |
| `PLAID_ENV` | Plaid environment (`sandbox` for dev) |

## Live Site

[https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app](https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app)