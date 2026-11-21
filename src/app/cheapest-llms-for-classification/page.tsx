import React from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export default function Page() {
  const list = [...ALL_MODELS].sort((a, b) => (a.inputPer1M + a.outputPer1M) - (b.inputPer1M + b.outputPer1M));
  return (
    <SiteShell title="Cheapest LLMs for Classification" subtitle="promptbill.online">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Cheapest LLMs for Classification ranked by benchmark score, API pricing, and tokens per second</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3">Score</th>
              <th scope="col" className="py-3 px-3">Coding (CO)</th>
              <th scope="col" className="py-3 px-3">Price (In / Out)</th>
              <th scope="col" className="py-3 px-3.5 text-right">Speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {list.map((m, idx) => (
              <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th scope="row" className="py-3 px-3.5 font-normal text-left">
                  <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 underline-offset-2 hover:underline">{m.name}</Link>
                  <div className="text-xs text-slate-500">{m.provider}</div>
                </th>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                <td className="py-3 px-3 font-mono text-slate-800">{m.co}</td>
                <td className="py-3 px-3 font-mono text-slate-800">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</td>
                <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-700">{m.tokPerSec} tok/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}
