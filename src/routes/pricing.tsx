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

  useEffect(() => {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) {
      try { setAuth(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  function handleChoose(planType: "monthly" | "annual") {
    if (!auth) {
      navigate({ to: "/auth", search: { redirect: "/pricing" } });
      return;
    }
    // Open Stripe checkout in a new tab so the user doesn't lose their session
    const link = planType === "annual"
      ? "https://buy.stripe.com/fZubJ1g6l9j418xbH09MY01"
      : "https://buy.stripe.com/6oU9ATdYdbrc8AZ9yS9MY00";
    window.open(link, "_blank", "noopener");
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
            className="btn-primary w-full"
          >
            {auth ? "Subscribe Monthly" : "Start Free Trial"}
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
            className="btn-primary w-full"
          >
            {auth ? "Subscribe Annual" : "Start Free Trial"}
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