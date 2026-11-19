import type { Metadata } from "next";
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
      "Interactive AI API token counter and monthly cost calculator comparing OpenAI, Anthropic, and Google models with prompt caching and batch discounts.",
  };

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
