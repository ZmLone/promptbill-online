'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';
import { SiteShell } from '../components/SiteShell';
import { Search, ArrowUpDown } from 'lucide-react';

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const providers = useMemo(() => getAllProviderSlugs(), []);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_MODELS
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q))
      .map((m) => ({ model: m, scorePerDollar: m.outputPer1M > 0 ? Number((m.score / m.outputPer1M).toFixed(1)) : m.score }))
      .sort((a, b) => {
        let va = 0, vb = 0;
        if (sortBy === 'score') { va = a.model.score; vb = b.model.score; }
        else if (sortBy === 'value') { va = a.scorePerDollar; vb = b.scorePerDollar; }
        else if (sortBy === 'price') { va = (a.model.inputPer1M + a.model.outputPer1M) / 2; vb = (b.model.inputPer1M + b.model.outputPer1M) / 2; }
        else if (sortBy === 'elo') { va = a.model.elo; vb = b.model.elo; }
        else if (sortBy === 'tokPerSec') { va = a.model.tokPerSec; vb = b.model.tokPerSec; }
        return sortAsc ? va - vb : vb - va;
      });
  }, [searchQuery, sortBy, sortAsc]);

  const toggleSort = (col: 'score' | 'value' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(col === 'price'); }
  };

  return (
    <SiteShell title="LLM Leaderboard Rankings & Value Ratio — November 2026" subtitle="promptbill.online / · Benchmarks, Head-to-Head Comparisons & Pricing">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search model or provider..." className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900" />
          </div>
          <Link href="/compare" className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Browse 190 Head-to-Head Comparisons →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3"><button type="button" onClick={() => toggleSort('score')} className="inline-flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-2.5 px-3"><button type="button" onClick={() => toggleSort('value')} className="inline-flex items-center gap-1">Score/$ <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-2.5 px-3">Context</th>
                <th className="py-2.5 px-3"><button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-1">Price (In / Out) <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-2.5 px-3"><button type="button" onClick={() => toggleSort('elo')} className="inline-flex items-center gap-1">Elo <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-2.5 px-3 font-mono">AG</th><th className="py-2.5 px-3 font-mono">CO</th><th className="py-2.5 px-3 font-mono">RE</th><th className="py-2.5 px-3 font-mono">MM</th><th className="py-2.5 px-3 font-mono">KN</th><th className="py-2.5 px-3 font-mono">ML</th><th className="py-2.5 px-3 font-mono">IF</th><th className="py-2.5 px-3 font-mono">MA</th>
                <th className="py-2.5 px-3 text-right"><button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex items-center gap-1 ml-auto">Tok/s <ArrowUpDown className="w-3 h-3" /></button></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map(({ model: m, scorePerDollar }) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700 underline-offset-2 hover:underline">{m.name}</Link>
                    <div className="text-[11px] text-slate-500 mt-0.5"><Link href={`/providers/${m.providerSlug}`} className="hover:underline">{m.provider}</Link> · {m.bestFor}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-emerald-700">{scorePerDollar.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{m.contextWindow}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{m.elo.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono">{m.ag}</td><td className="py-3 px-3 font-mono">{m.co}</td><td className="py-3 px-3 font-mono">{m.re}</td><td className="py-3 px-3 font-mono">{m.mm}</td><td className="py-3 px-3 font-mono">{m.kn}</td><td className="py-3 px-3 font-mono">{m.ml}</td><td className="py-3 px-3 font-mono">{m.if}</td><td className="py-3 px-3 font-mono">{m.ma}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">{m.tokPerSec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
          {providers.map((p) => (
            <Link key={p.providerSlug} href={`/providers/${p.providerSlug}`} className="rounded bg-slate-100 px-2.5 py-1 font-medium text-slate-800 hover:bg-slate-200">{p.providerName}</Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
