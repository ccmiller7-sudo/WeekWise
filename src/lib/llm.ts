import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _client;
}

// ── Categorize a transaction ─────────────────────────────────────────────

const CATEGORIES = [
  { id: "cat-food", name: "Food & Dining" },
  { id: "cat-transport", name: "Transportation" },
  { id: "cat-entertainment", name: "Entertainment" },
  { id: "cat-shopping", name: "Shopping" },
  { id: "cat-housing", name: "Housing" },
  { id: "cat-utils", name: "Utilities" },
  { id: "cat-health", name: "Health" },
  { id: "cat-income", name: "Income" },
  { id: "cat-other", name: "Other" },
];

const CAT_LIST = CATEGORIES.map((c) => `"${c.id}" = ${c.name}`).join(", ");

export async function categorizeTransaction(
  description: string,
  amount: number
): Promise<{ categoryId: string; categoryName: string }> {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal finance categorizer. Given a transaction description and amount, return ONLY a JSON object with "categoryId" (one of: ${CAT_LIST}) and "categoryName" (the human-readable name). Respond with raw JSON only, no markdown.`,
        },
        {
          role: "user",
          content: `Transaction: "${description}" for $${Math.abs(amount).toFixed(2)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const text = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim());
    return { categoryId: parsed.categoryId, categoryName: parsed.categoryName };
  } catch (err) {
    console.error("LLM categorization error:", err);
    return { categoryId: "cat-other", categoryName: "Other" };
  }
}

// ── Bulk categorize transactions (for CSV import) ─────────────────────────

export async function categorizeTransactionsBulk(
  items: Array<{ description: string; amount: number }>
): Promise<Array<{ description: string; amount: number; categoryId: string; categoryName: string }>> {
  try {
    const client = getClient();
    const lines = items.map((i, idx) => `[${idx}] "${i.description}" for ${Math.abs(i.amount).toFixed(2)}`).join("\n");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal finance categorizer. Given a list of transactions, categorize each one. Return ONLY a JSON array of objects with keys "index", "categoryId" (one of: ${CAT_LIST}), and "categoryName". Respond with raw JSON only, no markdown.`,
        },
        { role: "user", content: `Categorize these transactions:\n${lines}` },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim());
    const results: Array<{ description: string; amount: number; categoryId: string; categoryName: string }> = [];

    for (const item of parsed) {
      const original = items[item.index];
      if (original) {
        results.push({
          description: original.description,
          amount: original.amount,
          categoryId: item.categoryId || "cat-other",
          categoryName: item.categoryName || "Other",
        });
      }
    }

    // Fill in any missing items
    for (let i = 0; i < items.length; i++) {
      if (!results.find((r) => r.description === items[i].description && r.amount === items[i].amount)) {
        results.push({
          description: items[i].description,
          amount: items[i].amount,
          categoryId: "cat-other",
          categoryName: "Other",
        });
      }
    }

    return results;
  } catch (err) {
    console.error("LLM bulk categorization error:", err);
    return items.map((i) => ({
      description: i.description,
      amount: i.amount,
      categoryId: "cat-other",
      categoryName: "Other",
    }));
  }
}

// ── Generate a weekly insight ─────────────────────────────────────────────

export async function generateInsight(
  transactions: Array<{ description: string; amount: number; category: string; date: string }>
): Promise<{ insightText: string; actionText: string }> {
  const summary = transactions
    .map((t) => `${t.date}: ${t.description} ($${t.amount.toFixed(2)})`)
    .join("\n");

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal finance coach. Given a list of transactions, return ONE key insight about the user's spending and ONE recommended action. Respond ONLY with a JSON object: {"insightText": "...", "actionText": "..."}. Keep each to 1-2 sentences, plain English, specific and actionable. Raw JSON only.`,
        },
        {
          role: "user",
          content: `Here are my recent transactions:\n${summary || "No transactions this week."}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim());
    return { insightText: parsed.insightText, actionText: parsed.actionText || "" };
  } catch (err) {
    console.error("LLM insight error:", err);
    return {
      insightText: "We're analyzing your spending patterns. Check back soon for insights!",
      actionText: "Keep tracking your expenses to get personalized recommendations.",
    };
  }
}

// ── Coach Q&A ────────────────────────────────────────────────────────────

export async function coachAnswer(
  question: string,
  transactions: Array<{ description: string; amount: number; category: string; date: string }>
): Promise<string> {
  const summary = transactions
    .map((t) => `${t.date}: ${t.description} ($${t.amount.toFixed(2)})`)
    .join("\n");

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly personal finance coach. Answer the user's question about their spending based on their transaction history. Be specific, reference actual numbers, and give actionable advice. Keep your answer to 2-4 sentences. Use the transaction data provided.`,
        },
        {
          role: "user",
          content: `My recent transactions:\n${summary || "No transactions yet."}\n\nMy question: ${question}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "I'm not sure — could you rephrase that?";
  } catch (err) {
    console.error("LLM coach error:", err);
    return "I'm having trouble connecting right now. Please try again in a moment!";
  }
}