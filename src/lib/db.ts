import { Client } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_vyz1GadFns8w@ep-solitary-art-at1qy1km.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function query(sql: string, params?: any[]): Promise<any[]> {
  const client = new Client(DATABASE_URL);
  await client.connect();
  try {
    const result = await client.query(sql, params || []);
    return result.rows;
  } finally {
    await client.end();
  }
}

// ── Schema Init ───────────────────────────────────────────────────────────

export async function initSchema(): Promise<void> {
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

  // Seed categories
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

  // Add plaid_transaction_id column if not exists
  await query(`ALTER TABLE weekwise_transactions ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT`);
}

// ── Seed demo data ────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  await initSchema();

  // Create demo user
  const existing = await query(`SELECT id FROM weekwise_users WHERE id = $1`, ['demo-user']);
  if (existing.length === 0) {
    await query(`INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done)
      VALUES ($1, $2, $3, $4, 1)`,
      ['demo-user', 'Stop overspending', 'Too many subscriptions', 'manual']);
  }

  // Seed demo transactions
  const count = await query(`SELECT COUNT(*)::int as cnt FROM weekwise_transactions WHERE user_id = $1`, ['demo-user']);
  if (count[0].cnt === 0) {
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
  }

  // Seed demo insight
  const insights = await query(`SELECT id FROM weekwise_insights WHERE user_id = $1`, ['demo-user']);
  if (insights.length === 0) {
    await query(`INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text)
      VALUES ($1, 'demo-user', $2, $3, $4)`,
      ['insight-1', '2026-06-28',
       'Your dining spending is up 24% this week — $101.55 vs $82 last week.',
       'Try cooking at home 2 more nights this week to bring it back down.']);
  }

  // Seed demo auth account (demo@weekwise.app / Demo123456)
  const demoAuth = await query(`SELECT id FROM weekwise_auth WHERE email = $1`, ['demo@weekwise.app']);
  if (demoAuth.length === 0) {
    const crypto = await import("node:crypto");
    const hash = crypto.createHash("sha256").update("Demo123456").digest("hex");
    await query(`INSERT INTO weekwise_auth (id, email, password_hash, user_id)
      VALUES ($1, $2, $3, $4)`,
      ['demo-auth', 'demo@weekwise.app', hash, 'demo-user']);
  }
}

// ── User helpers ───────────────────────────────────────────────────────────

export async function createUser(
  id: string,
  goal: string,
  painPoint: string,
  syncMethod: string
): Promise<{ id: string; goal: string; painPoint: string; syncMethod: string }> {
  await query(`INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done)
    VALUES ($1, $2, $3, $4, 1)`, [id, goal, painPoint, syncMethod]);
  return { id, goal, painPoint, syncMethod };
}

export async function getUser(id: string): Promise<{
  id: string;
  goal: string | null;
  painPoint: string | null;
  syncMethod: string | null;
  createdAt: string;
  onboardingDone: number;
} | null> {
  const rows = await query(`SELECT id, goal, pain_point, sync_method, created_at, onboarding_done
    FROM weekwise_users WHERE id = $1`, [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    goal: r.goal,
    painPoint: r.pain_point,
    syncMethod: r.sync_method,
    createdAt: r.created_at,
    onboardingDone: r.onboarding_done,
  };
}

// ── Transaction helpers ────────────────────────────────────────────────────

export async function createTransaction(params: {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  isRecurring?: boolean;
  isSubscription?: boolean;
}): Promise<any> {
  await query(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [params.id, params.userId, params.description, params.amount,
     params.category, params.date, params.isRecurring ? 1 : 0, params.isSubscription ? 1 : 0]);
  return params;
}

export async function getTransactions(
  userId: string,
  options?: { category?: string; limit?: number; offset?: number }
): Promise<any[]> {
  let sql = `SELECT * FROM weekwise_transactions WHERE user_id = $1`;
  const params: any[] = [userId];
  if (options?.category) {
    params.push(options.category);
    sql += ` AND category = $2`;
  }
  sql += ` ORDER BY date DESC`;
  if (options?.limit) {
    params.push(options.limit);
    sql += ` LIMIT $${params.length}`;
  }
  return await query(sql, params);
}

export async function updateTransactionCategory(
  id: string,
  category: string
): Promise<boolean> {
  await query(`UPDATE weekwise_transactions SET category = $1 WHERE id = $2`, [category, id]);
  return true;
}

export async function bulkCreateTransactions(
  txns: Array<{
    id: string;
    userId: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    isRecurring?: boolean;
    isSubscription?: boolean;
  }>
): Promise<number> {
  for (const t of txns) {
    await query(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [t.id, t.userId, t.description, t.amount, t.category, t.date,
       t.isRecurring ? 1 : 0, t.isSubscription ? 1 : 0]);
  }
  return txns.length;
}

// ── Category helpers ──────────────────────────────────────────────────────

export async function getCategories(): Promise<any[]> {
  return await query(`SELECT * FROM weekwise_categories ORDER BY name`);
}

// ── Insight helpers ───────────────────────────────────────────────────────

export async function getInsights(userId: string): Promise<any[]> {
  return await query(`SELECT * FROM weekwise_insights
    WHERE user_id = $1
    ORDER BY week_start DESC
    LIMIT 5`, [userId]);
}

export async function createInsight(params: {
  id: string;
  userId: string;
  weekStart: string;
  insightText: string;
  actionText?: string;
}): Promise<any> {
  await query(`INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text)
    VALUES ($1, $2, $3, $4, $5)`,
    [params.id, params.userId, params.weekStart, params.insightText, params.actionText || null]);
  return { id: params.id, insight_text: params.insightText, action_text: params.actionText };
}

// ── Auth helpers ────────────────────────────────────────────────────────────

export async function createAuthUser(
  id: string,
  email: string,
  passwordHash: string,
  userId: string
): Promise<void> {
  await query(`INSERT INTO weekwise_auth (id, email, password_hash, user_id)
    VALUES ($1, $2, $3, $4)`, [id, email, passwordHash, userId]);
}

export async function updateAuthPassword(
  email: string,
  passwordHash: string
): Promise<void> {
  await query(`UPDATE weekwise_auth SET password_hash = $1 WHERE email = $2`, [passwordHash, email]);
}

export async function getAuthByEmail(email: string): Promise<{
  id: string;
  email: string;
  password_hash: string;
  user_id: string;
} | null> {
  const rows = await query(`SELECT id, email, password_hash, user_id FROM weekwise_auth WHERE email = $1`, [email]);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getAuthByUserId(userId: string): Promise<{
  id: string;
  email: string;
  user_id: string;
} | null> {
  const rows = await query(`SELECT id, email, user_id FROM weekwise_auth WHERE user_id = $1`, [userId]);
  if (rows.length === 0) return null;
  return rows[0];
}

// ── Plaid helpers ─────────────────────────────────────────────────────────

export async function createPlaidItem(params: {
  id: string;
  userId: string;
  accessToken: string;
  plaidItemId?: string;
  plaidAccountId?: string;
  bankName?: string;
}): Promise<void> {
  await query(`INSERT INTO weekwise_plaid_items (id, user_id, plaid_access_token, plaid_item_id, plaid_account_id, bank_name)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [params.id, params.userId, params.accessToken,
     params.plaidItemId || null, params.plaidAccountId || null, params.bankName || null]);
}

export async function getPlaidItems(userId: string): Promise<any[]> {
  return await query(`SELECT * FROM weekwise_plaid_items WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
}

export async function getPlaidItem(id: string): Promise<any | null> {
  const rows = await query(`SELECT * FROM weekwise_plaid_items WHERE id = $1`, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function deletePlaidItem(id: string): Promise<void> {
  await query(`DELETE FROM weekwise_plaid_items WHERE id = $1`, [id]);
}

export async function updatePlaidSyncTime(id: string): Promise<void> {
  await query(`UPDATE weekwise_plaid_items SET last_sync_at = NOW() WHERE id = $1`, [id]);
}

export async function getTransactionByPlaidId(plaidTransactionId: string): Promise<any | null> {
  const rows = await query(`SELECT id FROM weekwise_transactions WHERE plaid_transaction_id = $1 LIMIT 1`, [plaidTransactionId]);
  return rows.length > 0 ? rows[0] : null;
}

// ── Subscription helpers ───────────────────────────────────────────────────

export async function createSubscription(params: {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planType: string;
  status: string;
  trialEnd?: string;
  currentPeriodEnd?: string;
}): Promise<void> {
  await query(`INSERT INTO weekwise_subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_type, status, trial_end, current_period_end)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [params.id, params.userId, params.stripeCustomerId || null, params.stripeSubscriptionId || null,
     params.planType, params.status, params.trialEnd || null, params.currentPeriodEnd || null]);
}

export async function getSubscription(userId: string): Promise<{
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: string;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  created_at: string;
} | null> {
  const rows = await query(`SELECT * FROM weekwise_subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateSubscriptionStatus(
  userId: string,
  status: string,
  stripeSubscriptionId?: string,
  currentPeriodEnd?: string
): Promise<void> {
  const sets: string[] = ['status = $1'];
  const params: any[] = [status];
  let idx = 2;

  if (stripeSubscriptionId) {
    sets.push(`stripe_subscription_id = $${idx++}`);
    params.push(stripeSubscriptionId);
  }
  if (currentPeriodEnd) {
    sets.push(`current_period_end = $${idx++}`);
    params.push(currentPeriodEnd);
  }

  params.push(userId);
  await query(`UPDATE weekwise_subscriptions SET ${sets.join(', ')} WHERE user_id = $${idx}`, params);
}

export async function getActiveSubscription(userId: string): Promise<{
  status: string;
  plan_type: string;
  trial_end: string | null;
  current_period_end: string | null;
} | null> {
  const sub = await getSubscription(userId);
  if (!sub) return null;
  return { status: sub.status, plan_type: sub.plan_type, trial_end: sub.trial_end, current_period_end: sub.current_period_end };
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<{
  user_id: string;
} | null> {
  const rows = await query(`SELECT user_id FROM weekwise_subscriptions WHERE stripe_subscription_id = $1 LIMIT 1`, [stripeSubscriptionId]);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateSubscriptionCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await query(`UPDATE weekwise_subscriptions SET stripe_customer_id = $1 WHERE user_id = $2`, [stripeCustomerId, userId]);
}

// ── App subscription helpers ───────────────────────────────────────────────

export async function getSubscriptions(userId: string): Promise<any[]> {
  return await query(`SELECT * FROM weekwise_transactions
    WHERE user_id = $1 AND is_subscription = 1
    ORDER BY amount DESC`, [userId]);
}