import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: 'PromptBill — LLM Leaderboard, AI API Pricing & Cost Calculator',
  description:
    'Compare LLM rankings, API token pricing, 30-day cost estimates, prompt caching and batch savings, token counts, and API deals on promptbill.online.',
  alternates: {
    canonical: 'https://promptbill.online/',
  },
  openGraph: {
    title: 'PromptBill — LLM Leaderboard, AI API Pricing & Cost Calculator',
    description:
      'Compare LLM rankings, API token pricing, 30-day cost estimates, prompt caching and batch savings, and token counts on promptbill.online.',
    url: 'https://promptbill.online/',
    siteName: 'PromptBill',
    type: 'website',
  },
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PromptBill',
  url: 'https://promptbill.online/',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  description:
    'Interactive LLM leaderboard, API token pricing calculator, model selector, token counter, and API savings deals.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
