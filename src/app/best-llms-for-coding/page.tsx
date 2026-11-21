import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Best LLMs for Coding & Agentic Engineering — Nov 2026',
  description: 'Top LLMs ranked by coding (CO) and agentic (AG) benchmark scores alongside API pricing and speed.',
  alternates: { canonical: 'https://promptbill.online/best-llms-for-coding' },
};

export default function BestLlmsForCodingPage() {
  const sortedByCoding = [...ALL_MODELS].sort((a, b) => b.co - a.co);

  return (
    <SiteShell
      title="Best LLMs for Coding & Agentic Engineering — Nov 2026"
      subtitle="promptbill.online/best-llms-for-coding · Coding & Tool-Use Rankings"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Coding (CO)</th>
                <th className="py-2.5 px-3">Agentic (AG)</th>
                <th className="py-2.5 px-3">Price (In / Out)</th>
                <th className="py-2.5 px-3 text-right">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedByCoding.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:underline">
                      {m.name}
                    </Link>
                    <div className="text-xs text-slate-500">{m.provider}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">{m.co}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">{m.ag}</td>
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
