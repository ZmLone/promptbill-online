import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Fastest LLMs by Tokens/Sec',
  alternates: { canonical: 'https://promptbill.online/fastest-llms-tokens-per-second' },
};

export default function Page() {
  const list = [...ALL_MODELS].sort((a, b) => b.tokPerSec - a.tokPerSec);
  return (
    <SiteShell title="Fastest LLMs by Tokens Per Second" subtitle="promptbill.online/fastest-llms-tokens-per-second">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Fastest LLMs by tokens per second</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3">Speed</th>
              <th scope="col" className="py-3 px-3">Score</th>
              <th scope="col" className="py-3 px-3.5 text-right">Price (In / Out)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {list.map((m, idx) => (
              <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th scope="row" className="py-3 px-3.5 font-normal text-left"><Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 underline">{m.name}</Link></th>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">{m.tokPerSec} tok/s</td>
                <td className="py-3 px-3 font-mono">{m.score.toFixed(1)}</td>
                <td className="py-3 px-3.5 text-right font-mono">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}
