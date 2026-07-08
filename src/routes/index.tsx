import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fetchTransactions, fetchInsights, generateInsight, getSubscriptionStatus } from "~/lib/server-fns";
import { useState, useEffect } from "react";
import MarketingPage from "./-marketing-page";

export const Route = createFileRoute("/")({
  component: Home,
});

function getUserId(): string {
  try {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) return JSON.parse(stored).userId;
  } catch { /* ignore */ }
  return "demo-user";
}

// ── Dashboard (authenticated) ──────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [weeklySpend, setWeeklySpend] = useState(0);
  const [categoriesUsed, setCategoriesUsed] = useState(0);
  const [insight, setInsight] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<{ status: string; trialEnd: string | null } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const userId = getUserId();

        const [txnData, insightData, subStatus] = await Promise.all([
          fetchTransactions({ userId }),
          fetchInsights({ userId }),
          getSubscriptionStatus({ userId }),
        ]);

        setTrialInfo(subStatus);

        const txns = txnData.transactions || [];
        const total = txns.reduce((s: number, t: any) => s + parseFloat(t.amount || "0"), 0);
        setBalance(total);

        const thisWeek = txns.filter((t: any) => parseFloat(t.amount) < 0);
        setWeeklySpend(Math.abs(thisWeek.reduce((s: number, t: any) => s + parseFloat(t.amount), 0)));

        const cats = new Set(txns.map((t: any) => t.category));
        setCategoriesUsed(cats.size);

        if (insightData.insights && insightData.insights.length > 0) {
          const latest = insightData.insights[0];
          setInsight(latest.insight_text);
          setAction(latest.action_text);
        } else if (txns.length > 0) {
          const gen = await generateInsight({ userId });
          setInsight(gen.insight.insightText);
          setAction(gen.insight.actionText);
        }
      } catch (e) {
        console.error("Home load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WeekWise</h1>
          <p className="text-sm text-gray-500">Your money, explained in one minute</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
          WW
        </div>
      </div>

      {/* Trial banner */}
      {trialInfo && trialInfo.status === "trialing" && trialInfo.trialEnd && (
        <div className="card mb-4 border-l-4 border-l-amber-400 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700">Free trial</p>
              <p className="text-sm text-amber-600">Expires {new Date(trialInfo.trialEnd).toLocaleDateString()}</p>
            </div>
            <Link to="/pricing" className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
              Subscribe
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="mt-2 h-8 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Cash Snapshot */}
          <div className="card mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Current Balance
            </p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              ${balance.toFixed(2)}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="chip bg-green-100 text-green-700">
                ↓ ${weeklySpend.toFixed(2)}
              </span>
              <span className="text-gray-400">spent this week</span>
            </div>
          </div>

          {/* Weekly Insight — LLM Powered */}
          {insight && (
            <div className="card mb-4 border-l-4 border-l-indigo-500">
              <div className="flex items-start gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    AI Insight
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-gray-800">{insight}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Action */}
          {action && (
            <div className="card mb-6 border-l-4 border-l-amber-500">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">💡</span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Recommended Action
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{action}</p>
                </div>
              </div>
            </div>
          )}

          {!insight && (
            <div className="card mb-4 border-l-4 border-l-indigo-500">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                This Week's Insight
              </p>
              <p className="mt-1.5 text-base font-semibold text-gray-800">
                Add some transactions to see AI-powered insights
              </p>
              <Link
                to="/transactions"
                className="mt-3 inline-block rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-200"
              >
                View transactions →
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-xs text-gray-400">Spending this week</p>
              <p className="mt-1 text-lg font-bold">${weeklySpend.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-400">Categories used</p>
              <p className="mt-1 text-lg font-bold">{categoriesUsed}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────

function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("weekwise_auth");
    setIsAuthenticated(!!stored);
  }, []);

  if (!isAuthenticated) {
    return <MarketingPage navigate={navigate} />;
  }

  return <Dashboard />;
}