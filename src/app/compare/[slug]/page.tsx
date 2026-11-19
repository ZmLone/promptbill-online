import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CostSimulator from '@/components/CostSimulator';
import { FALLBACK_MODELS } from '@/data/fallbackModels';
import { getActiveModels } from '@/lib/openrouterSync';

function getAllPairs() {
  const pairs: { slug: string; aSlug: string; bSlug: string }[] = [];
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    for (let j = i + 1; j < FALLBACK_MODELS.length; j++) {
      const a = FALLBACK_MODELS[i];
      const b = FALLBACK_MODELS[j];
      pairs.push({
        slug: `${a.slug}-vs-${b.slug}`,
        aSlug: a.slug,
        bSlug: b.slug,
      });
    }
  }
  return pairs;
}

export async function generateStaticParams() {
  return getAllPairs().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = getAllPairs().find((p) => p.slug === slug);
  if (!pair) return {};

  const a = FALLBACK_MODELS.find((m) => m.slug === pair.aSlug)!;
  const b = FALLBACK_MODELS.find((m) => m.slug === pair.bSlug)!;
  const title = `${a.name} vs ${b.name} API Pricing & Token Cost Calculator (2026)`;
  const description = `Compare ${a.name} ($${a.inputPer1M}/1M in) vs ${b.name} ($${b.inputPer1M}/1M in). Calculate monthly API spend, prompt caching discounts, and batch savings.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/compare/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/compare/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pair = getAllPairs().find((p) => p.slug === slug);
  if (!pair) notFound();

  const models = await getActiveModels();
  const modelA = models.find((m) => m.slug === pair.aSlug)!;
  const modelB = models.find((m) => m.slug === pair.bSlug)!;

  // Benchmark calculation: 10M input tokens + 2M output tokens per month
  const costA = modelA.inputPer1M * 10 + modelA.outputPer1M * 2;
  const costB = modelB.inputPer1M * 10 + modelB.outputPer1M * 2;
  const cheaper = costA <= costB ? modelA : modelB;
  const pricier = costA <= costB ? modelB : modelA;
  const minCost = Math.min(costA, costB);
  const maxCost = Math.max(costA, costB);
  const pctDiff = maxCost > 0 ? Math.round(((maxCost - minCost) / maxCost) * 100) : 0;

  const verdictText =
    costA === costB
      ? `${modelA.name} and ${modelB.name} cost the exact same ($${costA.toFixed(2)}/month) at a benchmark of 10M input and 2M output tokens. Choose based on context window (${(modelA.contextWindow / 1000).toLocaleString()}K vs ${(modelB.contextWindow / 1000).toLocaleString()}K tokens) and provider ecosystem.`
      : `At a standard workload of 10M input and 2M output tokens per month, ${cheaper.name} costs $${minCost.toFixed(2)} compared to $${maxCost.toFixed(2)} for ${pricier.name}—making ${cheaper.name} ${pctDiff}% cheaper.`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Which is cheaper: ${modelA.name} or ${modelB.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: verdictText,
        },
      },
      {
        '@type': 'Question',
        name: `What is the context window difference between ${modelA.name} and ${modelB.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${modelA.name} supports up to ${modelA.contextWindow.toLocaleString()} tokens, while ${modelB.name} supports up to ${modelB.contextWindow.toLocaleString()} tokens.`,
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Link
        href="/"
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        ← Back to All Models
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {modelA.name} vs {modelB.name}: API Cost &amp; Token Calculator
      </h1>

      {/* Unique Calculated Verdict Box (Prevents Thin Content) */}
      <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Quick Cost Verdict (10M Input + 2M Output Tokens/Mo)
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {verdictText}
        </p>
        <div className="mt-3 flex flex-wrap gap-6 text-xs text-slate-400">
          <span>
            <strong className="text-white">{modelA.name}:</strong> $
            {modelA.inputPer1M}/1M in · ${modelA.outputPer1M}/1M out ·{' '}
            {(modelA.contextWindow / 1000).toLocaleString()}K context
          </span>
          <span>
            <strong className="text-white">{modelB.name}:</strong> $
            {modelB.inputPer1M}/1M in · ${modelB.outputPer1M}/1M out ·{' '}
            {(modelB.contextWindow / 1000).toLocaleString()}K context
          </span>
        </div>
      </div>

      <div className="mt-8">
        <CostSimulator
          models={models}
          initialHighlightSlugs={[modelA.slug, modelB.slug]}
        />
      </div>
    </main>
  );
}
