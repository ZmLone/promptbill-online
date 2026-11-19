import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenLedger — AI API Token & Cloud Cost Simulator (2026)",
  description:
    "Compare real monthly API bills across OpenAI, Anthropic, and Google models. Calculate prompt caching discounts, batch API savings, and token costs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
