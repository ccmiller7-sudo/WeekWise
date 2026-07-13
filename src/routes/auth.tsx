import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login, signup } from "~/lib/server-fns";

// Inline AuthChecker component (avoids import from hooks file that doesn't exist yet)
function AuthChecker({ children }: { children: (auth: { userId: string; email: string } | null) => React.ReactNode }) {
  const [auth, setAuth] = useState<{ userId: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) {
      try {
        setAuth(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  if (loading) return null;
  return <>{children(auth)}</>;
}

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" }) as { redirect?: string };
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) {
      navigate({ to: search.redirect || "/" });
    }
  }, [navigate, search.redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signup({ email, password });
        if (!result.success) {
          setError(result.error || "Signup failed");
          setLoading(false);
          return;
        }
        localStorage.setItem("weekwise_auth", JSON.stringify({ userId: result.userId, email: result.email }));
      } else {
        const result = await login({ email, password });
        if (!result.success) {
          setError(result.error || "Login failed");
          setLoading(false);
          return;
        }
        localStorage.setItem("weekwise_auth", JSON.stringify({ userId: result.userId, email: result.email }));
      }
      navigate({ to: search.redirect || "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-600">WeekWise Finance</h1>
        <p className="mt-1 text-sm text-gray-500">Your money, explained in one minute</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-gray-200 p-1">
        <button
          onClick={() => { setMode("login"); setError(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode("signup"); setError(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signup" ? "Create Account — Free 14-Day Trial" : "Sign In"}
        </button>
      </form>

      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Free 14-day trial. No credit card required. Cancel anytime.
        </p>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        {mode === "login" ? (
          <>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); }} className="font-medium text-indigo-600 underline">Sign up</button></>
        ) : (
          <>Already have an account? <button onClick={() => { setMode("login"); setError(""); }} className="font-medium text-indigo-600 underline">Sign in</button></>
        )}
      </p>
    </div>
  );
}