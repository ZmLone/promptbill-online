import type { Metadata } from 'next';
import Link from 'next/link';
import { FALLBACK_MODELS } from '@/data/fallbackModels';

export const metadata: Metadata = {
  title: 'All 231 AI Model API Cost Comparisons (2026)',
  description:
    'Browse all 231 side-by-side LLM API pricing comparisons across OpenAI, Anthropic, Google, DeepSeek, xAI, Qwen, Mistral, and Groq.',
  alternates: {
    canonical: '/compare',
  },
};

export default function CompareDirectoryPage() {
  const totalPairs =
    (FALLBACK_MODELS.length * (FALLBACK_MODELS.length - 1)) / 2;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
      <Link
        href="/"
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        ← Back to Cost Simulator
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
        All {totalPairs} AI Model Cost Comparisons
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Select any model pair below to compare monthly API bills, input/output
        token rates, context windows, prompt caching discounts, and batch API
        savings.
      </p>

      <div className="mt-10 space-y-10">
        {FALLBACK_MODELS.map((modelA, i) => {
          const opponents = FALLBACK_MODELS.slice(i + 1);
          if (opponents.length === 0) return null;

          return (
            <section
              key={modelA.slug}
              className="border-t border-slate-800 pt-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-white">
                  {modelA.name} Comparisons
                </h2>
                <span className="font-mono text-xs text-slate-400">
                  {modelA.provider} · ${modelA.inputPer1M.toFixed(2)} / $
                  {modelA.outputPer1M.toFixed(2)} per 1M tokens
                </span>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {opponents.map((modelB) => (
                  <Link
                    key={`${modelA.slug}-vs-${modelB.slug}`}
                    href={`/compare/${modelA.slug}-vs-${modelB.slug}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                  >
                    {modelA.name} vs {modelB.name} →
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
