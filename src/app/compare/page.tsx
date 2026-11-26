import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { DynamicCompareClient } from '../../components/DynamicCompareClient';
import { ALL_MODELS } from '../../lib/catalog';

export const metadata: Metadata = {
  title: 'Compare LLMs Side-by-Side (2026) — Benchmark Scores, API Pricing, Speed & Value | PromptBill',
  description:
    'Compare any 2 or more LLMs side by side across composite benchmark scores, Score/$ efficiency, API input/output token rates, throughput (tok/s), and context windows on promptbill.online.',
  alternates: {
    canonical: 'https://promptbill.online/compare',
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

  return (
    <SiteShell
      title="Compare LLMs Side-by-Side"
      subtitle="promptbill.online/compare · Dynamic Multi-Model Benchmark, Pricing & Speed Comparison"
    >
      <DynamicCompareClient
        models={activeModels}
        initialSlugs={requestedSlugs}
      />
    </SiteShell>
  );
}
