import { Link } from "@tanstack/react-router";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export default function MarketingPage({ navigate }: { navigate: (opts: { to: string }) => void }) {
  return (
    <div className="bg-white">
      {/* ── Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold tracking-tight text-indigo-600">WeekWise</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <button onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
              How it works
            </button>
            <button onClick={() => scrollTo("features")} className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
              Features
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
              Pricing
            </button>
            <button onClick={() => navigate({ to: "/auth" })} className="btn-primary max-w-[140px]">
              Start Free Trial
            </button>
          </nav>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 sm:hidden"
          >
            Free Trial
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pb-16 pt-12 sm:pb-24 sm:pt-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-indigo-700">14-day free trial — no credit card needed</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Your money, explained in{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                one minute
              </span>{" "}
              a week
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-500 sm:text-xl">
              WeekWise auto-sorts your spending, surfaces one weekly insight,
              and recommends one action. <strong className="text-gray-700">No dashboards. No busywork.</strong>
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="btn-primary max-w-[280px] sm:w-auto"
              >
                Start Your Free Trial
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="btn-outline max-w-[280px] sm:w-auto"
              >
                See How It Works ↓
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Free 14-day trial · Cancel anytime · No credit card required
            </p>
          </div>

          {/* ── Hero Mockup ── */}
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl shadow-indigo-100/50">
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">WeekWise — Dashboard</span>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Current Balance</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">$3,847.23</p>
                </div>
                <span className="chip bg-green-100 text-green-700">↓ $523.40 this week</span>
              </div>
              <div className="mb-4 rounded-xl border-l-4 border-l-indigo-500 bg-indigo-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">AI Insight</p>
                <p className="mt-1 text-base font-semibold text-gray-800">
                  Dining out is up 24% this week — $187 vs $151 last week
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-gray-500">Recommended Action</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    Try cooking at home 2 extra nights this week to save ~$60
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="scroll-mt-16 bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get clarity in 3 simple steps
            </h2>
            <p className="mt-3 text-gray-500">
              From zero to knowing where your money went — in about a minute.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: "🔗",
                title: "Connect or Import",
                desc: "Link your bank via Plaid (one tap) or upload a CSV from any bank. Manual entry works too."
              },
              {
                step: "02",
                icon: "🤖",
                title: "AI Sorts Everything",
                desc: "Every transaction is auto-categorized. Dining, groceries, bills, subscriptions — no tagging required."
              },
              {
                step: "03",
                icon: "💡",
                title: "One Weekly Insight",
                desc: "Every Monday: one clear takeaway about your spending and one thing you can do about it."
              }
            ].map((item) => (
              <div key={item.step} className="card group relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-indigo-50" />
                <span className="text-4xl">{item.icon}</span>
                <p className="mt-1 text-xs font-semibold text-indigo-600">{item.step}</p>
                <p className="mt-2 text-lg font-bold text-gray-800">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-16 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to{" "}
              <span className="text-indigo-600">stay on top</span> of your money
            </h2>
            <p className="mt-3 text-gray-500">
              Built for busy professionals who want control without complexity.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🧠", title: "Weekly AI Insights", desc: "One plain-English insight about your spending patterns every week." },
              { icon: "🎯", title: "Recommended Actions", desc: "A specific, actionable step to improve your finances — no generic advice." },
              { icon: "💬", title: "Financial Coach", desc: "Ask 'How much did I spend eating out?' or 'What can I cut?' in plain English." },
              { icon: "🏷️", title: "Auto-categorization", desc: "9 spending categories, LLM-powered. Fix a miscategorized item in one tap." },
              { icon: "🔁", title: "Subscription Detection", desc: "See every recurring charge you're paying for — autopilot expenses exposed." },
              { icon: "📥", title: "CSV Import", desc: "Upload exports from any bank or credit card. Preview before importing." },
              { icon: "🔗", title: "Bank Sync (Plaid)", desc: "Connect your bank securely. Transactions pull in automatically." },
              { icon: "✏️", title: "Manual Entry", desc: "Add a transaction on the go. Great for cash or Venmo." },
              { icon: "🔒", title: "Your Data Stays Private", desc: "No ads. No data selling. You control what you share." },
            ].map((feat) => (
              <div key={feat.title} className="card transition-shadow hover:shadow-md">
                <span className="text-2xl">{feat.icon}</span>
                <p className="mt-3 text-sm font-bold text-gray-800">{feat.title}</p>
                <p className="mt-1 text-sm text-gray-500">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Testimonials ── */}
      <section className="bg-indigo-600 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What early users are saying
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "I finally understand where my money goes. The weekly insight is like having a financial coach in my pocket.",
                author: "Alex M.",
                role: "Product Manager"
              },
              {
                quote: "Spent 10 minutes setting it up. Now I get one clear takeaway every Monday. That's all I needed.",
                author: "Jordan T.",
                role: "Software Engineer"
              },
              {
                quote: "The Coach feature caught a subscription I forgot about. Saved $15/mo instantly.",
                author: "Sam K.",
                role: "Freelance Designer"
              }
            ].map((t) => (
              <div key={t.author} className="rounded-2xl bg-white/10 p-6 text-left backdrop-blur-sm">
                <p className="text-lg font-medium leading-relaxed text-white">"{t.quote}"</p>
                <div className="mt-4 border-t border-white/20 pt-4">
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-indigo-200">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="scroll-mt-16 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-500">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            {/* Monthly */}
            <div className="card flex flex-col justify-between transition-shadow hover:shadow-md">
              <div>
                <p className="text-lg font-bold text-gray-800">Monthly</p>
                <p className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">$7.99</span>
                  <span className="ml-1 text-sm text-gray-400">/month</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">Billed monthly</p>
                <ul className="mt-6 space-y-3">
                  {["Auto-categorized transactions", "Weekly AI insights + actions", "Financial Coach Q&A", "Unlimited transactions"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="btn-outline mt-6"
              >
                Start Free Trial
              </button>
            </div>

            {/* Annual (Best Value) */}
            <div className="card relative flex flex-col justify-between border-2 border-indigo-500 transition-shadow hover:shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-block rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Best Value
                </span>
              </div>
              <div className="pt-2">
                <p className="text-lg font-bold text-gray-800">Annual</p>
                <p className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">$79.99</span>
                  <span className="ml-1 text-sm text-gray-400">/year</span>
                </p>
                <p className="mt-1 text-xs text-indigo-600">$6.67/month — save 16%</p>
                <ul className="mt-6 space-y-3">
                  {["Everything in Monthly", "2 months free", "Priority support", "Early access to new features"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="btn-primary mt-6"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {[
              { q: "Do I need a credit card to start?", a: "Nope. Start your 14-day free trial with just an email and password. No card required." },
              { q: "How does the AI categorization work?", a: "Our AI analyzes transaction descriptions and amounts to sort them into 9 categories. If something's wrong, you can correct it in one tap and the AI learns." },
              { q: "Is my bank data safe?", a: "Absolutely. We use Plaid (the same service used by Venmo, Coinbase, and betterment) for bank linking. Your credentials never touch our servers. We never sell your data." },
              { q: "Can I import data without linking my bank?", a: "Yes! You can upload a CSV export from any bank or credit card, or add transactions manually. No Plaid required." },
              { q: "What happens after my free trial?", a: "You'll be prompted to choose a plan. If you don't subscribe, your data is kept for 30 days in case you decide to come back." },
              { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings with one click. Your access continues until the end of the billing period." },
            ].map((faq) => (
              <details key={faq.q} className="card group transition-shadow hover:shadow-md">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-800">
                  {faq.q}
                  <span className="ml-2 text-lg text-gray-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 py-16 sm:py-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start your free trial today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lg text-indigo-200">
            Join thousands of busy professionals who finally understand their money.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 active:scale-[0.98]"
            >
              Get Started Free
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Learn More
            </button>
          </div>
          <p className="mt-4 text-xs text-indigo-300">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <span className="text-sm font-bold text-indigo-600">WeekWise</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <button onClick={() => scrollTo("how-it-works")} className="hover:text-indigo-600">How it works</button>
              <button onClick={() => scrollTo("features")} className="hover:text-indigo-600">Features</button>
              <button onClick={() => scrollTo("pricing")} className="hover:text-indigo-600">Pricing</button>
              <button onClick={() => scrollTo("faq")} className="hover:text-indigo-600">FAQ</button>
              <button onClick={() => navigate({ to: "/blog" })} className="hover:text-indigo-600">Blog</button>
              <button onClick={() => navigate({ to: "/auth" })} className="hover:text-indigo-600">Sign In</button>
            </nav>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            <p>WeekWise — Your money, explained in one minute a week.</p>
            <p className="mt-1">Built with ❤️ for busy professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}