import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { submitOnboarding, getSubscriptionStatus, activateSubscription, createPortalSession, exchangePublicToken, getLinkedAccounts } from "~/lib/server-fns";
import PlaidLinkButton from "~/components/PlaidLinkButton";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Step = "welcome" | "goal" | "pain" | "sync" | "done";

function getUserId(): string {
  try {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) return JSON.parse(stored).userId;
  } catch { /* ignore */ }
  return "demo-user";
}

function getEmail(): string {
  try {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) return JSON.parse(stored).email;
  } catch { /* ignore */ }
  return "";
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [goal, setGoal] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [syncMethod, setSyncMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [subStatus, setSubStatus] = useState<{ status: string; plan_type: string; trial_end: string | null; current_period_end: string | null } | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState<string | null>(null);
  const [showPlaid, setShowPlaid] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const email = getEmail();
    setAuthEmail(email);
    if (email) {
      setShowSettings(true);
      getSubscriptionStatus({ userId: getUserId() }).then((sub: any) => {
        // Normalize field names (support both camelCase and snake_case)
        setSubStatus({
          status: sub.status,
          plan_type: sub.plan_type || sub.planType || "monthly",
          trial_end: sub.trial_end || sub.trialEnd || null,
          current_period_end: sub.current_period_end || sub.currentPeriodEnd || null,
        });
      }).catch(() => {});
      // Load linked accounts
      getLinkedAccounts({ userId: getUserId() }).then((result: any) => {
        setLinkedAccounts(result.accounts || []);
      }).catch(() => {});
    }
  }, []);

  const goals = ["Save more", "Stop overspending", "Build a budget", "Track investments", "Get out of debt"];
  const pains = ["I don't know where my money goes", "Budgeting feels like a chore", "I forget to track", "I want a simple overview", "I need accountability"];

  const handleFinish = async (method: string) => {
    setSyncMethod(method);
    setSubmitting(true);
    try {
      await submitOnboarding({ goal, painPoint, syncMethod: method });
      setStep("done");
    } catch (e) {
      console.error("Onboarding error:", e);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("weekwise_auth");
    navigate({ to: "/" });
  };

  // If authenticated, show settings panel
  if (showSettings) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mb-6 text-sm text-gray-500">Manage your account</p>

        {/* Profile */}
        <div className="card mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Account</p>
          <p className="mt-1.5 text-sm font-medium text-gray-800">{authEmail}</p>
          <p className="text-xs text-gray-400">Signed in</p>
        </div>

        {/* Subscription / Billing */}
        <div className="card mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Billing & Plan</p>
          {subStatus ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="text-sm font-medium capitalize text-gray-800">
                  {subStatus.plan_type === "annual" ? "Annual" : "Monthly"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium capitalize ${
                  subStatus.status === "active" ? "text-green-600" : subStatus.status === "trialing" ? "text-amber-600" : "text-red-600"
                }`}>
                  {subStatus.status === "active" ? "Active" : subStatus.status === "trialing" ? "Free Trial" : subStatus.status}
                </span>
              </div>
              {subStatus.status === "trialing" && subStatus.trial_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trial ends</span>
                  <span className="text-sm font-medium text-gray-800">{new Date(subStatus.trial_end).toLocaleDateString()}</span>
                </div>
              )}
              {subStatus.status === "active" && subStatus.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Renews</span>
                  <span className="text-sm font-medium text-gray-800">{new Date(subStatus.current_period_end).toLocaleDateString()}</span>
                </div>
              )}

              {/* Activation message */}
              {activateMsg && (
                <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                  {activateMsg}
                </div>
              )}

              <div className="mt-3 space-y-2">
                <Link to="/pricing" className="btn-primary block text-center text-sm">
                  {subStatus.status === "trialing" ? "Subscribe Now — $7.99/mo" : "Change Plan"}
                </Link>

                {/* "Verify & Activate" button — manual activation after Stripe checkout */}
                {subStatus.status === "trialing" && (
                  <button
                    onClick={async () => {
                      setActivating(true);
                      setActivateMsg(null);
                      const result = await activateSubscription({ userId: getUserId() });
                      setActivating(false);
                      if (result.success) {
                        setActivateMsg("✅ Subscription activated! Your account is now active.");
                        // Refresh subscription status
                        try {
                          const sub = await getSubscriptionStatus({ userId: getUserId() });
                          setSubStatus({
                            status: sub.status,
                            plan_type: sub.plan_type || sub.planType || "monthly",
                            trial_end: sub.trial_end || sub.trialEnd || null,
                            current_period_end: sub.current_period_end || sub.currentPeriodEnd || null,
                          });
                        } catch {}
                      } else {
                        setActivateMsg(`⚠️ ${result.error || "Activation failed. Please try again."}`);
                      }
                    }}
                    disabled={activating}
                    className="btn-outline w-full text-center text-sm disabled:opacity-50"
                  >
                    {activating ? "Activating..." : "Verify & Activate Subscription"}
                  </button>
                )}

                {/* Billing management — Portal session (if available) or support contact */}
                {subStatus.status === "active" && (
                  <button
                    onClick={async () => {
                      const result = await createPortalSession({ userId: getUserId() });
                      if (result.url) {
                        window.open(result.url, "_blank", "noopener");
                      } else {
                        alert("Billing portal unavailable. Contact support@weekwise.app for help.");
                      }
                    }}
                    className="btn-outline w-full text-center text-sm"
                  >
                    Manage Billing (update payment, cancel)
                  </button>
                )}

                <p className="text-center text-xs text-gray-400">
                  Questions?{" "}
                  <a href="mailto:support@weekwise.app" className="font-medium text-indigo-600 underline underline-offset-2">
                    support@weekwise.app
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-400">Loading subscription info...</p>
          )}
        </div>

        {/* Linked Accounts */}
        <div className="card mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Linked Accounts</p>
          {(() => {
            const accounts = linkedAccounts;
            if (accounts.length === 0) {
              return (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">No bank accounts linked yet.</p>
                  <button
                    onClick={async () => {
                      // Reload accounts after linking
                      const result = await getLinkedAccounts({ userId: getUserId() });
                      setLinkedAccounts(result.accounts || []);
                    }}
                    className="mt-2 text-sm font-medium text-indigo-600 underline underline-offset-2"
                  >
                    Check for linked accounts
                  </button>
                </div>
              );
            }
            return (
              <div className="mt-2 space-y-2">
                {accounts.map((acct: any) => (
                  <div key={acct.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {acct.institution_name || "Bank Account"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {acct.account_name || ""}{acct.account_mask ? ` (****${acct.account_mask})` : ""}
                        {acct.last_sync ? ` · Last sync: ${new Date(acct.last_sync).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Connected
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Onboarding Info */}
        <div className="card mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Preferences</p>
          <p className="mt-2 text-sm text-gray-500">
            Your onboarding preferences help us tailor insights. Update them anytime.
          </p>
          <Link to="/onboarding?setup=1" className="mt-2 inline-block text-sm font-medium text-indigo-600 underline underline-offset-2">
            Re-run onboarding →
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Sign Out
        </button>

        {/* Demo user warning */}
        {getUserId() === "demo-user" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-medium text-amber-700">Demo Mode</p>
            <p className="mt-1 text-xs text-amber-600">
              <Link to="/auth" className="underline underline-offset-1">Sign up</Link> to create your own account and save your data.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (step === "welcome") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 text-5xl">👋</span>
        <h1 className="mb-2 text-2xl font-bold">Welcome to WeekWise</h1>
        <p className="mb-8 text-gray-500">
          Your money, explained in one minute a week. Let's set you up.
        </p>
        <button onClick={() => setStep("goal")} className="btn-primary max-w-xs">
          Get started
        </button>
      </div>
    );
  }

  if (step === "goal") {
    return (
      <div className="mx-auto max-w-lg px-4 pt-12">
        <Progress current={1} total={3} />
        <h2 className="mb-2 mt-6 text-xl font-bold">What's your top money goal?</h2>
        <p className="mb-6 text-sm text-gray-500">Choose one to focus on.</p>
        {goals.map((g) => (
          <button
            key={g}
            onClick={() => { setGoal(g); setStep("pain"); }}
            className={`mb-2 w-full rounded-xl border p-4 text-left text-sm font-medium transition-all ${
              goal === g ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    );
  }

  if (step === "pain") {
    return (
      <div className="mx-auto max-w-lg px-4 pt-12">
        <Progress current={2} total={3} />
        <h2 className="mb-2 mt-6 text-xl font-bold">What's your biggest pain point?</h2>
        <p className="mb-6 text-sm text-gray-500">We'll tailor insights to help.</p>
        {pains.map((p) => (
          <button
            key={p}
            onClick={() => { setPainPoint(p); setStep("sync"); }}
            className={`mb-2 w-full rounded-xl border p-4 text-left text-sm font-medium transition-all ${
              painPoint === p ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    );
  }

  if (step === "sync") {
    if (showPlaid) {
      return (
        <div className="mx-auto max-w-lg px-4 pt-12">
          <Progress current={3} total={3} />
          <h2 className="mb-2 mt-6 text-xl font-bold">Connect your bank</h2>
          <p className="mb-6 text-sm text-gray-500">Securely link your account to auto-sync transactions.</p>
          <PlaidLinkButton
            userId={getUserId()}
            onSuccess={async (publicToken, metadata) => {
              await exchangePublicToken({
                userId: getUserId(),
                publicToken,
                institutionName: metadata.institution?.name,
                accountName: metadata.accounts?.[0]?.name,
                accountMask: metadata.accounts?.[0]?.mask,
                accountType: metadata.accounts?.[0]?.type,
              });
              await handleFinish("bank");
            }}
          />
          <button
            onClick={() => { setShowPlaid(false); handleFinish("manual"); }}
            className="mt-3 text-center text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >
            Skip — I'll add transactions manually
          </button>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg px-4 pt-12">
        <Progress current={3} total={3} />
        <h2 className="mb-2 mt-6 text-xl font-bold">Link your accounts?</h2>
        <p className="mb-6 text-sm text-gray-500">We'll auto-sort your spending. Start whenever you're ready.</p>
        <button
          onClick={() => setShowPlaid(true)}
          disabled={submitting}
          className="btn-primary mb-3 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Connect a bank account"}
        </button>
        <button
          onClick={() => handleFinish("csv")}
          disabled={submitting}
          className="btn-outline mb-3 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Import from CSV"}
        </button>
        <button
          onClick={() => handleFinish("manual")}
          disabled={submitting}
          className="text-center text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Skip for now — enter manually"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 text-5xl">🎉</span>
      <h1 className="mb-2 text-2xl font-bold">You're all set!</h1>
      <p className="mb-2 text-gray-500">
        {goal && `Goal: ${goal}`}{painPoint && ` · ${painPoint}`}
      </p>
      <p className="mb-8 text-sm text-gray-400">
        {syncMethod === "bank" ? "Bank sync ready" : syncMethod === "csv" ? "CSV import selected" : "Manual entry mode"}
      </p>
      <a href="/" className="btn-primary max-w-xs text-center">
        Go to Dashboard
      </a>
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? "bg-indigo-500" : "bg-gray-200"
          }`}
        />
      ))}
      <span className="text-xs text-gray-400">{current}/{total}</span>
    </div>
  );
}