import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { ModelsDirectoryClient } from '../../components/ModelsDirectoryClient';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT } from '../../lib/modelRegistry';

export const metadata: Metadata = {
  title: 'Models — LLM Directory, Workload Matcher, API Pricing & Benchmarks | PromptBill',
  description:
    'Search and compare every LLM by benchmark score, Score/$ efficiency, official API token pricing per 1M tokens, context window, and throughput (tok/s), or match your exact workload on promptbill.online/models.',
  keywords: [
    'LLM models directory',
    'which LLM is right for my job',
    'LLM API pricing per 1M tokens',
    'compare AI models',
    'open weight vs closed LLM',
    'PromptBill models',
  ],
  alternates: {
    canonical: 'https://promptbill.online/models',
  },
  openGraph: {
    title: 'Models — LLM Directory, Workload Matcher, API Pricing & Benchmarks | PromptBill',
    description:
      'Find the best LLM for your workload or browse searchable model specs, API token rates per 1M tokens, and benchmark scores.',
    url: 'https://promptbill.online/models',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Models — LLM Directory & Workload Matcher | PromptBill',
    description:
      'Searchable LLM catalog with workload matching, API pricing per 1M tokens, context windows, and throughput.',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
};

export default function ModelsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeModels = (ALL_MODELS as any[]).filter((m) => !m.archived);
  const lastVerifiedIso = REGISTRY_SNAPSHOT.generatedMonthYear || '2026-11-27';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://promptbill.online/models#webpage',
        url: 'https://promptbill.online/models',
        name: 'Models — LLM Directory, Workload Matcher, API Pricing & Benchmarks',
        description:
          'Searchable directory and workload matcher for large language models covering benchmark scores, Score/$ efficiency, API token rates per 1M tokens, context windows, and tokens per second.',
        dateModified: lastVerifiedIso,
        inLanguage: 'en-US',
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['[data-geo-facts="true"]'],
        },
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
              name: 'Models',
              item: 'https://promptbill.online/models',
            },
          ],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://promptbill.online/models#task-matcher',
        name: 'PromptBill LLM Workload Matcher & Models Directory',
        url: 'https://promptbill.online/models',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://promptbill.online/models#itemlist',
        name: 'Tracked Large Language Models on PromptBill',
        numberOfItems: activeModels.length,
        itemListElement: activeModels.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: m.name,
          url: `https://promptbill.online/models/${m.slug}`,
          description: `${m.provider} · Score: ${m.score ?? 'N/A'} · API Price: $${m.inputPer1M ?? 'N/A'}/$${m.outputPer1M ?? 'N/A'} per 1M tokens · Context: ${m.contextWindow ?? 'N/A'} · Speed: ${m.tokPerSec ?? 'N/A'} tok/s`,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://promptbill.online/models#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I choose the right LLM for my workload on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Enter your task, required context length (such as 256K or 1M tokens), output budget per 1M tokens, or hosting preference in the workload matcher on promptbill.online/models to rank top-fitting models with reasons and trade-offs.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I filter models by provider, license, and pricing on the Models page?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. The Models directory supports instant keyword search, provider chips and dropdowns, Closed vs. Open Weight license filtering, Verified vs. Estimated provenance filtering, and independent mobile and desktop pagination.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell
      title="Models Directory & Workload Matcher"
      subtitle="promptbill.online/models · Searchable Catalog, API Pricing, Benchmarks & Task Finder"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ModelsDirectoryClient models={activeModels} />
    </SiteShell>
  );
}
