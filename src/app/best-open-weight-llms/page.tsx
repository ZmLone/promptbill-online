import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Best Open-Weight LLMs — Benchmarks, Context & API Pricing',
  description: 'Open-weight LLMs ranked by benchmark score, context window, and token cost.',
  alternates: { canonical: 'https://promptbill.online/best-open-weight-llms' },
};

export default function BestOpenWeightLlmsPage() {
  const openModels = ALL_MODELS.filter((m) => m.license === 'Open').sort((a, b) => b.score - a.score);

  return (
    <SiteShell
      title="Best Open-Weight LLMs — Benchmarks, Context & Pricing"
      subtitle="promptbill.online/best-open-weight-llms · Open-Weight Rankings"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Context</th>
                <th className="py-2.5 px-3">Price (In / Out)</th>
                <th className="py-2.5 px-3 text-right">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {openModels.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:underline">
                      {m.name}
                    </Link>
                    <div className="text-xs text-slate-500">{m.provider}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">{m.score.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{m.contextWindow}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-800">
                    ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                  </td>
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
