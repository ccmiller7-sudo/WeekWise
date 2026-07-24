import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/debug-db")({
  GET: async () => {
    const { initSchema, getAuthByEmail } = await import("~/lib/db");
    await initSchema();
    const crypto = await import("node:crypto");
    const auth = await getAuthByEmail("demo@weekwise.app");
    const hash = crypto.createHash("sha256").update("Demo123456").digest("hex");
    return new Response(JSON.stringify({
      demoAuthExists: !!auth,
      demoAuthHash: auth?.password_hash || "none",
      expectedHash: hash,
      hashMatches: auth?.password_hash === hash,
    }), { headers: { "Content-Type": "application/json" } });
  },
});
