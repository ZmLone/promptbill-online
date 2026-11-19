import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tokenledger-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TokenLedger — AI API Token & Cloud Cost Simulator (2026)",
    template: "%s | TokenLedger",
  },
  description:
    "Compare real monthly API bills across OpenAI, Anthropic, and Google models. Calculate prompt caching discounts, batch API savings, and token costs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TokenLedger",
    title: "TokenLedger — AI API Token & Cloud Cost Simulator (2026)",
    description:
      "Paste your prompt, dial in daily requests and prompt caching hit rates, and compare real monthly AI API bills side-by-side.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenLedger — AI API Token & Cloud Cost Simulator",
    description:
      "Compare real monthly API costs and prompt caching savings across OpenAI, Claude, and Gemini.",
  },
  verification: {
    google: "i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TokenLedger AI API Cost Simulator",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Interactive AI API token counter and monthly cost calculator comparing 22 models with prompt caching and batch discounts.",
  };

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />

        <div className="flex-1">{children}</div>

        <footer className="mt-16 border-t border-slate-800 bg-slate-950/90">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-400">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="font-semibold text-slate-200">
                TokenLedger · AI API Cost Simulator
              </div>
              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap gap-5"
              >
                <Link href="/" className="hover:text-emerald-400">
                  Cost Simulator
                </Link>
                <Link href="/compare" className="hover:text-emerald-400">
                  All 231 Model Comparisons
                </Link>
                <a href="/sitemap.xml" className="hover:text-emerald-400">
                  Sitemap
                </a>
                <a href="/llms.txt" className="hover:text-emerald-400">
                  llms.txt
                </a>
              </nav>
            </div>
            <p className="mt-4 max-w-4xl leading-relaxed text-slate-500">
              Pricing Disclaimer &amp; Privacy: Token rates are synced from
              public provider feeds for estimation purposes; always verify final
              billing with your API provider. Prompts pasted into the token
              counter are processed locally in your browser and are never stored
              on our servers. Some outbound infrastructure links may include
              affiliate tracking at no additional cost to you.
            </p>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
