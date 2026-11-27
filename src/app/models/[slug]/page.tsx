import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ModelAnswerBlock } from '../../components/ModelAnswerBlock';
import { ALL_MODELS } from '../../lib/catalog';
import { buildCanonicalMetadata } from '../../lib/canonical';

type ModelSlugItem = {
  slug: string;
  name: string;
  provider: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M: number | null;
  contextWindow: string | null;
  score: number | null;
  tokPerSec: number | null;
  evidence?: string | null;
  pricingProvenance?: { status?: string | null } | null;
  benchmarkProvenance?: { status?: string | null } | null;
};

const MODELS_LIST = ALL_MODELS as unknown as ModelSlugItem[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = MODELS_LIST.find((m) => m.slug === slug);
  if (!model) {
    return buildCanonicalMetadata({
      title: 'Model Not Found | PromptBill',
      description: 'Requested model could not be found on PromptBill.',
      path: `/models/${slug}`,
      noIndex: true,
    });
  }

  const pricePart =
    typeof model.inputPer1M === 'number' && typeof model.outputPer1M === 'number'
      ? ` ($${model.inputPer1M.toFixed(2)}/$${model.outputPer1M.toFixed(2)} per 1M tokens)`
      : '';

  return buildCanonicalMetadata({
    title: `${model.name} API Pricing & Benchmarks${pricePart} | PromptBill`,
    description: `Compare ${model.name} by ${model.provider}: per-1M token pricing, ${model.contextWindow ?? 'tracked'} context window, speed, and benchmark score on PromptBill.`,
    path: `/models/${model.slug}`,
  });
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = MODELS_LIST.find((m) => m.slug === slug);
  if (!model) {
    notFound();
  }

  const validInputs = MODELS_LIST
    .map((m) => m.inputPer1M)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  const medianInputPer1M =
    validInputs.length > 0 ? validInputs[Math.floor(validInputs.length / 2)] : null;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1>{model.name}</h1>
      <ModelAnswerBlock
        model={{
          ...model,
          pricingStatus: model.pricingProvenance?.status ?? model.evidence ?? 'Tracked',
          benchmarkStatus: model.benchmarkProvenance?.status ?? 'Tracked',
          medianInputPer1M,
        }}
      />
    </main>
  );
}
