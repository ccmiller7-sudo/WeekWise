import { createServerFn } from "@tanstack/react-start";

// ── Resend Email Client ──────────────────────────────────────────────────────

// ── Send via Resend API (direct HTTP, avoids npm import issues) ──────────────

async function sendViaResend(params: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL LOG] To: ${params.to.join(", ")} | Subject: ${params.subject} | HTML length: ${params.html.length}`);
    return { success: true, id: "logged" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, id: data.id };
    } else {
      console.error("Resend API error:", data);
      return { success: false, error: data.message || "Unknown error" };
    }
  } catch (err) {
    console.error("Resend send failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────

const BRAND_NAME = "WeekWise Finance";
const BRAND_COLOR = "#4f46e5";
const BASE_URL = process.env.PUBLIC_SITE_URL || "https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app";

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="text-align:center;padding-bottom:24px;">
        <h1 style="color:${BRAND_COLOR};font-size:24px;margin:0;">${BRAND_NAME}</h1>
        <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">Your money, explained in one minute a week</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        ${body}
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding-top:24px;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          ${BRAND_NAME} &mdash; Take control of your finances<br/>
          <a href="${BASE_URL}" style="color:${BRAND_COLOR};text-decoration:underline;">${BASE_URL}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Welcome Email ────────────────────────────────────────────────────────────

export function welcomeEmailHtml(userName: string): string {
  return wrapHtml(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Welcome to ${BRAND_NAME}! 👋</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Hi${userName ? " " + userName : ""}, thanks for signing up!
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Here's how to get started in <strong>one minute</strong>:
    </p>
    <ol style="color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
      <li><strong>Connect your bank</strong> or import a CSV — we'll auto-sort everything</li>
      <li><strong>Check your first weekly insight</strong> — we'll show you where your money went</li>
      <li><strong>Follow one recommended action</strong> — small changes add up</li>
    </ol>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
      You're on a <strong>14-day free trial</strong>. No commitment, cancel anytime.
    </p>
    <table role="presentation" style="width:100%;margin:24px 0;">
      <tr>
        <td style="text-align:center;">
          <a href="${BASE_URL}/onboarding"
             style="background:${BRAND_COLOR};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
            Complete Your Setup →
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
      Questions? Reply to this email or use the Coach tab in the app.
    </p>
  `);
}

// ── Weekly Digest ────────────────────────────────────────────────────────────

export function weeklyDigestHtml(params: {
  userName: string;
  weekStart: string;
  totalSpend: number;
  topCategory: string;
  topCategoryAmount: number;
  changePercent: number;
  insightText: string;
  actionText: string;
}): string {
  const formattedSpend = Math.abs(params.totalSpend).toFixed(2);
  const formattedCatAmount = Math.abs(params.topCategoryAmount).toFixed(2);
  const changeStr = params.changePercent >= 0 ? `+${params.changePercent}%` : `${params.changePercent}%`;
  const changeColor = params.changePercent >= 0 ? "#ef4444" : "#10b981";

  return wrapHtml(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Your Weekly Digest 📊</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Week of <strong>${params.weekStart}</strong>
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Here's your spending snapshot, ${params.userName}:
    </p>

    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:12px;background:#f9fafb;border-radius:8px 0 0 8px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;color:#6b7280;font-size:13px;">Total Spent</p>
          <p style="margin:4px 0 0;color:#111827;font-size:22px;font-weight:700;">$${formattedSpend}</p>
        </td>
        <td style="padding:12px;background:#f9fafb;border-radius:0 8px 8px 0;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;color:#6b7280;font-size:13px;">Top Category</p>
          <p style="margin:4px 0 0;color:#111827;font-size:22px;font-weight:700;">${params.topCategory}</p>
          <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">$${formattedCatAmount} <span style="color:${changeColor};">(${changeStr})</span></p>
        </td>
      </tr>
    </table>

    <div style="background:#eef2ff;border-radius:8px;padding:16px;margin:0 0 16px;border-left:4px solid ${BRAND_COLOR};">
      <p style="margin:0 0 4px;color:${BRAND_COLOR};font-size:13px;font-weight:600;">💡 INSIGHT</p>
      <p style="margin:0;color:#111827;font-size:15px;line-height:1.5;">${params.insightText}</p>
    </div>

    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;border-left:4px solid #22c55e;">
      <p style="margin:0 0 4px;color:#16a34a;font-size:13px;font-weight:600;">🎯 RECOMMENDED ACTION</p>
      <p style="margin:0;color:#111827;font-size:15px;line-height:1.5;">${params.actionText}</p>
    </div>

    <table role="presentation" style="width:100%;margin:24px 0;">
      <tr>
        <td style="text-align:center;">
          <a href="${BASE_URL}"
             style="background:${BRAND_COLOR};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
            Open WeekWise Finance →
          </a>
        </td>
      </tr>
    </table>
  `);
}

// ── Trial Reminder ───────────────────────────────────────────────────────────

export function trialReminderHtml(params: {
  userName: string;
  daysLeft: number;
  planType: string;
  price: string;
}): string {
  const urgency = params.daysLeft <= 1 ? "last day" : `${params.daysLeft} days`;
  const subjectLine = params.daysLeft <= 3 ? "⏰ Final reminder" : "⏳ Trial ending soon";

  return wrapHtml(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">${subjectLine}</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Hi${params.userName ? " " + params.userName : ""},
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Your <strong>14-day free trial</strong> has <strong>${urgency}</strong> remaining.
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
      After your trial ends, your subscription will be <strong>${params.planType === "annual" ? "$79.99/yr" : "$7.99/mo"}</strong>.
      Keep your insights, transactions, and Coach access.
    </p>
    <table role="presentation" style="width:100%;margin:24px 0;">
      <tr>
        <td style="text-align:center;">
          <a href="${BASE_URL}/pricing"
             style="background:${BRAND_COLOR};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
            ${params.daysLeft <= 1 ? "Subscribe Now →" : "Review Your Plan →"}
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
      Cancel anytime before the trial ends — no charges, no questions.
    </p>
  `);
}

// ── Send Functions ───────────────────────────────────────────────────────────

const FROM_EMAIL = "WeekWise Finance <onboarding@weekwise.app>";

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendViaResend({
    from: FROM_EMAIL,
    to: [to],
    subject: "Welcome to WeekWise Finance! 👋",
    html: welcomeEmailHtml(userName),
  });
}

export async function sendWeeklyDigest(
  to: string,
  params: {
    userName: string;
    weekStart: string;
    totalSpend: number;
    topCategory: string;
    topCategoryAmount: number;
    changePercent: number;
    insightText: string;
    actionText: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendViaResend({
    from: FROM_EMAIL,
    to: [to],
    subject: `Your Weekly Digest — ${params.weekStart}`,
    html: weeklyDigestHtml(params),
  });
}

export async function sendTrialReminder(
  to: string,
  params: {
    userName: string;
    daysLeft: number;
    planType: string;
    price: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const subject = params.daysLeft <= 3
    ? "⏰ Final reminder: Your WeekWise Finance trial ends soon"
    : "⏳ Your WeekWise Finance trial is ending soon";

  return sendViaResend({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html: trialReminderHtml(params),
  });
}

// ── Server Functions (callable from client) ──────────────────────────────────

export const sendWelcomeEmailServerFn = createServerFn({ method: "POST" }).handler(
  async (data: { userId: string; email: string; userName: string }) => {
    return sendWelcomeEmail(data.email, data.userName);
  }
);

// ── Helper to get user email from auth table ─────────────────────────────────

export async function getUserEmail(userId: string): Promise<string | null> {
  const { execSync } = await import("child_process");
  try {
    const result = execSync(
      `team-db "SELECT email FROM weekwise_auth WHERE user_id = '${userId.replace(/'/g, "''")}'"`,
      { encoding: "utf-8", maxBuffer: 1024 * 1024 }
    );
    const rows = JSON.parse(result);
    return rows.length > 0 ? rows[0].email : null;
  } catch {
    return null;
  }
}