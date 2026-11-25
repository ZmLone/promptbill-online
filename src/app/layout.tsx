import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const SITE_TITLE = 'PromptBill — LLM API Pricing & Token Calculator';
const SITE_DESCRIPTION =
  'Compare LLM API token pricing per 1M tokens, prompt cache read/write rates, batch discounts, output speed (tok/s), coding benchmarks, and head-to-head model matchups.';

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: {
    default: SITE_TITLE,
    template: '%s · PromptBill',
  },
  description: SITE_DESCRIPTION,
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://promptbill.online',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'PromptBill',
      url: 'https://promptbill.online',
      description:
        'LLM benchmark leaderboard, API token cost calculator, head-to-head model comparisons, token counter, and routing simulator.',
    },
    {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {adsenseClient ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
