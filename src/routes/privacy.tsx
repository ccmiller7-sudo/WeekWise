import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — WeekWise Finance" },
      { name: "description", content: "WeekWise Finance privacy policy. Learn how we collect, use, and protect your financial data." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <div className="mb-8">
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to WeekWise Finance
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: July 11, 2026</p>
      </div>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-gray-600">
            WeekWise Finance ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">2. Information We Collect</h2>
          <div className="mt-2 space-y-3 text-gray-600">
            <h3 className="font-semibold text-gray-800">Account Information</h3>
            <p>When you create an account, we collect your email address and a secured password. This is necessary for authentication and to manage your subscription.</p>

            <h3 className="font-semibold text-gray-800">Financial Data</h3>
            <p>If you link your bank or credit card accounts via Plaid, we receive transaction data including merchant names, amounts, dates, and categories. We also support CSV import with the same types of data. This data is used solely to provide your spending insights, transaction categorization, and financial coaching features.</p>

            <h3 className="font-semibold text-gray-800">Payment Information</h3>
            <p>All subscription payments are processed by Stripe. We do not store your credit card details on our servers. Stripe handles all payment data in accordance with their own privacy policy.</p>

            <h3 className="font-semibold text-gray-800">Usage Data</h3>
            <p>We collect basic usage information (feature usage, page views) to improve our service. This data is anonymized where possible.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">3. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
            <li>To categorize and analyze your transactions using AI</li>
            <li>To generate weekly spending insights and recommendations</li>
            <li>To provide the Financial Coach feature (AI-powered Q&A about your spending)</li>
            <li>To process your subscription payments</li>
            <li>To send service emails (welcome, weekly digest, trial reminders, billing notices)</li>
            <li>To improve and troubleshoot our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">4. Data Sharing</h2>
          <p className="mt-2 text-gray-600">
            We do not sell your personal or financial data. We share data only with trusted service providers who help us operate the service:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
            <li><strong>Plaid</strong> — for bank account linking and transaction data retrieval</li>
            <li><strong>Stripe</strong> — for subscription payment processing</li>
            <li><strong>OpenAI</strong> — for AI-powered transaction categorization and insights</li>
            <li><strong>Resend</strong> — for sending transactional emails</li>
            <li><strong>Turso</strong> — for database hosting</li>
          </ul>
          <p className="mt-2 text-gray-600">
            Each of these providers is contractually bound to protect your data and use it only for the services they provide to us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">5. Data Security</h2>
          <p className="mt-2 text-gray-600">
            We implement industry-standard security measures including encryption in transit (TLS) and at rest. Your bank credentials never touch our servers — Plaid handles authentication directly. We follow security best practices and regularly review our infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">6. Data Retention</h2>
          <p className="mt-2 text-gray-600">
            We retain your account and transaction data for as long as your account is active. If you cancel your subscription, we retain your data for 30 days in case you wish to reactivate. After 30 days, your data is permanently deleted. You can request earlier deletion at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">7. Your Rights</h2>
          <p className="mt-2 text-gray-600">
            You have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
            <li>Access your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Export your transaction data at any time</li>
            <li>Unlink your bank accounts at any time</li>
            <li>Cancel your subscription at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">8. Third-Party Links</h2>
          <p className="mt-2 text-gray-600">
            Our service may contain links to third-party websites (e.g., Plaid's Link interface, Stripe's checkout page). We are not responsible for the privacy practices of these third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">9. Changes to This Policy</h2>
          <p className="mt-2 text-gray-600">
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the app. Continued use of the service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">10. Contact</h2>
          <p className="mt-2 text-gray-600">
            If you have questions about this Privacy Policy or your data, please contact us at <a href="mailto:support@weekwise.app" className="text-indigo-600 hover:underline">support@weekwise.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
}