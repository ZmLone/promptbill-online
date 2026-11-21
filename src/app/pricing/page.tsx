import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'API Token Pricing Table',
  alternates: { canonical: 'https://promptbill.online/pricing' },
};

export default function Page() {
  return (
    <SiteShell title="API Token Pricing Table" subtitle="promptbill.online/pricing">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">API Token Pricing per 1 Million Input, Cached Input, and Output Tokens</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3">Input / 1M</th>
              <th scope="col" className="py-3 px-3">Cached / 1M</th>
              <th scope="col" className="py-3 px-3">Output / 1M</th>
              <th scope="col" className="py-3 px-3.5 text-right">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 font-mono">
            {ALL_MODELS.map((m, idx) => (
              <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th scope="row" className="py-3 px-3.5 font-sans font-normal text-left">
                  <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 underline-offset-2 hover:underline">{m.name}</Link>
                  <span className="block text-xs text-slate-500">{m.provider}</span>
                </th>
                <td className="py-3 px-3">${m.inputPer1M.toFixed(2)}</td>
                <td className="py-3 px-3 text-emerald-700">${m.cachedInputPer1M.toFixed(2)}</td>
                <td className="py-3 px-3">${m.outputPer1M.toFixed(2)}</td>
                <td className="py-3 px-3.5 text-right">{m.contextWindow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}
