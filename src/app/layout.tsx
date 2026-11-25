import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

const SITE_TITLE = 'PromptBill — LLM API Pricing & Token Calculator';
const SITE_DESCRIPTION =
  'Compare LLM API token rates per 1M tokens, prompt cache and batch discounts, output speed (tok/s), and model benchmarks on PromptBill.';

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
  other: {
    'og:updated_time': '2026-11-25T14:20:00+05:30',
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
      dateModified: '2026-11-25',
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
      </head>
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-x-hidden">
        {children}
        {adsenseClient ? (
          <Script
            id="adsense-init"
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
