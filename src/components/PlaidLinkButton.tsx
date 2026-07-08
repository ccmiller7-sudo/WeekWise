// Plaid Link button using react-plaid-link package
// Wraps the Plaid Link widget for connecting bank accounts.

import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function PlaidLinkButton({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: (publicToken: string, metadata: any) => void;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch link token on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      setLoading(true);
      setError(null);
      try {
        const { createLinkToken } = await import("~/lib/server-fns");
        const result = await createLinkToken({ userId });
        if (cancelled) return;
        if (result.linkToken) {
          setLinkToken(result.linkToken);
        } else {
          setError(result.error || "Could not initialize bank linking");
        }
      } catch {
        if (!cancelled) setError("Could not initialize bank linking");
      }
      if (!cancelled) setLoading(false);
    }
    fetchToken();
    return () => { cancelled = true; };
  }, [userId]);

  const onPlaidSuccess = useCallback(
    (publicToken: string, metadata: any) => {
      onSuccess(publicToken, metadata);
    },
    [onSuccess]
  );

  const config = linkToken
    ? { token: linkToken, onSuccess: onPlaidSuccess }
    : null;

  const { open, ready } = usePlaidLink(config || { token: null as any, onSuccess: () => {} });

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm">
        <p className="font-medium text-amber-700">Bank linking coming soon</p>
        <p className="mt-1 text-amber-600">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={() => open()}
        disabled={loading || !ready}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect a Bank Account"}
      </button>
    </div>
  );
}