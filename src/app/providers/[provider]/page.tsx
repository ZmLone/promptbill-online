'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ALL_MODELS, getModelsByProviderSlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export default function ProviderHubPage() {
  const params = useParams<{ provider: string }>();
  const slug = params?.provider || 'anthropic';
  const matched = getModelsByProviderSlug(slug);
  const providerModels = matched.length > 0 ? matched : ALL_MODELS;
  const providerTitle = providerModels[0]?.provider || 'Provider';

  return (
    <SiteShell
      title={`${providerTitle} Models — Pricing, Context & Benchmarks`}
      subtitle={`promptbill.online/providers/${slug} · Provider Hub`}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerModels.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Rank #{m.rank}</span>
                <span className="font-bold text-emerald-700">Score {m.score.toFixed(1)}</span>
              </div>
              <Link href={`/models/${m.slug}`} className="block text-base font-bold text-slate-900 hover:underline">
                {m.name}
              </Link>
              <p className="text-xs text-slate-600">{m.bestFor}</p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-xs text-slate-800">
                <span>${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</span>
                <span>{m.tokPerSec} tok/s</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
