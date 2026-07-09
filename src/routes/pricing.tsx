import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const FEATURES = [
  "Auto-sorted spending categories",
  "Weekly AI-powered insights",
  "Actionable recommendations",
  "Financial coach chatbot",
  "Unlimited transactions",
  "CSV import support",
  "Email support",
];

function PricingPage() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<{ userId: string; email: string } | null>(null);
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) {
      try { setAuth(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  async function handleChoose(planType: "monthly" | "annual") {
    if (!auth) {
      navigate({ to: "/auth", search: { redirect: "/pricing" } });
      return;
    }
    setLoading(planType);
    try {
      // Dynamic import to avoid client-side bundling issues
      const { createCheckoutSession } = await import("~/lib/server-fns");
      const result = await createCheckoutSession({ userId: auth.userId, planType });
      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        console.error("Checkout error:", result.error);
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Simple Pricing</h1>
        <p className="mt-1 text-sm text-gray-500">14-day free trial, then pick your plan</p>
      </div>

      <div className="grid gap-4">
        {/* Monthly Plan */}
        <div className="card relative border-2 border-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Monthly</h2>
            <p className="mt-1">
              <span className="text-3xl font-bold">$7.99</span>
              <span className="text-sm text-gray-400">/month</span>
            </p>
          </div>
          <ul className="mb-6 space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-indigo-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleChoose("monthly")}
            disabled={loading === "monthly"}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading === "monthly" ? "Redirecting..." : auth ? "Subscribe Monthly" : "Start Free Trial"}
          </button>
        </div>

        {/* Annual Plan */}
        <div className="card relative border-2 border-indigo-500">
          <div className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white">
            Save 16%
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Annual</h2>
            <p className="mt-1">
              <span className="text-3xl font-bold">$79.99</span>
              <span className="text-sm text-gray-400">/year</span>
            </p>
            <p className="mt-0.5 text-xs text-indigo-600">$6.67/month — best value</p>
          </div>
          <ul className="mb-6 space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-indigo-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleChoose("annual")}
            disabled={loading === "annual"}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading === "annual" ? "Redirecting..." : auth ? "Subscribe Annual" : "Start Free Trial"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
        <p>All plans include a 14-day free trial. No credit card required to start.</p>
        <p className="mt-1">Cancel anytime before the trial ends — you won't be charged.</p>
      </div>
    </div>
  );
}