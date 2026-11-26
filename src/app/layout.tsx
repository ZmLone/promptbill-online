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
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  other: {
    'theme-color': '#0f172a',
    'og:updated_time': '2026-11-26T20:23:00+05:30',
  },
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
      '@id': 'https://promptbill.online/#website',
      name: 'PromptBill',
      url: 'https://promptbill.online',
      inLanguage: 'en',
      dateModified: '2026-11-26',
      description:
        'LLM benchmark leaderboard, API token cost calculator, head-to-head model comparisons, token counter, and routing simulator.',
      publisher: {
        '@id': 'https://promptbill.online/#organization',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://promptbill.online/#organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://promptbill.online/favicon.ico',
      },
      knowsAbout: [
        'LLM API pricing',
        'Token cost calculation',
        'Prompt caching and batch discounts',
        'Model benchmark leaderboards',
        'Output tokens per second throughput',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'PromptBill API Pricing & Comparison Tools',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'LLM Token Cost Calculator',
            url: 'https://promptbill.online/',
          },
          {
            '@type': 'Offer',
            name: 'API Token Pricing Table',
            url: 'https://promptbill.online/pricing',
          },
        ],
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://promptbill.online/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://promptbill.online/',
        },
      ],
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
