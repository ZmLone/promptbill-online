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

  return {
    title: `${a.name} vs ${b.name} API Pricing & Token Cost Calculator (2026)`,
    description: `Compare ${a.name} ($${a.inputPer1M}/1M in) vs ${b.name} ($${b.inputPer1M}/1M in). Calculate monthly API spend, prompt caching discounts, and batch savings.`,
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
      <Link
        href="/"
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        ← Back to All Models
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {modelA.name} vs {modelB.name}: API Cost &amp; Token Calculator
      </h1>
      <p className="mt-3 max-w-3xl text-slate-400">
        {modelA.name} charges ${modelA.inputPer1M}/1M input and $
        {modelA.outputPer1M}/1M output tokens, while {modelB.name} charges $
        {modelB.inputPer1M}/1M input and ${modelB.outputPer1M}/1M output tokens.
        Adjust your traffic below to see exact monthly savings.
      </p>

      <div className="mt-8">
        <CostSimulator
          models={models}
          initialHighlightSlugs={[modelA.slug, modelB.slug]}
        />
      </div>
    </main>
  );
}
