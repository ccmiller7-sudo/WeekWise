import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { askCoach } from "~/lib/server-fns";

export const Route = createFileRoute("/coach")({
  component: Coach,
});

const SUGGESTIONS = [
  "How much did I spend eating out this month?",
  "What can I cut this month?",
  "Am I overspending on subscriptions?",
  "What's my biggest expense?",
];

function getUserId(): string {
  try {
    const stored = localStorage.getItem("weekwise_auth");
    if (stored) return JSON.parse(stored).userId;
  } catch { /* ignore */ }
  return "demo-user";
}

function Coach() {
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "coach"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (question?: string) => {
    const q = (question || query).trim();
    if (!q || loading) return;

    setChat((prev) => [...prev, { role: "user", text: q }]);
    setQuery("");
    setLoading(true);

    try {
      const result = await askCoach({ question: q, userId: getUserId() });
      setChat((prev) => [...prev, { role: "coach", text: result.answer }]);
    } catch (e) {
      setChat((prev) => [
        ...prev,
        { role: "coach", text: "Sorry, I'm having trouble right now. Please try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Coach</h1>
      <p className="mb-4 text-sm text-gray-500">Ask about your money in plain English</p>

      {/* Chat area */}
      <div className="mb-4 max-h-[60dvh] space-y-3 overflow-y-auto">
        {chat.length === 0 && (
          <div className="py-6 text-center">
            <span className="mb-3 inline-block text-4xl">🎯</span>
            <p className="text-sm text-gray-500">AI-powered answers based on your actual spending:</p>
            <div className="mt-4 space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(s)}
                  className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-xs text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}>
              {msg.role === "coach" && loading && i === chat.length - 1 ? "Thinking..." : msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask about your spending..."
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-400 disabled:opacity-50"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}