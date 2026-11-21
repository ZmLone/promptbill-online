import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Cheapest LLMs for High-Volume Classification & Routing',
  description: 'Lowest-cost LLMs per 1M input and output tokens for high-volume classification and extraction.',
  alternates: { canonical: 'https://promptbill.online/cheapest-llms-for-classification' },
};

export default function CheapestClassificationPage() {
  const sortedByCost = [...ALL_MODELS].sort(
    (a, b) => a.inputPer1M + a.outputPer1M - (b.inputPer1M + b.outputPer1M)
  );

  return (
    <SiteShell
      title="Cheapest LLMs for High-Volume Classification & Routing"
      subtitle="promptbill.online/cheapest-llms-for-classification · Lowest Token Cost"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Input / Cached / Output ($/1M)</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3 text-right">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedByCost.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:underline">
                      {m.name}
                    </Link>
                    <div className="text-xs text-slate-500">{m.provider}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-bold text-emerald-700">
                    ${m.inputPer1M.toFixed(2)} / ${m.cachedInputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">{m.score.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">{m.tokPerSec} tok/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
