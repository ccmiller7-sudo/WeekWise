import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { fetchTransactions, addTransaction, updateTransactionCategory, importCSVTransactions, exchangePublicToken, syncPlaidTransactions, getLinkedAccounts } from "~/lib/server-fns";
import PlaidLinkButton from "~/components/PlaidLinkButton";

export const Route = createFileRoute("/transactions")({
  component: Transactions,
});

const CAT_MAP: Record<string, string> = {
  "cat-food": "Food & Dining",
  "cat-transport": "Transportation",
  "cat-entertainment": "Entertainment",
  "cat-shopping": "Shopping",
  "cat-housing": "Housing",
  "cat-utils": "Utilities",
  "cat-health": "Health",
  "cat-income": "Income",
  "cat-other": "Other",
};

const CATEGORY_OPTIONS = Object.entries(CAT_MAP).map(([id, name]) => ({ id, name }));

function getUserId(): string {
  try {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) return JSON.parse(stored).userId;
  } catch { /* ignore */ }
  return "demo-user";
}

function Transactions() {
  const [filter, setFilter] = useState("All");
  const [showSubs, setShowSubs] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  // Manual entry form state
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // CSV state
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  // Plaid state
  const [showPlaid, setShowPlaid] = useState(false);
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState("");

  // Category correction state
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctingCategory, setCorrectingCategory] = useState("");

  const loadTransactions = async () => {
    try {
      const data = await fetchTransactions({ userId: getUserId() });
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error("Failed to load transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // Load linked Plaid accounts
    getLinkedAccounts({ userId: getUserId() }).then((r: any) => {
      setLinkedItems(r.items || []);
    }).catch(() => {});
  }, []);

  const filtered = transactions.filter((t: any) => {
    const catName = CAT_MAP[t.category] || t.category || "Other";
    if (showSubs && !t.is_subscription) return false;
    if (filter !== "All" && catName !== filter) return false;
    return true;
  });

  const subscriptions = transactions.filter((t: any) => t.is_subscription);

  const getCatLabel = (catId: string) => CAT_MAP[catId] || catId || "Other";

  // ── Manual Entry ────────────────────────────────────────────────────────

  const handleManualSubmit = async () => {
    if (!manualDesc.trim() || !manualAmount.trim()) return;
    setSubmitting(true);
    try {
      await addTransaction({
        userId: getUserId(),
        description: manualDesc.trim(),
        amount: -Math.abs(parseFloat(manualAmount)),
        category: manualCategory || undefined,
      });
      setManualDesc("");
      setManualAmount("");
      setManualCategory("");
      setManualDate(new Date().toISOString().split("T")[0]);
      setShowManual(false);
      await loadTransactions();
    } catch (e) {
      console.error("Failed to add transaction:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Category Correction ─────────────────────────────────────────────────

  const handleCategoryCorrection = async (id: string, category: string) => {
    try {
      await updateTransactionCategory({ id, category });
      setCorrectingId(null);
      await loadTransactions();
    } catch (e) {
      console.error("Failed to update category:", e);
    }
  };

  // ── CSV Import ──────────────────────────────────────────────────────────

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const descIdx = headers.findIndex((h) => /description|desc|memo|merchant|payee|name/i.test(h));
    const amtIdx = headers.findIndex((h) => /amount|amt|value|sum|total|\$/i.test(h));
    const dateIdx = headers.findIndex((h) => /date|day|time|posted|trans/i.test(h));

    if (descIdx === -1 || amtIdx === -1) {
      setImportMsg("CSV needs at least 'description' and 'amount' columns");
      return [];
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        description: cols[descIdx] || "Unknown",
        amount: parseFloat(cols[amtIdx]) || 0,
        date: dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split("T")[0],
      };
    }).filter((r) => r.description !== "Unknown" || r.amount !== 0);
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length > 0) {
        setCsvPreview(rows.slice(0, 20)); // Show first 20
      }
    };
    reader.readAsText(file);
  };

  const handleCSVImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setImporting(true);
    setImportMsg("");
    try {
      const result = await importCSVTransactions({
        userId: getUserId(),
        transactions: csvPreview,
      });
      setImportMsg(`✅ Imported ${result.imported} transactions`);
      setCsvPreview(null);
      setShowCSV(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
      await loadTransactions();
    } catch (e) {
      console.error("CSV import error:", e);
      setImportMsg("❌ Import failed — check your CSV format");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-20">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500">Your spending, auto-categorized</p>
        </div>
        {/* Add buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowManual(!showManual); setShowCSV(false); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              showManual ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            + Add
          </button>
          <button
            onClick={() => { setShowCSV(!showCSV); setShowManual(false); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              showCSV ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            CSV
          </button>
        </div>
      </div>

      {/* ── Manual Entry Form ─────────────────────────────────────────── */}
      {showManual && (
        <div className="card mb-4 animate-fadeIn">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Transaction</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              placeholder="Description (e.g., Uber ride)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-400"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Amount"
                className="w-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-400"
              />
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Auto-categorize</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={submitting || !manualDesc.trim() || !manualAmount.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </div>
      )}

      {/* ── CSV Import ────────────────────────────────────────────────── */}
      {showCSV && (
        <div className="card mb-4 animate-fadeIn">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Import CSV</h3>
          <p className="mb-2 text-xs text-gray-400">
            CSV needs at least <strong>description</strong> and <strong>amount</strong> columns. Date is optional.
          </p>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVFile}
            className="mb-3 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />

          {csvPreview && csvPreview.length > 0 && (
            <div className="mt-2">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Preview ({csvPreview.length} rows):
              </p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
                {csvPreview.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="truncate flex-1">{row.description}</span>
                    <span className="ml-2 font-medium tabular-nums">${Math.abs(row.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCSVImport}
                  disabled={importing}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {importing ? "Importing..." : `Import ${csvPreview.length} transactions`}
                </button>
                <button
                  onClick={() => { setCsvPreview(null); setImportMsg(""); if (csvInputRef.current) csvInputRef.current.value = ""; }}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {importMsg && (
            <p className="mt-2 text-sm font-medium">{importMsg}</p>
          )}
        </div>
      )}

      {/* ── Bank Linking ───────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Bank Accounts</p>
          <button
            onClick={() => setShowPlaid(!showPlaid)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              showPlaid ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showPlaid ? "Cancel" : (linkedItems.length > 0 ? "+ Add Bank" : "Connect Bank")}
          </button>
        </div>

        {showPlaid && (
          <div className="mt-3">
            <PlaidLinkButton
              userId={getUserId()}
              onSuccess={async (publicToken, metadata) => {
                const result = await exchangePublicToken({ userId: getUserId(), publicToken });
                if (result.success) {
                  setSyncMsg("✅ Bank linked! Syncing transactions...");
                  setShowPlaid(false);
                  // Refresh linked accounts
                  const r = await getLinkedAccounts({ userId: getUserId() });
                  setLinkedItems(r.items || []);
                  await loadTransactions();
                }
              }}
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              Securely connect your bank to auto-sync transactions
            </p>
          </div>
        )}

        {/* Linked accounts list */}
        {linkedItems.length > 0 && (
          <div className="mt-3 space-y-2">
            {linkedItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.bank_name || "Bank Account"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.last_sync_at
                      ? `Last synced: ${new Date(item.last_sync_at).toLocaleDateString()}`
                      : "Not yet synced"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setSyncingId(item.id);
                    setSyncMsg("");
                    const result = await syncPlaidTransactions({ userId: getUserId(), plaidItemId: item.id });
                    setSyncingId(null);
                    if (result.success) {
                      setSyncMsg(`✅ Synced ${result.synced} new transactions`);
                      await loadTransactions();
                    } else {
                      setSyncMsg(`⚠️ ${result.error}`);
                    }
                  }}
                  disabled={syncingId === item.id}
                  className="shrink-0 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
                >
                  {syncingId === item.id ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            ))}
          </div>
        )}

        {syncMsg && (
          <p className="mt-2 text-center text-xs font-medium text-gray-600">{syncMsg}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="mt-1 h-3 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Subscriptions banner */}
          {subscriptions.length > 0 && (
            <button
              onClick={() => setShowSubs(!showSubs)}
              className="card mb-4 flex w-full items-center gap-3 border-l-4 border-l-rose-500 text-left"
            >
              <span className="text-lg">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{subscriptions.length} active subscription{subscriptions.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-gray-400">{subscriptions.map((s: any) => s.description).join(", ")}</p>
              </div>
              <span className="text-xs text-gray-400">{showSubs ? "▲" : "▼"}</span>
            </button>
          )}

          {/* Category filter chips */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["All", ...CATEGORY_OPTIONS.map((c) => c.name)].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          <div className="space-y-2">
            {filtered.map((txn: any) => (
              <div key={txn.id} className="card">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    txn.amount >= 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {txn.amount >= 0 ? "↓" : "↑"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{txn.description}</p>
                    <div className="flex items-center gap-2">
                      {/* Category with one-tap correction */}
                      {correctingId === txn.id ? (
                        <select
                          value={correctingCategory}
                          onChange={(e) => {
                            setCorrectingCategory(e.target.value);
                            handleCategoryCorrection(txn.id, e.target.value);
                          }}
                          autoFocus
                          className="rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs outline-none"
                          onBlur={() => setCorrectingId(null)}
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => {
                            setCorrectingId(txn.id);
                            setCorrectingCategory(txn.category || "cat-other");
                          }}
                          className="text-xs text-indigo-500 underline underline-offset-2 hover:text-indigo-700"
                          title="Tap to recategorize"
                        >
                          {getCatLabel(txn.category)}
                        </button>
                      )}
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{txn.date}</span>
                      {txn.is_subscription ? (
                        <span className="chip bg-rose-100 text-rose-700 text-[10px]">Sub</span>
                      ) : txn.is_recurring ? (
                        <span className="chip bg-blue-100 text-blue-700 text-[10px]">↻</span>
                      ) : null}
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${
                    txn.amount >= 0 ? "text-green-600" : "text-gray-800"
                  }`}>
                    {txn.amount >= 0 ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {showSubs ? "No subscriptions found" : "No transactions match this filter"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
