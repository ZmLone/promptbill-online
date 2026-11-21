import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: 'PromptBill — LLM Leaderboard, AI API Pricing & Credit Monitoring (Nov 2026)',
  description:
    'Independent LLM leaderboard, AI API token pricing, self-host vs API cost calculators, and provider credit monitoring directories for November 2026 on promptbill.online.',
  alternates: {
    canonical: 'https://promptbill.online/',
  },
  openGraph: {
    title: 'PromptBill — LLM Leaderboard, AI API Pricing & Credit Monitoring',
    description:
      'Compare LLM rankings, API pricing, self-host vs API costs, and provider credit monitoring on promptbill.online.',
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
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PromptBill',
      url: 'https://promptbill.online/',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description:
        'LLM leaderboard, API token pricing calculator, self-host vs API estimator, and provider credit monitoring directory.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does PromptBill compare LLM API costs and self-hosting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PromptBill calculates 30-day API token costs with prompt caching and compares them against your monthly GPU hosting budget.',
          },
        },
        {
          '@type': 'Question',
          name: 'What do Supported and Estimated rankings mean on PromptBill?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Supported rankings have strong independent benchmark evidence, while Estimated rankings indicate wider uncertainty.',
          },
        },
      ],
    },
  ],
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
