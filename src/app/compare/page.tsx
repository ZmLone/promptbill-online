import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { DynamicCompareClient } from '../../components/DynamicCompareClient';
import { ALL_MODELS } from '../../lib/catalog';

export const metadata: Metadata = {
  title: 'Compare LLMs Side-by-Side (2026) — Benchmark Scores, API Token Pricing & Speed | PromptBill',
  description:
    'Compare any 2 to 6 LLMs side by side across composite benchmark scores, Score/$ cost-efficiency, API input/output token prices per 1M tokens, throughput (tok/s), and context windows on promptbill.online.',
  keywords: [
    'compare LLMs side by side',
    'AI model comparison tool',
    'LLM API pricing comparison',
    'LLM benchmark vs price',
    'PromptBill compare',
  ],
  alternates: {
    canonical: 'https://promptbill.online/compare',
  },
  openGraph: {
    title: 'Compare LLMs Side-by-Side — Benchmark Scores, API Pricing & Speed | PromptBill',
    description:
      'Side-by-side comparison matrix for active LLMs with automatic winner highlights for benchmark score, Score/$, API pricing, and tokens per second.',
    url: 'https://promptbill.online/compare',
    siteName: 'PromptBill',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeModels = (ALL_MODELS as any[]).filter((m) => !m.archived);

  const rawModels = Array.isArray(resolved?.models)
    ? resolved.models.join(',')
    : resolved?.models || '';
  const rawA = Array.isArray(resolved?.a) ? resolved.a[0] : resolved?.a || '';
  const rawB = Array.isArray(resolved?.b) ? resolved.b[0] : resolved?.b || '';

  const requestedSlugs = Array.from(
    new Set(
      [
        ...rawModels
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        rawA.trim(),
        rawB.trim(),
      ].filter(Boolean)
    )
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://promptbill.online/compare#webpage',
        url: 'https://promptbill.online/compare',
        name: 'Compare LLMs Side-by-Side — Benchmark Scores, API Pricing & Speed',
        description:
          'Interactive multi-model LLM comparison tool evaluating benchmark scores, Score/$ efficiency, official API token pricing per 1M tokens, context windows, and speed.',
        isPartOf: {
          '@type': 'WebSite',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://promptbill.online',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'LLM Leaderboard',
              item: 'https://promptbill.online/leaderboard',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Compare Models',
              item: 'https://promptbill.online/compare',
            },
          ],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://promptbill.online/compare#app',
        name: 'PromptBill Side-by-Side LLM Comparator',
        url: 'https://promptbill.online/compare',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

  return (
    <SiteShell
      title="Compare LLMs Side-by-Side"
      subtitle="promptbill.online/compare · Dynamic Multi-Model Benchmark, Pricing & Speed Comparison"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DynamicCompareClient
        models={activeModels}
        initialSlugs={requestedSlugs}
      />
    </SiteShell>
  );
}
