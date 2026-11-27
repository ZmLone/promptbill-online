import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: {
    default: 'PromptBill — LLM API Pricing, Multi-Endpoint Rates & Token Calculator',
    template: '%s | PromptBill',
  },
  description:
    'Live LLM API token pricing per 1M tokens across official APIs and inference clouds, 30-day cost calculator with caching & batch discounts, and benchmark rankings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-[#fbfbfd] text-slate-900 selection:bg-emerald-200/70 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
