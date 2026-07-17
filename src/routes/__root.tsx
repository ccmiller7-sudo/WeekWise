import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "WeekWise Finance" },
      { name: "theme-color", content: "#4f46e5" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "WeekWise Finance" },
      { name: "msapplication-TileColor", content: "#4f46e5" },
      { name: "msapplication-TileImage", content: "/pwa-192x192.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "sitemap", type: "application/xml", href: "/api/sitemap.xml" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/pwa-192x192.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/pwa-192x192.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/pwa-512x512.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  notFoundComponent: () => <div className="flex min-h-dvh items-center justify-center p-6 text-center text-gray-500">Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="pb-20">
        {children}

        {/* Bottom nav — mobile-first tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90 backdrop-blur-lg safe-area-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around py-2">
            <NavLink href="/" label="Home" icon="🏠" />
            <NavLink href="/transactions" label="Spending" icon="💳" />
            <NavLink href="/coach" label="Coach" icon="🎯" />
            <NavLink href="/pricing" label="Pricing" icon="⭐" />
            <NavLink href="/onboarding" label="Settings" icon="⚙️" />
          </div>
        </nav>

        <Scripts />
      </body>
      {/* Footer — legal links and copyright */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-6 text-center text-xs text-gray-400">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-center gap-4">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span className="text-gray-300">·</span>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          </div>
          <p>© {new Date().getFullYear()} WeekWise Finance. All rights reserved.</p>
        </div>
      </footer>
    </html>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:text-indigo-600 [&.active]:text-indigo-600"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}