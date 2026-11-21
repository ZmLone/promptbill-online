import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: {
    default: 'PromptBill — LLM Leaderboard & API Cost Calculator',
    template: '%s | PromptBill',
  },
  description:
    'Compare LLM rankings, API token pricing, model comparisons, and 30-day cost estimates on promptbill.online.',
  alternates: {
    canonical: 'https://promptbill.online/',
  },
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'PromptBill',
      url: 'https://promptbill.online',
      description: 'LLM benchmark rankings, model comparisons, and API token cost calculators.',
    },
    {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
