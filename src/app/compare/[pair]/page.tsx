import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareAnswerBlock } from '../../components/CompareAnswerBlock';
import { ALL_MODELS } from '../../lib/catalog';
import { buildCanonicalMetadata } from '../../lib/canonical';

type CompareModelItem = {
  slug: string;
  name: string;
  provider: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M: number | null;
  contextWindow: string | null;
  score: number | null;
  tokPerSec: number | null;
};

const MODELS_LIST = ALL_MODELS as unknown as CompareModelItem[];

function parsePair(pair: string): [CompareModelItem | undefined, CompareModelItem | undefined] {
  const parts = pair.split('-vs-');
  if (parts.length !== 2) return [undefined, undefined];
  const [slugA, slugB] = parts;
  return [
    MODELS_LIST.find((m) => m.slug === slugA),
    MODELS_LIST.find((m) => m.slug === slugB),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const [a, b] = parsePair(pair);
  if (!a || !b) {
    return buildCanonicalMetadata({
      title: 'Compare Models | PromptBill',
      description: 'Side-by-side LLM API pricing and benchmark comparison on PromptBill.',
      path: `/compare/${pair}`,
      noIndex: true,
    });
  }

  return buildCanonicalMetadata({
    title: `${a.name} vs ${b.name} API Pricing & Benchmarks | PromptBill`,
    description: `Side-by-side comparison of ${a.name} and ${b.name}: input/output token cost per 1M tokens, context window, and benchmark performance.`,
    path: `/compare/${a.slug}-vs-${b.slug}`,
  });
}

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const [a, b] = parsePair(pair);
  if (!a || !b) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1>{a.name} vs {b.name}</h1>
      <CompareAnswerBlock modelA={a} modelB={b} />
    </main>
  );
}
