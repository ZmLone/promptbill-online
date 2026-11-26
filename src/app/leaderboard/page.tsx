import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { LeaderboardTableClient } from '../../components/LeaderboardTableClient';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT } from '../../lib/modelRegistry';

export const metadata: Metadata = {
  title: 'LLM Leaderboard (2026) — Verified Benchmark Scores, API Token Pricing & Speed',
  description:
    'Compare active LLMs by verified composite benchmark score, Score/$ cost-efficiency ratio, official API token pricing per 1M tokens, context window, and output speed (tok/s) on promptbill.online.',
  keywords: [
    'LLM leaderboard 2026',
    'AI model benchmark comparison',
    'LLM API pricing per 1M tokens',
    'best value LLM Score per dollar',
    'cheapest LLM API',
    'fastest LLM tokens per second',
    'open weight vs proprietary LLM',
    'PromptBill leaderboard',
  ],
  alternates: {
    canonical: 'https://promptbill.online/leaderboard',
  },
  openGraph: {
    title: 'LLM Leaderboard (2026) — Verified Benchmark Scores, API Pricing & Speed | PromptBill',
    description:
      'Evidence-aware LLM rankings comparing verified benchmark scores, Score/$ value ratios, API token rates per 1M tokens, context windows, and generation speed.',
    url: 'https://promptbill.online/leaderboard',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Leaderboard (2026) — Benchmark Scores, API Pricing & Speed | PromptBill',
    description:
      'Compare frontier and open-weight LLMs by verified benchmark score, Score/$ efficiency, API pricing, and throughput.',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveLifecycle(m: any): 'Active' | 'Preview' | 'Deprecated' | 'Legacy' {
  const candidates = [
    m?.lifecycleStatus,
    m?.lifecycle,
    m?.status,
    m?.modelStatus,
    m?.availability,
  ];
  for (const cand of candidates) {
    if (typeof cand !== 'string' || !cand.trim()) continue;
    const v = cand.trim().toLowerCase();
    if (v === 'deprecated' || v === 'deprecating' || v === 'retired') return 'Deprecated';
    if (v === 'legacy' || v === 'superseded') return 'Legacy';
    if (v === 'preview' || v === 'beta' || v === 'experimental') return 'Preview';
    if (v === 'active' || v === 'ga' || v === 'generally available' || v === 'live') return 'Active';
  }
  if (m?.deprecated === true) return 'Deprecated';
  return 'Active';
}

function resolveLastVerifiedDate(): string {
  const dates: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of ALL_MODELS as any[]) {
    if (m.pricingProvenance?.lastVerified) dates.push(String(m.pricingProvenance.lastVerified));
    if (m.benchmarkProvenance?.lastVerified) dates.push(String(m.benchmarkProvenance.lastVerified));
    if (m.speedProvenance?.lastVerified) dates.push(String(m.speedProvenance.lastVerified));
  }
  dates.sort();
  if (dates.length > 0) {
    return dates[dates.length - 1].slice(0, 10);
  }
  return REGISTRY_SNAPSHOT.generatedMonthYear || '2026-11-27';
}

export default function LeaderboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeModels = (ALL_MODELS as any[]).filter((m) => !m.archived);
  const lastVerifiedIso = resolveLastVerifiedDate();

  const sortedForSchema = [...activeModels].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1)
  );

  const topScoreModel = sortedForSchema[0];
  const topValueModel = [...activeModels]
    .filter((m) => typeof m.score === 'number' && typeof m.outputPer1M === 'number' && m.outputPer1M > 0)
    .sort((a, b) => b.score / b.outputPer1M - a.score / a.outputPer1M)[0];
  const fastestModel = [...activeModels]
    .filter((m) => typeof m.tokPerSec === 'number')
    .sort((a, b) => (b.tokPerSec ?? 0) - (a.tokPerSec ?? 0))[0];

  const verifiedModelsCount = activeModels.filter(
    (m) =>
      String(m.evidence || '').toLowerCase() === 'verified' ||
      (String(m.pricingProvenance?.status || '').toLowerCase() === 'verified' &&
        String(m.benchmarkProvenance?.status || '').toLowerCase() === 'verified')
  ).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://promptbill.online/leaderboard#webpage',
        url: 'https://promptbill.online/leaderboard',
        name: 'LLM Leaderboard (2026) — Verified Benchmark Scores, API Pricing & Speed',
        description:
          'Evidence-aware LLM rankings comparing benchmark scores, Score/$ value ratios, API token pricing per 1M tokens, context windows, and generation speed.',
        dateModified: lastVerifiedIso,
        inLanguage: 'en-US',
        about: {
          '@type': 'Thing',
          name: 'Large Language Model Benchmarks and API Pricing',
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['[data-geo-summary="true"]', '[data-geo-facts="true"]'],
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
              name: 'LLM Leaderboard',
              item: 'https://promptbill.online/leaderboard',
            },
          ],
        },
      },
      {
        '@type': 'Dataset',
        '@id': 'https://promptbill.online/leaderboard#dataset',
        name: 'PromptBill LLM Benchmark, API Pricing & Throughput Dataset (2026)',
        description:
          'Structured dataset of active large language model composite benchmark scores (0-100), Score/$ efficiency ratios, official input and output API prices per 1M tokens (USD), context window capacities, licensing, lifecycle status, and output speed in tokens per second.',
        url: 'https://promptbill.online/leaderboard',
        dateModified: lastVerifiedIso,
        temporalCoverage: '2026',
        measurementTechnique:
          'Cross-verified official provider API pricing schedules, composite evaluation benchmarks, and standardized token throughput telemetry.',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
        variableMeasured: [
          {
            '@type': 'PropertyValue',
            name: 'Composite Benchmark Score',
            unitText: 'points (0-100 scale)',
          },
          {
            '@type': 'PropertyValue',
            name: 'Score per Dollar Ratio (Score/$)',
            unitText: 'benchmark points per USD per 1M output tokens',
          },
          {
            '@type': 'PropertyValue',
            name: 'API Input Token Price',
            unitText: 'USD per 1,000,000 input tokens',
          },
          {
            '@type': 'PropertyValue',
            name: 'API Output Token Price',
            unitText: 'USD per 1,000,000 output tokens',
          },
          {
            '@type': 'PropertyValue',
            name: 'Output Generation Throughput',
            unitText: 'tokens per second (tok/s)',
          },
          {
            '@type': 'PropertyValue',
            name: 'Context Window Size',
            unitText: 'tokens',
          },
        ],
      },
      {
        '@type': 'HowTo',
        '@id': 'https://promptbill.online/leaderboard#howto-select-llm',
        name: 'How to Choose the Best LLM for Your Workload and API Budget',
        description:
          'Step-by-step method to match an AI model to your production latency, context length, and token cost constraints.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Specify workload requirements',
            text: 'Enter your target task, minimum context window (e.g., 256K or 1M tokens), output budget per 1M tokens, or hosting preference (Open Weight vs. Closed API).',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Evaluate Score/$ efficiency and lifecycle status',
            text: 'Compare composite benchmark scores alongside Score/$ value ratios and verify the model holds Active GA status rather than Preview or Deprecated.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Compare top candidates side by side',
            text: 'Select two or more models to inspect exact input/output pricing, throughput (tok/s), and context limits in the side-by-side comparison matrix.',
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://promptbill.online/leaderboard#itemlist',
        name: 'Ranked LLMs by Composite Benchmark Score',
        numberOfItems: sortedForSchema.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: sortedForSchema.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: m.name,
          url: `https://promptbill.online/models/${m.slug}`,
          description: `${m.provider} · ${normalizeLicense(m.license)} · Lifecycle: ${resolveLifecycle(
            m
          )} · Score: ${m.score ?? 'N/A'} · API Price: $${m.inputPer1M ?? 'N/A'}/$${
            m.outputPer1M ?? 'N/A'
          } per 1M tokens · Context: ${m.contextWindow ?? 'N/A'} · Speed: ${
            m.tokPerSec ?? 'N/A'
          } tok/s. ${sanitizeDescription(m.bestFor || m.notes)}`,
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
            name: 'What do Verified, Active, and Closed badges mean on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Verified means API token rates and benchmark metrics are cross-checked against official provider documentation. Active indicates a production-supported endpoint (unlike Preview, Legacy, or Deprecated models). Closed indicates proprietary hosted API access, whereas Open Weight models publish downloadable weights.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often are LLM benchmark scores and API prices verified?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `PromptBill syncs model registries daily and stamps every entry with Verified or Estimated provenance. Currently ${verifiedModelsCount} of ${activeModels.length} tracked models have Verified provenance, last updated on ${lastVerifiedIso}.`,
            },
          },
          {
            '@type': 'Question',
            name: 'Which LLM currently leads the PromptBill benchmark rankings?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: topScoreModel
                ? `${topScoreModel.name} (${topScoreModel.provider}) leads composite benchmark score at ${topScoreModel.score}, while ${
                    topValueModel
                      ? `${topValueModel.name} leads Score/$ efficiency`
                      : 'lightweight tiers lead value per dollar'
                  } and ${
                    fastestModel
                      ? `${fastestModel.name} reaches ${fastestModel.tokPerSec} tok/s`
                      : 'flash tiers lead throughput'
                  }.`
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
