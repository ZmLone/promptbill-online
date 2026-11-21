import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'All Tracked LLM Models',
  alternates: { canonical: 'https://promptbill.online/models' },
};

export default function Page() {
  return (
    <SiteShell title="All Tracked Models" subtitle="promptbill.online/models">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_MODELS.map((m) => (
          <Link key={m.id} href={`/models/${m.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-400">
            <div className="font-bold text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{m.provider} · {m.contextWindow}</div>
            <div className="mt-2 font-mono text-xs text-emerald-700">${m.inputPer1M}/${m.outputPer1M} · {m.tokPerSec} tok/s</div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
