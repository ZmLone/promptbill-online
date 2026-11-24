'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS, getAllProviderSlugs, type CatalogModel } from '../lib/catalog';
import { Search, ArrowUpDown } from 'lucide-react';

type SortKey = 'score' | 'value' | 'price' | 'elo' | 'tokPerSec';

function fmtNum(val: number | null, digits = 1): string {
  return typeof val === 'number' && Number.isFinite(val) ? val.toFixed(digits) : 'N/A';
}

function fmtPrice(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

function computeScorePerDollar(m: CatalogModel): number | null {
  if (typeof m.score !== 'number' || !Number.isFinite(m.score)) return null;
  if (typeof m.outputPer1M !== 'number' || !Number.isFinite(m.outputPer1M) || m.outputPer1M <= 0) {
    return null;
  }
  return Number((m.score / m.outputPer1M).toFixed(2));
}

function blendedPrice(m: CatalogModel): number | null {
  if (
    typeof m.inputPer1M !== 'number' ||
    !Number.isFinite(m.inputPer1M) ||
    typeof m.outputPer1M !== 'number' ||
    !Number.isFinite(m.outputPer1M)
  ) {
    return null;
  }
  return (m.inputPer1M + m.outputPer1M) / 2;
}

function compareNullable(a: number | null, b: number | null, ascending: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return ascending ? a - b : b - a;
}

export function LeaderboardTableClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<'All' | 'Open' | 'Closed' | 'Unavailable'>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<'All' | 'Verified' | 'Estimated' | 'Unavailable'>('All');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const providers = useMemo(() => getAllProviderSlugs(), []);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_MODELS
      .filter((m) => {
        if (q) {
          const hay = [m.name, m.provider, m.bestFor ?? '', m.family ?? ''].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (licenseFilter === 'Unavailable' && m.license !== null) return false;
        if ((licenseFilter === 'Open' || licenseFilter === 'Closed') && m.license !== licenseFilter) {
          return false;
        }
        if (evidenceFilter !== 'All' && m.evidence !== evidenceFilter) return false;
        return true;
      })
      .map((m) => ({
        model: m,
        scorePerDollar: computeScorePerDollar(m),
        avgPrice: blendedPrice(m),
      }))
      .sort((a, b) => {
        if (sortBy === 'score') return compareNullable(a.model.score, b.model.score, sortAsc);
        if (sortBy === 'value') return compareNullable(a.scorePerDollar, b.scorePerDollar, sortAsc);
        if (sortBy === 'price') return compareNullable(a.avgPrice, b.avgPrice, sortAsc);
        if (sortBy === 'elo') return compareNullable(a.model.elo, b.model.elo, sortAsc);
        return compareNullable(a.model.tokPerSec, b.model.tokPerSec, sortAsc);
      });
  }, [searchQuery, licenseFilter, evidenceFilter, sortBy, sortAsc]);

  const toggleSort = (col: SortKey) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(col === 'price');
    }
  };

  return (
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
            onChange={(e) =>
              setEvidenceFilter(
                e.target.value as 'All' | 'Verified' | 'Estimated' | 'Unavailable'
              )
            }
            aria-label="Filter by evidence"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
          >
            <option value="All">All Evidence</option>
            <option value="Verified">Verified</option>
            <option value="Estimated">Estimated</option>
            <option value="Unavailable">Unavailable</option>
          </select>
          <select
            value={licenseFilter}
            onChange={(e) =>
              setLicenseFilter(e.target.value as 'All' | 'Open' | 'Closed' | 'Unavailable')
            }
            aria-label="Filter by license"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
          >
            <option value="All">All Licenses</option>
            <option value="Closed">Closed</option>
            <option value="Open">Open Weight</option>
            <option value="Unavailable">Unspecified (N/A)</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value as SortKey;
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

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map(({ model: m, scorePerDollar }) => (
          <article
            key={m.id}
            className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {m.rank !== null ? `#${m.rank}` : 'N/A'}
                  </span>
                  <Link
                    href={`/models/${m.slug}`}
                    className="text-base font-bold text-slate-900 underline-offset-2 hover:underline"
                  >
                    {m.name}
                  </Link>
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {m.evidence}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  <Link href={`/providers/${m.providerSlug}`} className="underline">
                    {m.provider}
                  </Link>{' '}
                  · {m.license ?? 'N/A'} · {m.contextWindow ?? 'N/A'} context
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-lg font-bold text-slate-900">
                  {fmtNum(m.score, 1)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-center font-mono text-xs">
              <div>
                <div className="text-[10px] font-sans text-slate-500">In / Out ($/1M)</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {fmtPrice(m.inputPer1M)}/{fmtPrice(m.outputPer1M)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-500">Speed</div>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-500">Value (Score/$)</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {fmtNum(scorePerDollar, 1)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 line-clamp-1">{m.bestFor ?? 'N/A'}</span>
              <Link
                href={`/models/${m.slug}`}
                className="shrink-0 font-semibold text-emerald-700 hover:underline ml-2"
              >
                Specs &amp; Cost -&gt;
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            LLM Leaderboard comparing scores, Score per dollar value ratio, context window size, official API token pricing per 1 million tokens, Elo ratings, and output generation speed in tokens per second.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Rank &amp; Model</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('score')}
                  className="inline-flex items-center gap-1 hover:text-slate-950"
                >
                  Score <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('value')}
                  className="inline-flex items-center gap-1 hover:text-slate-950"
                >
                  Score/$ <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">Context</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('price')}
                  className="inline-flex items-center gap-1 hover:text-slate-950"
                >
                  API Price (In / Out) <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('elo')}
                  className="inline-flex items-center gap-1 hover:text-slate-950"
                >
                  Elo <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3.5 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('tokPerSec')}
                  className="inline-flex items-center gap-1 ml-auto hover:text-slate-950"
                >
                  Speed (Tok/s) <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm">
            {rows.map(({ model: m, scorePerDollar }, idx) => (
              <tr
                key={m.id}
                className={
                  idx % 2 === 0
                    ? 'bg-white hover:bg-emerald-50/40'
                    : 'bg-slate-50/50 hover:bg-emerald-50/40'
                }
              >
                <th scope="row" className="py-3.5 px-3.5 font-normal text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">
                      {m.rank !== null ? `#${m.rank}` : 'N/A'}
                    </span>
                    <Link
                      href={`/models/${m.slug}`}
                      className="font-semibold text-slate-900 hover:text-emerald-700 underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      {m.evidence}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    <Link
                      href={`/providers/${m.providerSlug}`}
                      className="hover:text-slate-900 underline-offset-2 hover:underline"
                    >
                      {m.provider}
                    </Link>
                    {m.bestFor ? ` · ${m.bestFor}` : ''}
                  </div>
                </th>
                <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                  {fmtNum(m.score, 1)}
                </td>
                <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">
                  {fmtNum(scorePerDollar, 1)}
                </td>
                <td className="py-3.5 px-3 font-mono text-xs text-slate-700">
                  {m.contextWindow ?? 'N/A'}
                </td>
                <td className="py-3.5 px-3 font-mono text-xs text-slate-900">
                  {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                </td>
                <td className="py-3.5 px-3 font-mono text-xs text-slate-700">
                  {fmtNum(m.elo, 1)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-xs font-semibold text-emerald-700">
                  {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {providers.map((p) => (
            <Link
              key={p.providerSlug}
              href={`/providers/${p.providerSlug}`}
              className="rounded bg-slate-100 px-2.5 py-1 font-medium text-slate-800 hover:bg-slate-200"
            >
              {p.providerName}
            </Link>
          ))}
        </div>
        <Link href="/compare" className="font-semibold text-emerald-700 hover:underline">
          Head-to-Head Comparisons -&gt;
        </Link>
      </div>
    </section>
  );
}
