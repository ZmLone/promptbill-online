import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getModelsByProviderSlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider } = await params;
  const matched = getModelsByProviderSlug(provider);
  const titleName = matched[0]?.provider || 'Provider';
  return {
    title: `${titleName} LLM Models — Pricing & Benchmarks`,
    description: `Models and API pricing entries associated with ${titleName} on PromptBill.`,
    alternates: { canonical: `https://promptbill.online/providers/${provider}` },
  };
}

export default async function ProviderHubPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  const matched = getModelsByProviderSlug(provider);
  const list = matched.length > 0 ? matched : ALL_MODELS;
  const headingName = matched[0]?.provider || 'All Tracked Models';

  return (
    <SiteShell
      title={`${headingName} Models`}
      subtitle={`promptbill.online/providers/${provider}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {list.map((m) => (
          <Link
            key={m.id}
            href={`/models/${m.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-500/70 transition-colors"
          >
            <div className="font-bold text-slate-900">{m.name}</div>
            <div className="mt-1 font-mono text-xs text-slate-700">
              {m.inputPer1M !== null && m.outputPer1M !== null
                ? `$${m.inputPer1M.toFixed(2)}/$${m.outputPer1M.toFixed(2)}`
                : 'Price: N/A'}{' '}
              · {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'Speed: N/A'} ·{' '}
              {m.score !== null ? `Score ${m.score.toFixed(1)}` : 'Score N/A'}
            </div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
