'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';
import { SiteShell } from '../components/SiteShell';
import { ScoreLegendAndVerified, PRICES_LAST_VERIFIED_DATE } from '../components/ScoreLegendAndVerified';
import { Search, ArrowUpDown } from 'lucide-react';

const COLUMN_TOOLTIPS: Record<string, string> = {
  AG: 'AG = Agentic: Multi-step tool use & autonomous task execution',
  CO: 'CO = Coding: Code generation, debugging & repository reasoning',
  RE: 'RE = Reasoning: Logic, multi-hop deduction & complex problem solving',
  MM: 'MM = Multimodal: Vision, document & cross-modal understanding',
  KN: 'KN = Knowledge: Broad factual recall & domain accuracy',
  ML: 'ML = Multilingual: Non-English fluency & cross-lingual comprehension',
  IF: 'IF = Instruction Following: Constraint adherence & structured output reliability',
  MA: 'MA = Math: Quantitative & mathematical reasoning accuracy',
};

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const providers = useMemo(() => getAllProviderSlugs(), []);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_MODELS
      .filter((m) => {
        if (q && !m.name.toLowerCase().includes(q) && !m.provider.toLowerCase().includes(q) && !m.bestFor.toLowerCase().includes(q)) {
          return false;
        }
        if (licenseFilter !== 'All' && m.license !== licenseFilter) return false;
        if (evidenceFilter !== 'All' && m.evidence !== evidenceFilter) return false;
        return true;
      })
      .map((m) => ({
        model: m,
        scorePerDollar: m.outputPer1M > 0 ? Number((m.score / m.outputPer1M).toFixed(1)) : m.score,
      }))
      .sort((a, b) => {
        let va = 0;
        let vb = 0;
        if (sortBy === 'score') { va = a.model.score; vb = b.model.score; }
        else if (sortBy === 'value') { va = a.scorePerDollar; vb = b.scorePerDollar; }
        else if (sortBy === 'price') { va = (a.model.inputPer1M + a.model.outputPer1M) / 2; vb = (b.model.inputPer1M + b.model.outputPer1M) / 2; }
        else if (sortBy === 'elo') { va = a.model.elo; vb = b.model.elo; }
        else if (sortBy === 'tokPerSec') { va = a.model.tokPerSec; vb = b.model.tokPerSec; }
        return sortAsc ? va - vb : vb - va;
      });
  }, [searchQuery, licenseFilter, evidenceFilter, sortBy, sortAsc]);

  const toggleSort = (col: 'score' | 'value' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(col === 'price'); }
  };

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Speed"
      subtitle={`promptbill.online / · Prices last verified: ${PRICES_LAST_VERIFIED_DATE}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider..."
              aria-label="Search models"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              aria-label="Filter by evidence"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
            >
              <option value="All">All Evidence (Supported &amp; Estimated)</option>
              <option value="Supported">Supported</option>
              <option value="Estimated">Estimated</option>
            </select>
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              aria-label="Filter by license"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
            >
              <option value="All">All Licenses</option>
              <option value="Closed">Closed</option>
              <option value="Open">Open Weight</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as 'score' | 'value' | 'price' | 'elo' | 'tokPerSec';
                setSortBy(val);
                setSortAsc(val === 'price');
              }}
              aria-label="Sort models by"
              className="md:hidden rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 font-medium"
            >
              <option value="score">Sort: Benchmark Score</option>
              <option value="value">Sort: Best Score/$</option>
              <option value="price">Sort: Lowest Price</option>
              <option value="tokPerSec">Sort: Fastest Tok/s</option>
              <option value="elo">Sort: Highest Elo</option>
            </select>
          </div>
        </div>

        {/* MOBILE CARD LAYOUT */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {rows.map(({ model: m, scorePerDollar }) => (
            <article key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">#{m.rank}</span>
                    <Link href={`/models/${m.slug}`} className="text-base font-bold text-slate-900 underline-offset-2 hover:underline">
                      {m.name}
                    </Link>
                    <span
                      title={
                        m.evidence === 'Supported'
                          ? 'Supported: directly verified benchmark & pricing coverage'
                          : 'Estimated: derived or projected benchmark/pricing tier'
                      }
                      className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                    >
                      {m.evidence}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    <Link href={`/providers/${m.providerSlug}`} className="underline">
                      {m.provider}
                    </Link>{' '}
                    · {m.license} · {m.contextWindow} context
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-lg font-bold text-slate-900">{m.score.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-center font-mono text-xs">
                <div>
                  <div className="text-[10px] font-sans text-slate-500">In / Out ($/1M)</div>
                  <div className="font-bold text-slate-900 mt-0.5">${m.inputPer1M.toFixed(2)}/${m.outputPer1M.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-500">Speed</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{m.tokPerSec} tok/s</div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-500">Value (Score/$)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{scorePerDollar.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-700">
                <span title={COLUMN_TOOLTIPS.AG} className="rounded bg-white border border-slate-200 px-2 py-0.5">AG {m.ag}</span>
                <span title={COLUMN_TOOLTIPS.CO} className="rounded bg-white border border-slate-200 px-2 py-0.5">CO {m.co}</span>
                <span title={COLUMN_TOOLTIPS.RE} className="rounded bg-white border border-slate-200 px-2 py-0.5">RE {m.re}</span>
                <span title={COLUMN_TOOLTIPS.MM} className="rounded bg-white border border-slate-200 px-2 py-0.5">MM {m.mm}</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">Elo {m.elo.toFixed(0)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500 line-clamp-1">{m.bestFor}</span>
                <Link href={`/models/${m.slug}`} className="shrink-0 font-semibold text-emerald-700 hover:underline ml-2">
                  Specs &amp; Cost →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* DESKTOP SEMANTIC TABLE */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              LLM Leaderboard comparing composite benchmark scores, Score per dollar value ratio, context window size, API token pricing per 1 million tokens, Elo ratings, category scores (AG Agentic, CO Coding, RE Reasoning, MM Multimodal, KN Knowledge, ML Multilingual, IF Instruction Following, MA Math), and output generation speed in tokens per second.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
                <th scope="col" className="py-3 px-3.5">Rank &amp; Model</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('score')} className="inline-flex items-center gap-1 hover:text-slate-950">
                    Score <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('value')} className="inline-flex items-center gap-1 hover:text-slate-950">
                    Score/$ <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">Context</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-1 hover:text-slate-950">
                    API Price (In / Out) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('elo')} className="inline-flex items-center gap-1 hover:text-slate-950">
                    Elo <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                {(['AG', 'CO', 'RE', 'MM', 'KN', 'ML', 'IF', 'MA'] as const).map((code) => (
                  <th key={code} scope="col" title={COLUMN_TOOLTIPS[code]} className="py-3 px-2.5 font-mono cursor-help">
                    {code}
                  </th>
                ))}
                <th scope="col" className="py-3 px-3.5 text-right">
                  <button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex items-center gap-1 ml-auto hover:text-slate-950">
                    Speed (Tok/s) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm">
              {rows.map(({ model: m, scorePerDollar }, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-slate-50/50 hover:bg-emerald-50/40'}>
                  <th scope="row" className="py-3.5 px-3.5 font-normal text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500">#{m.rank}</span>
                      <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span
                        title={
                          m.evidence === 'Supported'
                            ? 'Supported: directly verified benchmark & pricing coverage'
                            : 'Estimated: derived or projected benchmark/pricing tier'
                        }
                        className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 cursor-help"
                      >
                        {m.evidence}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      <Link href={`/providers/${m.providerSlug}`} className="hover:text-slate-900 underline-offset-2 hover:underline">
                        {m.provider}
                      </Link>{' '}
                      · {m.bestFor}
                    </div>
                  </th>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">{scorePerDollar.toFixed(1)}</td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-700">{m.contextWindow}</td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-900">
                    ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-700">{m.elo.toFixed(1)}</td>
                  <td title={COLUMN_TOOLTIPS.AG} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ag}</td>
                  <td title={COLUMN_TOOLTIPS.CO} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.co}</td>
                  <td title={COLUMN_TOOLTIPS.RE} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.re}</td>
                  <td title={COLUMN_TOOLTIPS.MM} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.mm}</td>
                  <td title={COLUMN_TOOLTIPS.KN} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.kn}</td>
                  <td title={COLUMN_TOOLTIPS.ML} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ml}</td>
                  <td title={COLUMN_TOOLTIPS.IF} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.if}</td>
                  <td title={COLUMN_TOOLTIPS.MA} className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ma}</td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-xs font-semibold text-emerald-700">
                    {m.tokPerSec} tok/s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend, Verification Timestamp, Methodology Link & API Price Drop Changelog */}
        <ScoreLegendAndVerified showChangelog={true} />

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {providers.map((p) => (
              <Link key={p.providerSlug} href={`/providers/${p.providerSlug}`} className="rounded bg-slate-100 px-2.5 py-1 font-medium text-slate-800 hover:bg-slate-200">
                {p.providerName}
              </Link>
            ))}
          </div>
          <Link href="/compare" className="font-semibold text-emerald-700 hover:underline">
            Explore all 190 Head-to-Head Comparisons →
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
