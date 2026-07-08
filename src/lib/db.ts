import { execSync } from "child_process";

function teamDb(sql: string): any[] {
  const result = execSync(`team-db "${sql.replace(/"/g, '\\"')}"`, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(result);
}

// ── Schema Init ───────────────────────────────────────────────────────────

export async function initSchema(): Promise<void> {
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_users (
    id TEXT PRIMARY KEY,
    goal TEXT,
    pain_point TEXT,
    sync_method TEXT,
    onboarding_done INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    is_subscription INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT
  )`);
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    insight_text TEXT NOT NULL,
    action_text TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  // Auth table
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_auth (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  // Subscription table
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'trialing',
    trial_end TEXT,
    current_period_end TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  // Seed categories
  teamDb(`INSERT OR IGNORE INTO weekwise_categories (id, name, icon) VALUES
    ('cat-food', 'Food & Dining', 'fork'),
    ('cat-transport', 'Transportation', 'car'),
    ('cat-entertainment', 'Entertainment', 'film'),
    ('cat-shopping', 'Shopping', 'bag'),
    ('cat-housing', 'Housing', 'house'),
    ('cat-utils', 'Utilities', 'bolt'),
    ('cat-health', 'Health', 'pill'),
    ('cat-income', 'Income', 'money'),
    ('cat-other', 'Other', 'box')
  `);
  // Add plaid_transaction_id to existing transactions table for dedup
  teamDb(`CREATE TABLE IF NOT EXISTS weekwise_plaid_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plaid_item_id TEXT,
    plaid_access_token TEXT NOT NULL,
    plaid_account_id TEXT,
    bank_name TEXT,
    last_sync_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  // Add plaid_transaction_id column if not exists (for deduplication)
  teamDb(`ALTER TABLE weekwise_transactions ADD COLUMN plaid_transaction_id TEXT`);
}

// ── Seed demo data ────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  await initSchema();
  // Create demo user
  const existing = teamDb(`SELECT id FROM weekwise_users WHERE id = 'demo-user'`);
  if (existing.length === 0) {
    teamDb(`INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done)
      VALUES ('demo-user', 'Stop overspending', 'Too many subscriptions', 'manual', 1)`);
  }

  // Seed demo transactions
  const count = teamDb(`SELECT COUNT(*) as cnt FROM weekwise_transactions WHERE user_id = 'demo-user'`);
  if (count[0].cnt === 0) {
    const txns = [
      `('txn-1', 'demo-user', 'Netflix', -15.99, 'cat-entertainment', '2026-07-01', 1, 1)`,
      `('txn-2', 'demo-user', 'Uber Ride', -12.50, 'cat-transport', '2026-06-30', 0, 0)`,
      `('txn-3', 'demo-user', 'Amazon Purchase', -47.20, 'cat-shopping', '2026-06-29', 0, 0)`,
      `('txn-4', 'demo-user', 'Chipotle', -18.40, 'cat-food', '2026-06-28', 0, 0)`,
      `('txn-5', 'demo-user', 'Spotify', -9.99, 'cat-entertainment', '2026-07-01', 1, 1)`,
      `('txn-6', 'demo-user', 'Gym Membership', -49.00, 'cat-health', '2026-07-01', 1, 1)`,
      `('txn-7', 'demo-user', 'Salary Deposit', 5200.00, 'cat-income', '2026-06-25', 1, 0)`,
      `('txn-8', 'demo-user', 'Whole Foods', -83.15, 'cat-food', '2026-06-27', 0, 0)`,
    ];
    for (const t of txns) {
      teamDb(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
        VALUES ${t}`);
    }
  }

  // Seed demo insight
  const insights = teamDb(`SELECT id FROM weekwise_insights WHERE user_id = 'demo-user'`);
  if (insights.length === 0) {
    teamDb(`INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text)
      VALUES ('insight-1', 'demo-user', '2026-06-28',
        'Your dining spending is up 24% this week — $101.55 vs $82 last week.',
        'Try cooking at home 2 more nights this week to bring it back down.')`);
  }
}

// ── User helpers ───────────────────────────────────────────────────────────

export async function createUser(
  id: string,
  goal: string,
  painPoint: string,
  syncMethod: string
): Promise<{ id: string; goal: string; painPoint: string; syncMethod: string }> {
  teamDb(`INSERT INTO weekwise_users (id, goal, pain_point, sync_method, onboarding_done)
    VALUES ('${id}', '${goal}', '${painPoint}', '${syncMethod}', 1)`);
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
  const rows = teamDb(`SELECT id, goal, pain_point, sync_method, created_at, onboarding_done
    FROM weekwise_users WHERE id = '${id}'`);
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    goal: rows[0].goal,
    painPoint: rows[0].pain_point,
    syncMethod: rows[0].sync_method,
    createdAt: rows[0].created_at,
    onboardingDone: rows[0].onboarding_done,
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
  teamDb(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
    VALUES ('${params.id}', '${params.userId}', '${params.description.replace(/'/g, "''")}', ${params.amount},
      '${params.category}', '${params.date}', ${params.isRecurring ? 1 : 0}, ${params.isSubscription ? 1 : 0})`);
  return params;
}

export async function getTransactions(
  userId: string,
  options?: { category?: string; limit?: number; offset?: number }
): Promise<any[]> {
  let sql = `SELECT * FROM weekwise_transactions WHERE user_id = '${userId}'`;
  if (options?.category) {
    sql += ` AND category = '${options.category}'`;
  }
  sql += ` ORDER BY date DESC`;
  if (options?.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  return teamDb(sql);
}

export async function updateTransactionCategory(
  id: string,
  category: string
): Promise<boolean> {
  teamDb(`UPDATE weekwise_transactions SET category = '${category}' WHERE id = '${id}'`);
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
    teamDb(`INSERT INTO weekwise_transactions (id, user_id, description, amount, category, date, is_recurring, is_subscription)
      VALUES ('${t.id}', '${t.userId}', '${t.description.replace(/'/g, "''")}', ${t.amount},
        '${t.category}', '${t.date}', ${t.isRecurring ? 1 : 0}, ${t.isSubscription ? 1 : 0})`);
  }
  return txns.length;
}

// ── Category helpers ──────────────────────────────────────────────────────

export async function getCategories(): Promise<any[]> {
  return teamDb(`SELECT * FROM weekwise_categories ORDER BY name`);
}

// ── Insight helpers ───────────────────────────────────────────────────────

export async function getInsights(userId: string): Promise<any[]> {
  return teamDb(`SELECT * FROM weekwise_insights
    WHERE user_id = '${userId}'
    ORDER BY week_start DESC
    LIMIT 5`);
}

export async function createInsight(params: {
  id: string;
  userId: string;
  weekStart: string;
  insightText: string;
  actionText?: string;
}): Promise<any> {
  const action = params.actionText ? `'${params.actionText.replace(/'/g, "''")}'` : "NULL";
  teamDb(`INSERT INTO weekwise_insights (id, user_id, week_start, insight_text, action_text)
    VALUES ('${params.id}', '${params.userId}', '${params.weekStart}',
      '${params.insightText.replace(/'/g, "''")}', ${action})`);
  return { id: params.id, insight_text: params.insightText, action_text: params.actionText };
}

// ── Auth helpers ────────────────────────────────────────────────────────────

export async function createAuthUser(
  id: string,
  email: string,
  passwordHash: string,
  userId: string
): Promise<void> {
  teamDb(`INSERT INTO weekwise_auth (id, email, password_hash, user_id)
    VALUES ('${id}', '${email.replace(/'/g, "''")}', '${passwordHash.replace(/'/g, "''")}', '${userId}')`);
}

export async function getAuthByEmail(email: string): Promise<{
  id: string;
  email: string;
  password_hash: string;
  user_id: string;
} | null> {
  const rows = teamDb(`SELECT id, email, password_hash, user_id FROM weekwise_auth WHERE email = '${email.replace(/'/g, "''")}'`);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getAuthByUserId(userId: string): Promise<{
  id: string;
  email: string;
  user_id: string;
} | null> {
  const rows = teamDb(`SELECT id, email, user_id FROM weekwise_auth WHERE user_id = '${userId}'`);
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
  const itemId = params.plaidItemId ? `'${params.plaidItemId.replace(/'/g, "''")}'` : 'NULL';
  const acctId = params.plaidAccountId ? `'${params.plaidAccountId.replace(/'/g, "''")}'` : 'NULL';
  const bank = params.bankName ? `'${params.bankName.replace(/'/g, "''")}'` : 'NULL';
  teamDb(`INSERT INTO weekwise_plaid_items (id, user_id, plaid_access_token, plaid_item_id, plaid_account_id, bank_name)
    VALUES ('${params.id}', '${params.userId}', '${params.accessToken.replace(/'/g, "''")}', ${itemId}, ${acctId}, ${bank})`);
}

export async function getPlaidItems(userId: string): Promise<any[]> {
  return teamDb(`SELECT * FROM weekwise_plaid_items WHERE user_id = '${userId}' ORDER BY created_at DESC`);
}

export async function getPlaidItem(id: string): Promise<any | null> {
  const rows = teamDb(`SELECT * FROM weekwise_plaid_items WHERE id = '${id}'`);
  return rows.length > 0 ? rows[0] : null;
}

export async function deletePlaidItem(id: string): Promise<void> {
  teamDb(`DELETE FROM weekwise_plaid_items WHERE id = '${id}'`);
}

export async function updatePlaidSyncTime(id: string): Promise<void> {
  teamDb(`UPDATE weekwise_plaid_items SET last_sync_at = datetime('now') WHERE id = '${id}'`);
}

export async function getTransactionByPlaidId(plaidTransactionId: string): Promise<any | null> {
  const rows = teamDb(`SELECT id FROM weekwise_transactions WHERE plaid_transaction_id = '${plaidTransactionId.replace(/'/g, "''")}' LIMIT 1`);
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
  const scid = params.stripeCustomerId ? `'${params.stripeCustomerId.replace(/'/g, "''")}'` : 'NULL';
  const ssid = params.stripeSubscriptionId ? `'${params.stripeSubscriptionId.replace(/'/g, "''")}'` : 'NULL';
  const te = params.trialEnd ? `'${params.trialEnd}'` : 'NULL';
  const cpe = params.currentPeriodEnd ? `'${params.currentPeriodEnd}'` : 'NULL';
  teamDb(`INSERT INTO weekwise_subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_type, status, trial_end, current_period_end)
    VALUES ('${params.id}', '${params.userId}', ${scid}, ${ssid}, '${params.planType}', '${params.status}', ${te}, ${cpe})`);
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
  const rows = teamDb(`SELECT * FROM weekwise_subscriptions WHERE user_id = '${userId}' ORDER BY created_at DESC LIMIT 1`);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateSubscriptionStatus(
  userId: string,
  status: string,
  stripeSubscriptionId?: string,
  currentPeriodEnd?: string
): Promise<void> {
  let sql = `UPDATE weekwise_subscriptions SET status = '${status}'`;
  if (stripeSubscriptionId) {
    sql += `, stripe_subscription_id = '${stripeSubscriptionId.replace(/'/g, "''")}'`;
  }
  if (currentPeriodEnd) {
    sql += `, current_period_end = '${currentPeriodEnd}'`;
  }
  sql += ` WHERE user_id = '${userId}'`;
  teamDb(sql);
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
  const rows = teamDb(`SELECT user_id FROM weekwise_subscriptions WHERE stripe_subscription_id = '${stripeSubscriptionId.replace(/'/g, "''")}' LIMIT 1`);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateSubscriptionCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  teamDb(`UPDATE weekwise_subscriptions SET stripe_customer_id = '${stripeCustomerId.replace(/'/g, "''")}' WHERE user_id = '${userId}'`);
}

// ── App subscription helpers ───────────────────────────────────────────────

export async function getSubscriptions(userId: string): Promise<any[]> {
  return teamDb(`SELECT * FROM weekwise_transactions
    WHERE user_id = '${userId}' AND is_subscription = 1
    ORDER BY amount DESC`);
}
