'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { MODELS } from '../data/models';

type SortKey = 'score' | 'value' | 'price' | 'speed' | 'elo';

function sanitizeBlurb(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/#1\s+benchmark\s+score\s*;?\s*/gi, 'Top-tier benchmark performance; ')
    .replace(/#1\s+Score\/\$\s+ratio\s*/gi, 'Leading Score/$ efficiency ')
    .replace(/#1\s+overall\s*/gi, 'Leading ')
    .replace(/;\s*$/g, '')
    .trim();
}

function normalizeLicense(raw: string | null | undefined): 'Closed' | 'Open Weight' {
  if (!raw) return 'Closed';
  const v = raw.trim();
  if (!v || /^n\/?a$/i.test(v) || /^unspecified$/i.test(v)) return 'Closed';
  if (/open/i.test(v) || /apache|mit|llama|gemma|qwen|deepseek|mistral/i.test(v)) {
    return 'Open Weight';
  }
  return 'Closed';
}

function normalizeLifecycle(raw: string | null | undefined): 'Active' | 'Preview' | 'Deprecated' | 'Legacy' {
  const v = (raw || 'Active').trim().toLowerCase();
  if (v === 'preview') return 'Preview';
  if (v === 'deprecated') return 'Deprecated';
  if (v === 'legacy') return 'Legacy';
  return 'Active';
}

function normalizeEvidence(m: {
  evidence?: string | null;
  pricingProvenance?: { status?: string | null } | null;
  benchmarkProvenance?: { status?: string | null } | null;
}): 'Verified' | 'Estimated' | 'Unavailable' {
  const ev = (m.evidence || '').trim().toLowerCase();
  const pr = (m.pricingProvenance?.status || '').trim().toLowerCase();
  const bm = (m.benchmarkProvenance?.status || '').trim().toLowerCase();
  if (ev === 'verified' || (pr === 'verified' && bm === 'verified')) return 'Verified';
  if (ev === 'unavailable') return 'Unavailable';
  return 'Estimated';
}

function computeScorePerDollar(score: number | null | undefined, outputPer1M: number | null | undefined): number | null {
  if (typeof score !== 'number' || typeof outputPer1M !== 'number' || outputPer1M <= 0) return null;
  return Number((score / outputPer1M).toFixed(1));
}

function formatPrice(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  return val < 1 ? `$${val.toFixed(2)}` : `$${val.toFixed(2)}`;
}

export function LeaderboardTableClient({
  lastVerifiedDate,
}: {
  lastVerifiedDate?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'Verified' | 'Estimated' | 'Unavailable'>('ALL');
  const [licenseFilter, setLicenseFilter] = useState<'ALL' | 'Closed' | 'Open Weight'>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<'ALL' | 'Active' | 'Preview' | 'Deprecated' | 'Legacy'>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const enrichedModels = useMemo(() => {
    return MODELS.filter((m) => !m.archived).map((m) => {
      const evidenceNorm = normalizeEvidence(m);
      const licenseNorm = normalizeLicense(m.license);
      const lifecycleNorm = normalizeLifecycle(m.lifecycleStatus);
      const scorePerDollar = computeScorePerDollar(m.score, m.outputPer1M);
      const cleanSummary = sanitizeBlurb(m.bestFor || m.notes);
      return {
        ...m,
        evidenceNorm,
        licenseNorm,
        lifecycleNorm,
        scorePerDollar,
        cleanSummary,
      };
    });
  }, []);

  const hasAnyElo = useMemo(
    () => enrichedModels.some((m) => typeof m.elo === 'number' && Number.isFinite(m.elo)),
    [enrichedModels]
  );

  const verifiedCount = useMemo(
    () => enrichedModels.filter((m) => m.evidenceNorm === 'Verified').length,
    [enrichedModels]
  );

  const formattedVerifiedDate = useMemo(() => {
    const raw = lastVerifiedDate || new Date().toISOString().slice(0, 10);
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [lastVerifiedDate]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = enrichedModels.filter((m) => {
      if (evidenceFilter !== 'ALL' && m.evidenceNorm !== evidenceFilter) return false;
      if (licenseFilter !== 'ALL' && m.licenseNorm !== licenseFilter) return false;
      if (lifecycleFilter !== 'ALL' && m.lifecycleNorm !== lifecycleFilter) return false;
      if (q) {
        const hay = `${m.name} ${m.slug} ${m.provider} ${m.licenseNorm} ${m.lifecycleNorm} ${m.cleanSummary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'desc' ? -1 : 1;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'score') {
        const av = a.score ?? -Infinity;
        const bv = b.score ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'value') {
        const av = a.scorePerDollar ?? -Infinity;
        const bv = b.scorePerDollar ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'price') {
        const av = a.outputPer1M ?? Infinity;
        const bv = b.outputPer1M ?? Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'speed') {
        const av = a.tokPerSec ?? -Infinity;
        const bv = b.tokPerSec ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'elo') {
        const av = a.elo ?? -Infinity;
        const bv = b.elo ?? -Infinity;
        return (av - bv) * dir;
      }
      return 0;
    });
  }, [enrichedModels, searchQuery, evidenceFilter, licenseFilter, lifecycleFilter, sortBy, sortDir]);

  const highlights = useMemo(() => {
    const byScore = [...enrichedModels].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
    const byValue = [...enrichedModels].sort((a, b) => (b.scorePerDollar ?? -1) - (a.scorePerDollar ?? -1))[0];
    const bySpeed = [...enrichedModels].sort((a, b) => (b.tokPerSec ?? -1) - (a.tokPerSec ?? -1))[0];
    return { byScore, byValue, bySpeed };
  }, [enrichedModels]);

  function handleSortToggle(nextKey: SortKey) {
    if (sortBy === nextKey) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(nextKey);
      setSortDir(nextKey === 'price' ? 'asc' : 'desc');
    }
  }

  return (
    <section className="space-y-6" aria-label="LLM Benchmark, Pricing and Throughput Leaderboard">
      {/* GEO Freshness & Provenance Trust Banner */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-white to-slate-50 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            Data Last Verified: {formattedVerifiedDate}
          </span>
          <span className="text-slate-600">
            Showing <strong className="font-semibold text-slate-900">{verifiedCount}</strong> of{' '}
            <strong className="font-semibold text-slate-900">{enrichedModels.length}</strong> active models with verified official API rates &amp; benchmarks.
          </span>
        </div>
        <div className="text-[11px] font-medium text-slate-600">
          Value metric: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">Score/$ = Score ÷ Output $/1M</code>
        </div>
      </div>

      {/* Executive Summary Cards (GEO Direct-Answer & Quick Scan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {highlights.byScore ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>#1 Benchmark Score</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                {highlights.byScore.score} / 100
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.byScore.slug}`}
                className="text-base font-bold text-slate-900 hover:text-emerald-800"
              >
                {highlights.byScore.name}
              </Link>
              <span className="text-xs font-mono text-slate-600">
                {formatPrice(highlights.byScore.inputPer1M)} / {formatPrice(highlights.byScore.outputPer1M)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {highlights.byScore.provider} · {highlights.byScore.licenseNorm} · {highlights.byScore.contextWindow || 'Standard'} context
            </p>
          </div>
        ) : null}

        {highlights.byValue ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>#1 Score/$ Efficiency</span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-800">
                {highlights.byValue.scorePerDollar} pts/$
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.byValue.slug}`}
                className="text-base font-bold text-slate-900 hover:text-emerald-800"
              >
                {highlights.byValue.name}
              </Link>
              <span className="text-xs font-mono text-slate-600">
                {formatPrice(highlights.byValue.inputPer1M)} / {formatPrice(highlights.byValue.outputPer1M)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {highlights.byValue.provider} · Score {highlights.byValue.score} · {highlights.byValue.tokPerSec ?? '—'} tok/s
            </p>
          </div>
        ) : null}

        {highlights.bySpeed ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>#1 Output Throughput</span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">
                {highlights.bySpeed.tokPerSec} tok/s
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.bySpeed.slug}`}
                className="text-base font-bold text-slate-900 hover:text-emerald-800"
              >
                {highlights.bySpeed.name}
              </Link>
              <span className="text-xs font-mono text-slate-600">
                {formatPrice(highlights.bySpeed.inputPer1M)} / {formatPrice(highlights.bySpeed.outputPer1M)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {highlights.bySpeed.provider} · Score {highlights.bySpeed.score} · {highlights.bySpeed.licenseNorm}
            </p>
          </div>
        ) : null}
      </div>

      {/* Filter & Sort Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, provider, or workload (e.g. Claude, GPT-6.2, coding, 1M)..."
              aria-label="Search models or providers"
              className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value as typeof evidenceFilter)}
              aria-label="Filter by provenance status"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Evidence</option>
              <option value="Verified">Verified Only</option>
              <option value="Estimated">Estimated</option>
              <option value="Unavailable">Unavailable</option>
            </select>

            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value as typeof licenseFilter)}
              aria-label="Filter by license type"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Licenses</option>
              <option value="Closed">Closed</option>
              <option value="Open Weight">Open Weight</option>
            </select>

            <select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value as typeof lifecycleFilter)}
              aria-label="Filter by model lifecycle status"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Lifecycles</option>
              <option value="Active">Active</option>
              <option value="Preview">Preview</option>
              <option value="Deprecated">Deprecated</option>
              <option value="Legacy">Legacy</option>
            </select>
          </div>
        </div>

        {/* Quick Sort Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 mr-1">Sort by:</span>
            {[
              { id: 'score', label: 'Benchmark Score' },
              { id: 'value', label: 'Best Score/$' },
              { id: 'price', label: 'Lowest Price' },
              { id: 'speed', label: 'Fastest Tok/s' },
              ...(hasAnyElo ? [{ id: 'elo', label: 'Highest Elo' }] : []),
            ].map((pill) => {
              const active = sortBy === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleSortToggle(pill.id as SortKey)}
                  className={`min-h-[34px] rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {pill.label}{' '}
                  {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </button>
              );
            })}
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredAndSorted.length}</strong> models · Ranked{' '}
            <strong className="text-slate-900">1–{filteredAndSorted.length}</strong> by active sort
          </div>
        </div>
      </div>

      {/* Desktop Structured Table (Single Source of Truth — No Duplicate Hidden Card Text) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 pl-5 pr-3">Rank &amp; Model</th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSortToggle('score')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  Score <span>{sortBy === 'score' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSortToggle('value')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  Score/$ <span>{sortBy === 'value' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </th>
              <th className="py-3.5 px-3">Context</th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSortToggle('price')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  API Price (In / Out) <span>{sortBy === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </th>
              {hasAnyElo ? (
                <th className="py-3.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSortToggle('elo')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Elo <span>{sortBy === 'elo' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                  </button>
                </th>
              ) : null}
              <th className="py-3.5 pl-3 pr-5 text-right">
                <button
                  type="button"
                  onClick={() => handleSortToggle('speed')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900"
                >
                  Speed (Tok/s) <span>{sortBy === 'speed' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm">
            {filteredAndSorted.map((m, idx) => {
              const dynamicRank = idx + 1;
              return (
                <tr
                  key={m.slug}
                  className="group transition-colors hover:bg-slate-50/90"
                >
                  <td className="py-4 pl-5 pr-4 align-top">
                    <div className="flex items-start gap-3">
                      <span
                        title={`Current sort position #${dynamicRank}`}
                        className={`mt-0.5 inline-flex h-7 min-w-[34px] items-center justify-center rounded-lg px-2 font-mono text-xs font-bold ${
                          dynamicRank === 1
                            ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300'
                            : dynamicRank === 2
                            ? 'bg-slate-200 text-slate-900'
                            : dynamicRank === 3
                            ? 'bg-orange-100 text-orange-950'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{dynamicRank}
                      </span>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/models/${m.slug}`}
                            className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors"
                          >
                            {m.name}
                          </Link>

                          {' '}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              m.evidenceNorm === 'Verified'
                                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                : m.evidenceNorm === 'Estimated'
                                ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.evidenceNorm}
                          </span>

                          {' '}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              m.lifecycleNorm === 'Active'
                                ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
                                : m.lifecycleNorm === 'Preview'
                                ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
                                : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'
                            }`}
                          >
                            {m.lifecycleNorm}
                          </span>

                          {' '}
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {m.licenseNorm}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800">{m.provider}</span>
                          {m.cleanSummary ? ` · ${m.cleanSummary}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3 align-top font-mono text-base font-extrabold text-slate-900">
                    {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}
                  </td>

                  <td className="py-4 px-3 align-top font-mono text-sm font-bold text-emerald-700">
                    {m.scorePerDollar !== null ? m.scorePerDollar.toFixed(1) : '—'}
                  </td>

                  <td className="py-4 px-3 align-top font-mono text-xs font-semibold text-slate-700">
                    {m.contextWindow || '—'}
                  </td>

                  <td className="py-4 px-3 align-top font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                    {formatPrice(m.inputPer1M)} / {formatPrice(m.outputPer1M)}
                  </td>

                  {hasAnyElo ? (
                    <td className="py-4 px-3 align-top font-mono text-xs font-semibold text-slate-700">
                      {typeof m.elo === 'number' ? m.elo : '—'}
                    </td>
                  ) : null}

                  <td className="py-4 pl-3 pr-5 align-top text-right font-mono text-xs font-bold text-teal-700 whitespace-nowrap">
                    {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Clean Cards */}
      <div className="md:hidden space-y-3">
        {filteredAndSorted.map((m, idx) => {
          const dynamicRank = idx + 1;
          return (
            <article
              key={m.slug}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      #{dynamicRank}
                    </span>
                    {' '}
                    <Link
                      href={`/models/${m.slug}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-800"
                    >
                      {m.name}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span className="text-slate-700">{m.provider}</span>
                    <span>·</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
                      {m.evidenceNorm}
                    </span>
                    <span>·</span>
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">
                      {m.lifecycleNorm}
                    </span>
                    <span>·</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                      {m.licenseNorm}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-lg font-extrabold text-slate-900">
                    {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Score
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500">In / Out ($/1M)</div>
                  <div className="font-mono font-bold text-slate-900">
                    {formatPrice(m.inputPer1M)}/{formatPrice(m.outputPer1M)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500">Speed</div>
                  <div className="font-mono font-bold text-teal-700">
                    {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500">Score / $</div>
                  <div className="font-mono font-bold text-emerald-700">
                    {m.scorePerDollar !== null ? m.scorePerDollar.toFixed(1) : '—'}
                  </div>
                </div>
              </div>

              {m.cleanSummary ? (
                <p className="text-xs text-slate-600 leading-relaxed">{m.cleanSummary}</p>
              ) : null}

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-slate-500">Context: {m.contextWindow || '—'}</span>
                <Link
                  href={`/models/${m.slug}`}
                  className="font-semibold text-emerald-800 hover:underline"
                >
                  Specs &amp; Cost →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* GEO Structured Citation & Methodology Block */}
      <footer className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
        <div className="font-bold text-slate-900">Leaderboard Methodology &amp; Citation Note</div>
        <p>
          PromptBill ranks active language models dynamically by composite benchmark score, <strong className="text-slate-800">Score/$ efficiency</strong> (composite score divided by official output token price per 1M tokens), official API pricing, and measured output throughput (<strong className="text-slate-800">tok/s</strong>). All entries display explicit provenance (<strong className="text-slate-800">Verified</strong> vs. <strong className="text-slate-800">Estimated</strong>), licensing (<strong className="text-slate-800">Closed</strong> vs. <strong className="text-slate-800">Open Weight</strong>), and lifecycle status (<strong className="text-slate-800">Active</strong>, <strong className="text-slate-800">Preview</strong>, <strong className="text-slate-800">Deprecated</strong>, <strong className="text-slate-800">Legacy</strong>).
        </p>
      </footer>
    </section>
  );
}
