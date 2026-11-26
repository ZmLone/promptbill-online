import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { DynamicCompareClient } from '../../components/DynamicCompareClient';
import { ALL_MODELS } from '../../lib/catalog';

export const metadata: Metadata = {
  title: 'Head-to-Head LLM Comparisons (A vs B) — Pricing, Benchmarks & Speed | PromptBill',
  description:
    'Compare two or more LLMs head-to-head across benchmark scores, Score/$ efficiency, official API input/output token rates per 1M tokens, throughput (tok/s), and context windows on promptbill.online.',
  keywords: [
    'LLM comparison A vs B',
    'head to head AI model comparison',
    'LLM API pricing comparison',
    'benchmark score vs API price',
    'PromptBill compare',
  ],
  alternates: {
    canonical: 'https://promptbill.online/compare',
  },
  openGraph: {
    title: 'Head-to-Head LLM Comparisons (A vs B) — Pricing, Benchmarks & Speed | PromptBill',
    description:
      'Pick Model A and Model B for instant head-to-head comparison, browse trending matchups, or compare multiple models side by side.',
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
        name: 'Head-to-Head LLM Comparisons (A vs B) — Pricing, Benchmarks & Speed',
        description:
          'Interactive head-to-head and multi-model LLM comparison tool evaluating benchmark scores, Score/$ efficiency, official API token pricing per 1M tokens, context windows, and speed.',
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
              name: 'Compare LLMs',
              item: 'https://promptbill.online/compare',
            },
          ],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://promptbill.online/compare#app',
        name: 'PromptBill Head-to-Head LLM Comparator',
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
      title="Head-to-Head LLM Comparisons (A vs B)"
      subtitle="promptbill.online/compare · Official API Pricing, Benchmarks & Speed"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DynamicCompareClient
        models={activeModels}
        initialSlugs={requestedSlugs}
        initialA={rawA.trim()}
        initialB={rawB.trim()}
      />
    </SiteShell>
  );
}
