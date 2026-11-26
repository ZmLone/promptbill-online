import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { LeaderboardTableClient } from '../../components/LeaderboardTableClient';
import { MODELS, getLastVerifiedDate } from '../../data/models';

export const metadata: Metadata = {
  title: 'LLM Leaderboard (2026) — Verified Benchmark Scores, API Pricing & Speed',
  description:
    'Live, evidence-aware LLM leaderboard comparing verified benchmark scores, official API token pricing per 1M tokens, Score/$ value ratios, throughput (tok/s), context windows, and model lifecycle status on promptbill.online.',
  keywords: [
    'LLM leaderboard',
    'AI model benchmark scores',
    'LLM API pricing comparison',
    'cheapest LLM API',
    'best value LLM Score per dollar',
    'LLM tokens per second speed',
    'PromptBill leaderboard',
  ],
  alternates: {
    canonical: 'https://promptbill.online/leaderboard',
  },
  openGraph: {
    title: 'LLM Leaderboard — Verified Benchmark Scores, API Pricing & Speed | PromptBill',
    description:
      'Compare frontier and open-weight LLMs by verified benchmark score, Score/$ efficiency, API input/output rates, context window, and output speed.',
    url: 'https://promptbill.online/leaderboard',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Leaderboard — Benchmark Scores, API Pricing & Speed | PromptBill',
    description:
      'Evidence-aware LLM rankings with dynamic sorting, Score/$ value ratios, API pricing, and throughput.',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
};

function sanitizeDescription(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/#1\s+benchmark\s+score\s*;?\s*/gi, 'Top-tier benchmark performance; ')
    .replace(/#1\s+Score\/\$\s+ratio\s*/gi, 'High Score/$ value ratio ')
    .replace(/#1\s+overall\s*/gi, 'Leading ')
    .replace(/;\s*$/g, '')
    .trim();
}

function normalizeLicense(raw: string | null | undefined): string {
  if (!raw) return 'Closed';
  const v = raw.trim();
  if (!v || /^n\/?a$/i.test(v) || /^unspecified$/i.test(v)) return 'Closed';
  if (/open/i.test(v) || /apache|mit|llama|gemma|qwen|deepseek|mistral/i.test(v)) {
    return 'Open Weight';
  }
  if (/proprietary|closed/i.test(v)) return 'Closed';
  return v;
}

export default function LeaderboardPage() {
  const activeModels = MODELS.filter((m) => !m.archived);
  const lastVerifiedIso = getLastVerifiedDate();

  const sortedForSchema = [...activeModels].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1)
  );

  const topScoreModel = sortedForSchema[0];
  const topValueModel = [...activeModels]
    .filter((m) => typeof m.score === 'number' && typeof m.outputPer1M === 'number' && m.outputPer1M > 0)
    .sort((a, b) => (b.score! / b.outputPer1M!) - (a.score! / a.outputPer1M!))[0];
  const fastestModel = [...activeModels]
    .filter((m) => typeof m.tokPerSec === 'number')
    .sort((a, b) => (b.tokPerSec ?? 0) - (a.tokPerSec ?? 0))[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://promptbill.online/leaderboard#webpage',
        url: 'https://promptbill.online/leaderboard',
        name: 'LLM Leaderboard — Benchmark Scores, API Pricing & Speed',
        description:
          'Evidence-aware LLM rankings comparing benchmark scores, Score/$ value ratios, API token pricing per 1M tokens, context windows, and generation speed.',
        dateModified: lastVerifiedIso,
        inLanguage: 'en-US',
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
          ],
        },
      },
      {
        '@type': 'Dataset',
        '@id': 'https://promptbill.online/leaderboard#dataset',
        name: 'PromptBill LLM Benchmark, API Pricing & Throughput Dataset',
        description:
          'Structured dataset of large language model composite capability scores, official input/output API token rates per 1M tokens, context limits, licensing, lifecycle status, and output tokens per second.',
        url: 'https://promptbill.online/leaderboard',
        dateModified: lastVerifiedIso,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
        variableMeasured: [
          'Composite Benchmark Score (0-100)',
          'Score per Dollar Value Ratio (Score / Output $/1M)',
          'API Input Token Price (USD per 1M tokens)',
          'API Output Token Price (USD per 1M tokens)',
          'Generation Speed (tokens per second)',
          'Context Window Size (tokens)',
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://promptbill.online/leaderboard#itemlist',
        name: 'Top Ranked LLMs by Composite Benchmark Score',
        numberOfItems: sortedForSchema.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: sortedForSchema.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: m.name,
          url: `https://promptbill.online/models/${m.slug}`,
          description: `${m.provider} · ${normalizeLicense(m.license)} · Lifecycle: ${
            m.lifecycleStatus || 'Active'
          } · Score: ${m.score ?? 'N/A'} · API Price: $${m.inputPer1M ?? 'N/A'}/$${
            m.outputPer1M ?? 'N/A'
          } per 1M tokens · Speed: ${m.tokPerSec ?? 'N/A'} tok/s. ${sanitizeDescription(
            m.bestFor || m.notes
          )}`,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://promptbill.online/leaderboard#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How is Score/$ calculated on the PromptBill LLM Leaderboard?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Score/$ divides a model’s composite benchmark score (0–100 scale) by its official output token price per 1 million tokens in USD. Higher Score/$ indicates stronger capability per output dollar.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often are LLM benchmark scores and API prices verified?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `PromptBill syncs model registries daily and stamps every entry with Verified or Estimated provenance. Dataset last verified on ${lastVerifiedIso}.`,
            },
          },
          {
            '@type': 'Question',
            name: 'Which LLM currently leads the PromptBill benchmark rankings?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: topScoreModel
                ? `${topScoreModel.name} (${topScoreModel.provider}) leads composite benchmark score at ${topScoreModel.score}, while ${
                    topValueModel ? `${topValueModel.name} leads Score/$ efficiency` : 'lightweight tiers lead value per dollar'
                  } and ${fastestModel ? `${fastestModel.name} reaches ${fastestModel.tokPerSec} tok/s` : 'flash tiers lead throughput'}.`
                : 'Rankings update dynamically as new verified benchmarks and official provider pricing are published.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Speed"
      subtitle="promptbill.online/leaderboard · Evidence-Aware Rankings, Pricing & Throughput"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LeaderboardTableClient lastVerifiedDate={lastVerifiedIso} />
    </SiteShell>
  );
}
