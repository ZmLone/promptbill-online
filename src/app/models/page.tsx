import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'All LLM Models — Benchmarks, Context Specs, Rate Limits & Cost Calculators',
  description:
    'Browse dedicated pages for every tracked LLM including Claude Fable 5.2, Gemini 4 Neon, GPT-6.2 Astra, DeepSeek V4.1 Flash, and Qwen 3.7 Flash with benchmark breakdowns and cost calculators.',
  alternates: {
    canonical: 'https://promptbill.online/models',
  },
};

export default function ModelsIndexPage() {
  return (
    <SiteShell
      title="All Tracked LLM Models — Specs, Rate Limits & Cost Calculators"
      subtitle="promptbill.online/models · Individual Model Directory"
    >
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_MODELS.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Rank #{m.rank} · {m.provider}</span>
                <span className="font-bold text-emerald-700">Score {m.score.toFixed(1)}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                <Link href={`/models/${m.slug}`} className="hover:text-emerald-700 hover:underline">
                  {m.name}
                </Link>
              </h2>
              <p className="text-xs text-slate-600">{m.bestFor}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700">
                <span>Price (In / Out):</span>
                <span className="font-semibold">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Context / Limits:</span>
                <span>{m.contextWindow} · {m.rpmLimit}</span>
              </div>
              <Link
                href={`/models/${m.slug}`}
                className="mt-2 block w-full rounded-lg bg-slate-900 py-2 text-center font-sans text-xs font-semibold text-white hover:bg-slate-800"
              >
                Open {m.name} Specs &amp; Calculator →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </SiteShell>
  );
}
