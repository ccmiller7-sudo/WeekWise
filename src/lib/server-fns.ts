import { createServerFn } from "@tanstack/react-start";
import { generateId } from "~/lib/utils";

// ── Health Check ──────────────────────────────────────────────────────────

export const getHealth = createServerFn({ method: "GET" }).handler(async () => {
  const { getCategories, initSchema } = await import("~/lib/db");
  let dbStatus = "disconnected";
  let catCount = 0;
  try {
    await initSchema();
    const cats = await getCategories();
    catCount = cats.length;
    dbStatus = "connected";
  } catch (e) {
    dbStatus = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }
  return {
    status: "ok",
    service: "weekwise",
    database: dbStatus,
    categories: catCount,
    timestamp: new Date().toISOString(),
  };
});

// ── Onboarding ────────────────────────────────────────────────────────────

export const submitOnboarding = createServerFn({ method: "POST" }).handler(
  async (data: { goal: string; painPoint: string; syncMethod: string }) => {
    const { createUser } = await import("~/lib/db");
    const userId = generateId();
    await createUser(userId, data.goal, data.painPoint, data.syncMethod);
    return { success: true, userId, ...data };
  }
);

// ── Transactions ──────────────────────────────────────────────────────────

export const fetchTransactions = createServerFn({ method: "GET" }).handler(
  async (data: { userId?: string; category?: string; limit?: number }) => {
    const { getTransactions, getCategories } = await import("~/lib/db");
    const txns = await getTransactions(data.userId || "demo-user", {
      category: data.category,
      limit: data.limit,
    });
    const cats = await getCategories();
    return { transactions: txns, categories: cats };
  }
);

export const updateTransactionCategory = createServerFn({ method: "POST" }).handler(
  async (data: { id: string; category: string }) => {
    const { updateTransactionCategory: updateCat } = await import("~/lib/db");
    const result = await updateCat(data.id, data.category);
    return { success: result };
  }
);

export const importCSVTransactions = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string; transactions: Array<{ description: string; amount: number; date?: string }> }) => {
    const { bulkCreateTransactions } = await import("~/lib/db");
    const { categorizeTransactionsBulk } = await import("~/lib/llm");
    const { generateId } = await import("~/lib/utils");

    // Auto-categorize via LLM
    const categorized = await categorizeTransactionsBulk(
      data.transactions.map((t) => ({ description: t.description, amount: t.amount }))
    );

    const txns = categorized.map((c, i) => ({
      id: generateId(),
      userId: data.userId,
      description: c.description,
      amount: c.amount,
      category: c.categoryId,
      date: data.transactions[i]?.date || new Date().toISOString().split("T")[0],
    }));

    const count = await bulkCreateTransactions(txns);
    return { success: true, imported: count };
  }
);

export const addTransaction = createServerFn({ method: "POST" }).handler(
  async (data: {
    userId: string;
    description: string;
    amount: number;
    category?: string;
    isRecurring?: boolean;
    isSubscription?: boolean;
  }) => {
    const { createTransaction } = await import("~/lib/db");
    const { categorizeTransaction } = await import("~/lib/llm");
    const id = generateId();
    const date = new Date().toISOString().split("T")[0];

    // Auto-categorize via LLM if no category provided
    let category = data.category;
    if (!category) {
      const result = await categorizeTransaction(data.description, data.amount);
      category = result.categoryId;
    }

    await createTransaction({
      id,
      userId: data.userId,
      description: data.description,
      amount: data.amount,
      category: category || "cat-other",
      date,
      isRecurring: data.isRecurring,
      isSubscription: data.isSubscription,
    });
    return { success: true, id, category };
  }
);

// ── Insights ──────────────────────────────────────────────────────────────

export const fetchInsights = createServerFn({ method: "GET" }).handler(
  async (data: { userId?: string }) => {
    const { getInsights } = await import("~/lib/db");
    const insights = await getInsights(data.userId || "demo-user");
    return { insights };
  }
);

export const generateInsight = createServerFn({ method: "POST" }).handler(
  async (data: { userId?: string }) => {
    const { getTransactions, createInsight } = await import("~/lib/db");
    const { generateInsight: llmInsight } = await import("~/lib/llm");

    const userId = data.userId || "demo-user";
    const txns = await getTransactions(userId);

    // Generate insight via LLM
    const { insightText, actionText } = await llmInsight(txns);

    const id = generateId();
    const weekStart = new Date().toISOString().split("T")[0];
    await createInsight({ id, userId, weekStart, insightText, actionText });

    return { success: true, insight: { id, insightText, actionText } };
  }
);

// ── Coach ─────────────────────────────────────────────────────────────────

export const askCoach = createServerFn({ method: "POST" }).handler(
  async (data: { question: string; userId?: string }) => {
    const { getTransactions } = await import("~/lib/db");
    const { coachAnswer } = await import("~/lib/llm");

    const userId = data.userId || "demo-user";
    const txns = await getTransactions(userId);
    const answer = await coachAnswer(data.question, txns);
    return { success: true, answer };
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────

export const signup = createServerFn({ method: "POST" }).handler(
  async (data: { email: string; password: string }) => {
    const { createAuthUser, getAuthByEmail, createUser, createSubscription } = await import("~/lib/db");
    const { generateId } = await import("~/lib/utils");
    const crypto = await import("node:crypto");

    const existing = await getAuthByEmail(data.email);
    if (existing) {
      return { success: false, error: "Email already registered" };
    }

    const hash = crypto.createHash("sha256").update(data.password).digest("hex");
    const authId = generateId();
    const userId = generateId();

    await createAuthUser(authId, data.email, hash, userId);
    await createUser(userId, "", "", "manual");
    const subId = generateId();
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await createSubscription({
      id: subId,
      userId,
      planType: "monthly",
      status: "trialing",
      trialEnd,
    });

    return { success: true, userId, email: data.email };
  }
);

export const login = createServerFn({ method: "POST" }).handler(
  async (data: { email: string; password: string }) => {
    const { getAuthByEmail } = await import("~/lib/db");
    const crypto = await import("node:crypto");

    const auth = await getAuthByEmail(data.email);
    if (!auth) {
      return { success: false, error: "Invalid email or password" };
    }

    const hash = crypto.createHash("sha256").update(data.password).digest("hex");
    if (hash !== auth.password_hash) {
      return { success: false, error: "Invalid email or password" };
    }

    return { success: true, userId: auth.user_id, email: auth.email };
  }
);

// ── Subscriptions ─────────────────────────────────────────────────────────

export const getSubscriptionStatus = createServerFn({ method: "GET" }).handler(
  async (data: { userId?: string }) => {
    const { getActiveSubscription } = await import("~/lib/db");
    const userId = data.userId || "demo-user";
    const sub = await getActiveSubscription(userId);
    if (!sub) {
      const { createSubscription } = await import("~/lib/db");
      const { generateId } = await import("~/lib/utils");
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await createSubscription({
        id: generateId(),
        userId,
        planType: "monthly",
        status: "trialing",
        trialEnd,
      });
      return { status: "trialing", planType: "monthly", trialEnd };
    }
    return sub;
  }
);

export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string; planType: string }) => {
    const monthlyLink = "https://buy.stripe.com/6oU9ATdYdbrc8AZ9yS9MY00";
    const annualLink = "https://buy.stripe.com/fZubJ1g6l9j418xbH09MY01";
    const link = data.planType === "annual" ? annualLink : monthlyLink;
    return { url: link };
  }
);

export const createPortalSession = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string }) => {
    const { getSubscription } = await import("~/lib/db");
    const sub = await getSubscription(data.userId);
    if (!sub || !sub.stripe_customer_id) {
      return { error: "No active subscription found with a Stripe customer ID." };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { error: "STRIPE_SECRET_KEY not configured." };
    }

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" as any });
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: `${process.env.PUBLIC_SITE_URL || "https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app"}/onboarding`,
      });
      return { url: session.url };
    } catch (err) {
      console.error("Portal session creation failed:", err);
      return { error: "Failed to create billing portal session." };
    }
  }
);

// Manual subscription activation — user clicks this after paying on Stripe
// (fallback since static payment links can't carry client_reference_id for webhook matching)
export const activateSubscription = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string }) => {
    const { getSubscription, updateSubscriptionStatus } = await import("~/lib/db");
    const sub = await getSubscription(data.userId);
    if (!sub) {
      return { error: "No subscription found. Please sign up first." };
    }
    if (sub.status === "active") {
      return { success: true, message: "Subscription already active." };
    }
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await updateSubscriptionStatus(data.userId, "active", undefined, periodEnd);
    return { success: true, currentPeriodEnd: periodEnd };
  }
);

// ── Plaid Integration ───────────────────────────────────────────────────────

export const createLinkToken = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string }) => {
    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;
    const plaidEnv = process.env.PLAID_ENV || "sandbox";

    if (!plaidClientId || !plaidSecret) {
      return { error: "Bank sync not configured yet — use manual entry or CSV import in the meantime." };
    }

    try {
      const { Configuration, PlaidApi, PlaidEnvironments } = await import("plaid");
      const config = new Configuration({
        basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
        baseOptions: {
          headers: { "PLAID-CLIENT-ID": plaidClientId, "PLAID-SECRET": plaidSecret },
        },
      });
      const client = new PlaidApi(config);
      const response = await client.linkTokenCreate({
        user: { client_user_id: data.userId },
        client_name: "WeekWise",
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
      });
      return { linkToken: response.data.link_token };
    } catch (err) {
      console.error("Plaid link token failed:", err);
      return { error: "Failed to create link token. Check Plaid credentials." };
    }
  }
);

export const exchangePublicToken = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string; publicToken: string }) => {
    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;
    const plaidEnv = process.env.PLAID_ENV || "sandbox";

    if (!plaidClientId || !plaidSecret) {
      return { error: "Bank sync not configured yet." };
    }

    try {
      const { Configuration, PlaidApi, PlaidEnvironments } = await import("plaid");
      const config = new Configuration({
        basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
        baseOptions: {
          headers: { "PLAID-CLIENT-ID": plaidClientId, "PLAID-SECRET": plaidSecret },
        },
      });
      const client = new PlaidApi(config);

      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: data.publicToken,
      });
      const accessToken = tokenResponse.data.access_token;
      const itemId = tokenResponse.data.item_id;

      // Store the Plaid item
      const { createPlaidItem } = await import("~/lib/db");
      const { generateId } = await import("~/lib/utils");
      const plaidDbId = generateId();
      await createPlaidItem({
        id: plaidDbId,
        userId: data.userId,
        accessToken,
        plaidItemId: itemId,
      });

      // Trigger initial sync
      const { syncPlaidTransactions } = await import("./server-fns");
      await syncPlaidTransactions({ userId: data.userId, plaidItemId: plaidDbId });

      return { success: true, plaidItemId: plaidDbId };
    } catch (err) {
      console.error("Plaid token exchange failed:", err);
      return { error: "Failed to link bank account." };
    }
  }
);

export const syncPlaidTransactions = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string; plaidItemId: string }) => {
    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;
    const plaidEnv = process.env.PLAID_ENV || "sandbox";

    if (!plaidClientId || !plaidSecret) {
      return { error: "Bank sync not configured yet." };
    }

    try {
      const { Configuration, PlaidApi, PlaidEnvironments } = await import("plaid");
      const config = new Configuration({
        basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
        baseOptions: {
          headers: { "PLAID-CLIENT-ID": plaidClientId, "PLAID-SECRET": plaidSecret },
        },
      });
      const client = new PlaidApi(config);

      const { getPlaidItem, bulkCreateTransactions, updatePlaidSyncTime, getTransactionByPlaidId } = await import("~/lib/db");
      const item = await getPlaidItem(data.plaidItemId);
      if (!item) return { error: "Linked account not found." };

      const response = await client.transactionsSync({
        access_token: item.plaid_access_token,
      });

      const added = response.data.added;
      const newTxns: Array<{
        id: string;
        userId: string;
        description: string;
        amount: number;
        category: string;
        date: string;
        plaid_transaction_id: string;
        isRecurring: boolean;
        isSubscription: boolean;
      }> = [];

      // Dedup by plaid_transaction_id
      for (const t of added) {
        const existing = await getTransactionByPlaidId(t.transaction_id);
        if (!existing) {
          newTxns.push({
            id: "",
            userId: data.userId,
            description: "",
            amount: 0,
            category: "cat-other",
            date: "",
            plaid_transaction_id: t.transaction_id,
            isRecurring: false,
            isSubscription: false,
          });
        }
      }

      if (newTxns.length > 0) {
        const { generateId } = await import("~/lib/utils");
        const { categorizeTransactionsBulk } = await import("~/lib/llm");

        // Build descriptions for LLM categorization
        const plaidTxns = added.filter((t: any) =>
          newTxns.some((n) => n.plaid_transaction_id === t.transaction_id)
        );

        const llmInput = plaidTxns.map((t: any) => ({
          description: t.name || t.merchant_name || "Unknown",
          amount: -Math.abs(t.amount),
        }));

        const categorized = await categorizeTransactionsBulk(llmInput);

        const enriched = plaidTxns.map((t: any, i: number) => ({
          id: generateId(),
          userId: data.userId,
          description: t.name || t.merchant_name || "Unknown",
          amount: -Math.abs(t.amount),
          category: categorized[i]?.categoryId || "cat-other",
          date: t.date || new Date().toISOString().split("T")[0],
          plaid_transaction_id: t.transaction_id,
          isRecurring: false,
          isSubscription: false,
        }));

        await bulkCreateTransactions(enriched);
      }

      await updatePlaidSyncTime(data.plaidItemId);

      return { success: true, synced: newTxns.length };
    } catch (err) {
      console.error("Plaid sync failed:", err);
      return { error: "Failed to sync transactions." };
    }
  }
);

export const getLinkedAccounts = createServerFn({ method: "GET" }).handler(
  async (data: { userId: string }) => {
    const { getPlaidItems } = await import("~/lib/db");
    const items = await getPlaidItems(data.userId);
    return { items };
  }
);