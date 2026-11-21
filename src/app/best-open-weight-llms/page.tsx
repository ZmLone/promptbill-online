import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Best Open-Weight LLMs',
  alternates: { canonical: 'https://promptbill.online/best-open-weight-llms' },
};

export default function Page() {
  const list = ALL_MODELS.filter((m) => m.license === 'Open');
  return (
    <SiteShell title="Best Open-Weight LLMs" subtitle="promptbill.online/best-open-weight-llms">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Best open-weight LLMs</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3">Score</th>
              <th scope="col" className="py-3 px-3">Context</th>
              <th scope="col" className="py-3 px-3">Price (In / Out)</th>
              <th scope="col" className="py-3 px-3.5 text-right">Speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {list.map((m, idx) => (
              <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th scope="row" className="py-3 px-3.5 font-normal text-left"><Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 underline">{m.name}</Link></th>
                <td className="py-3 px-3 font-mono font-bold">{m.score.toFixed(1)}</td>
                <td className="py-3 px-3 font-mono">{m.contextWindow}</td>
                <td className="py-3 px-3 font-mono">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</td>
                <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-700">{m.tokPerSec} tok/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}
