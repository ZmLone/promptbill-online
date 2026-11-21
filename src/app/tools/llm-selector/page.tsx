import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export const metadata: Metadata = {
  title: 'LLM Selector Tool',
  alternates: { canonical: 'https://promptbill.online/tools/llm-selector' },
};

export default function LlmSelectorPage() {
  const picks = [...ALL_MODELS].sort((a, b) => b.score - a.score).slice(0, 6);
  return (
    <SiteShell title="LLM Selector" subtitle="promptbill.online/tools/llm-selector">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {picks.map((m) => (
          <Link key={m.id} href={`/models/${m.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-400">
            <div className="font-bold text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-600 mt-1">{m.bestFor}</div>
            <div className="mt-2 font-mono text-xs text-emerald-700">Score {m.score} · ${m.inputPer1M}/${m.outputPer1M}</div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
