#!/usr/bin/env node
/**
 * Seed script for WeekWise Finance Neon PostgreSQL database.
 *
 * Usage:
 *   npx tsx /home/team/shared/seed_demo.ts
 *
 * DATABASE_URL must be set in .env or environment.
 * This script creates all tables, seeds demo data, and creates the demo auth account.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

// Load .env from the project directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(__dirname, "../site");
const envPath = resolve(siteDir, ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {
  console.log("No .env file found at", envPath, "- using existing env vars");
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set");
  console.error("Set it in .env or export DATABASE_URL=...");
  process.exit(1);
}

async function query(sql: string, params?: any[]): Promise<any[]> {
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
    await pool.end();
  }
}

async function run() {
  console.log("🌱 Seeding WeekWise Finance Neon PostgreSQL database...\n");

  // ── 1. Create tables ────────────────────────────────────────────────
  console.log("📦 Creating tables...");
  await query(`CREATE TABLE IF NOT EXISTS weekwise_users (
    id TEXT PRIMARY KEY,
    goal TEXT,
    pain_point TEXT,
    sync_method TEXT,
    onboarding_done INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (NOW())
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    is_subscription INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (NOW())
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    insight_text TEXT NOT NULL,
    action_text TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (NOW())
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_auth (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (NOW())
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'trialing',
    trial_end TEXT,
    current_period_end TEXT,
    created_at TEXT NOT NULL DEFAULT (NOW())
  )`);
  await query(`CREATE TABLE IF NOT EXISTS weekwise_plaid_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plaid_item_id TEXT,
    plaid_access_token TEXT NOT NULL,
    plaid_account_id TEXT,
    bank_name TEXT,
    last_sync_at TEXT,
    created_at TEXT NOT NULL DEFAULT (NOW())
  )`);
  console.log("  ✅ Tables created\n");

  // ── 2. Seed categories ──────────────────────────────────────────────
  console.log("🏷️  Seeding categories...");
  await query(`INSERT INTO weekwise_categories (id, name, icon) VALUES
    ('cat-food', 'Food & Dining', 'fork'),
    ('cat-transport', 'Transportation', 'car'),
    ('cat-entertainment', 'Entertainment', 'film'),
    ('cat-shopping', 'Shopping', 'bag'),
    ('cat-housing', 'Housing', 'house'),
    ('cat-utils', 'Utilities', 'bolt'),
    ('cat-health', 'Health', 'pill'),
    ('cat-income', 'Income', 'money'),
    ('cat-other', 'Other', 'box')
    ON CONFLICT (id) DO NOTHING`);
  console.log("  ✅ Categories seeded\n");

  // ── 3. Add plaid_transaction_id column ──────────────────────────────
  console.log("🔧 Adding plaid_transaction_id column...");
  await query(`ALTER TABLE weekwise_transactions ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT`);
  console.log("  ✅ Column added\n");

  // ── 4. Seed demo user ───────────────────────────────────────────────
  console.log("👤 Seeding demo user...");
  const existingUser = await query(`SELECT id FROM weekwise_users WHERE id = $1`, ['demo-user']);
  if (existingUser.length === 0) {
    await query(`INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done)
      VALUES ($1, $2, $3, $4, 1)`,
      ['demo-user', 'Stop overspending', 'Too many subscriptions', 'manual']);
    console.log("  ✅ Demo user created");
  } else {
    console.log("  ℹ️  Demo user already exists");
  }
  console.log();

  // ── 5. Seed demo auth account ───────────────────────────────────────
  console.log("🔑 Seeding demo auth account (demo@weekwise.app / Demo123456)...");
  const existingAuth = await query(`SELECT id FROM weekwise_auth WHERE email = $1`, ['demo@weekwise.app']);
  if (existingAuth.length === 0) {
    const hash = createHash("sha256").update("Demo123456").digest("hex");
    await query(`INSERT INTO weekwise_auth (id, email, password_hash, user_id)
      VALUES ($1, $2, $3, $4)`,
      ['demo-auth', 'demo@weekwise.app', hash, 'demo-user']);
    console.log("  ✅ Demo auth account created");
  } else {
    console.log("  ℹ️  Demo auth account already exists");
  }
  console.log();

  // ── 6. Seed demo subscription ───────────────────────────────────────
  console.log("💳 Seeding demo subscription...");
  const existingSub = await query(`SELECT id FROM weekwise_subscriptions WHERE user_id = $1`, ['demo-user']);
  if (existingSub.length === 0) {
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await query(`INSERT INTO weekwise_subscriptions (id, user_id, plan_type, status, trial_end)
      VALUES ($1, $2, $3, $4, $5)`,
      ['demo-sub', 'demo-user', 'monthly', 'trialing', trialEnd]);
    console.log("  ✅ Demo subscription created (14-day trial)");
  } else {
    console.log("  ℹ️  Demo subscription already exists");
  }
  console.log();

  // ── 7. Seed demo transactions ───────────────────────────────────────
  console.log("💸 Seeding demo transactions...");
  const txnCount = await query(`SELECT COUNT(*)::int as cnt FROM weekwise_transactions WHERE user_id = $1`, ['demo-user']);
  if (txnCount[0].cnt === 0) {
    const txns = [
      ['txn-1', 'Netflix', -15.99, 'cat-entertainment', '2026-07-01', 1, 1],
      ['txn-2', 'Uber Ride', -12.50, 'cat-transport', '2026-06-30', 0, 0],
      ['txn-3', 'Amazon Purchase', -47.20, 'cat-shopping', '2026-06-29', 0, 0],
      ['txn-4', 'Chipotle', -18.40, 'cat-food', '2026-06-28', 0, 0],
      ['txn-5', 'Spotify', -9.99, 'cat-entertainment', '2026-07-01', 1, 1],
      ['txn-6', 'Gym Membership', -49.00, 'cat-health', '2026-07-01', 1, 1],
      ['txn-7', 'Salary Deposit', 5200.00, 'cat-income', '2026-06-25', 1, 0],
      ['txn-8', 'Whole Foods', -83.15, 'cat-food', '2026-06-27', 0, 0],
    ];
    for (const t of txns) {
      await query(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
        VALUES ($1, 'demo-user', $2, $3, $4, $5, $6, $7)`, t);
    }
    console.log(`  ✅ ${txns.length} demo transactions created`);
  } else {
    console.log(`  ℹ️  ${txnCount[0].cnt} demo transactions already exist`);
  }
  console.log();

  // ── 8. Seed demo insight ────────────────────────────────────────────
  console.log("💡 Seeding demo insight...");
  const existingInsight = await query(`SELECT id FROM weekwise_insights WHERE user_id = $1`, ['demo-user']);
  if (existingInsight.length === 0) {
    await query(`INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text)
      VALUES ($1, 'demo-user', $2, $3, $4)`,
      ['insight-1', '2026-06-28',
       'Your dining spending is up 24% this week — $101.55 vs $82 last week.',
       'Try cooking at home 2 more nights this week to bring it back down.']);
    console.log("  ✅ Demo insight created");
  } else {
    console.log("  ℹ️  Demo insight already exists");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("   Sign in at https://week-wise-xi.vercel.app/auth");
  console.log("   Email:    demo@weekwise.app");
  console.log("   Password: Demo123456");
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});