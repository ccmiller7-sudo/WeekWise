import { Pool } from "@neondatabase/serverless";
import crypto from "node:crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_users (
        id TEXT PRIMARY KEY, goal TEXT, pain_point TEXT, sync_method TEXT,
        onboarding_done INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (NOW())
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_auth (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
        user_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (NOW())
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_transactions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, description TEXT NOT NULL,
        amount REAL NOT NULL, category TEXT, date TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0, is_subscription INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (NOW()), plaid_transaction_id TEXT
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_categories (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_insights (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, week_start TEXT NOT NULL,
        insight_text TEXT NOT NULL, action_text TEXT, completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (NOW())
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_subscriptions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, stripe_customer_id TEXT,
        stripe_subscription_id TEXT, plan_type TEXT NOT NULL DEFAULT 'monthly',
        status TEXT NOT NULL DEFAULT 'trialing', trial_end TEXT,
        current_period_end TEXT, created_at TEXT NOT NULL DEFAULT (NOW())
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekwise_plaid_items (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plaid_item_id TEXT,
        plaid_access_token TEXT NOT NULL, plaid_account_id TEXT,
        bank_name TEXT, last_sync_at TEXT, created_at TEXT NOT NULL DEFAULT (NOW())
      )
    `);

    // Seed categories
    await pool.query(`
      INSERT INTO weekwise_categories (id, name, icon) VALUES
      ('cat-food', 'Food & Dining', 'fork'),
      ('cat-transport', 'Transportation', 'car'),
      ('cat-entertainment', 'Entertainment', 'film'),
      ('cat-shopping', 'Shopping', 'bag'),
      ('cat-housing', 'Housing', 'house'),
      ('cat-utils', 'Utilities', 'bolt'),
      ('cat-health', 'Health', 'pill'),
      ('cat-income', 'Income', 'money'),
      ('cat-other', 'Other', 'box')
      ON CONFLICT (id) DO NOTHING
    `);

    // Check if demo user exists
    const existing = await pool.query("SELECT id FROM weekwise_users WHERE id = 'demo-user'");
    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done) VALUES ($1, $2, $3, $4, 1)",
        ['demo-user', 'Stop overspending', 'Too many subscriptions', 'manual']
      );
      console.log("Created demo user");
    } else {
      console.log("Demo user already exists");
    }

    // Check if demo auth exists
    const demoAuth = await pool.query("SELECT id FROM weekwise_auth WHERE email = $1", ['demo@weekwise.app']);
    if (demoAuth.rows.length === 0) {
      const hash = crypto.createHash("sha256").update("Demo123456").digest("hex");
      await pool.query(
        "INSERT INTO weekwise_auth (id, email, password_hash, user_id) VALUES ($1, $2, $3, $4)",
        ['demo-auth', 'demo@weekwise.app', hash, 'demo-user']
      );
      console.log("Created demo auth account. Hash:", hash);
    } else {
      console.log("Demo auth already exists. Hash:", demoAuth.rows[0].password_hash);
    }

    // Seed demo transactions
    const txnCount = await pool.query("SELECT COUNT(*)::int as cnt FROM weekwise_transactions WHERE user_id = 'demo-user'");
    if (txnCount.rows[0].cnt === 0) {
      const txns = [
        ['txn-1', 'Netflix', -15.99, 'cat-entertainment', '2026-07-01'],
        ['txn-2', 'Uber Ride', -12.50, 'cat-transport', '2026-06-30'],
        ['txn-3', 'Amazon Purchase', -47.20, 'cat-shopping', '2026-06-29'],
        ['txn-4', 'Chipotle', -18.40, 'cat-food', '2026-06-28'],
        ['txn-5', 'Spotify', -9.99, 'cat-entertainment', '2026-07-01'],
        ['txn-6', 'Gym Membership', -49.00, 'cat-health', '2026-07-01'],
        ['txn-7', 'Salary Deposit', 5200.00, 'cat-income', '2026-06-25'],
        ['txn-8', 'Whole Foods', -83.15, 'cat-food', '2026-06-27'],
      ];
      for (const t of txns) {
        await pool.query(
          "INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date) VALUES ($1, 'demo-user', $2, $3, $4, $5)",
          t
        );
      }
      console.log("Seeded", txns.length, "demo transactions");
    }

    // Seed demo insight
    const insCount = await pool.query("SELECT id FROM weekwise_insights WHERE user_id = 'demo-user'");
    if (insCount.rows.length === 0) {
      await pool.query(
        "INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text) VALUES ($1, 'demo-user', $2, $3, $4)",
        ['insight-1', '2026-06-28', 'Your dining spending is up 24% this week — $101.55 vs $82 last week.',
         'Try cooking at home 2 more nights this week to bring it back down.']
      );
      console.log("Seeded demo insight");
    }

    console.log("✅ All done!");
  } catch (e) {
    console.error("FAILED:", e);
  } finally {
    await pool.end();
  }
}

main();
