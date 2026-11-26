'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';

type SortKey = 'score' | 'value' | 'price' | 'speed' | 'elo';
type LifecycleStatus = 'Active' | 'Preview' | 'Deprecated' | 'Legacy';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLifecycle(m: any): LifecycleStatus {
  const candidates = [
    m?.lifecycleStatus,
    m?.lifecycle,
    m?.status,
    m?.modelStatus,
    m?.availability,
  ];
  for (const cand of candidates) {
    if (typeof cand !== 'string' || !cand.trim()) continue;
    const v = cand.trim().toLowerCase();
    if (v === 'deprecated' || v === 'deprecating' || v === 'retired') return 'Deprecated';
    if (v === 'legacy' || v === 'superseded') return 'Legacy';
    if (v === 'preview' || v === 'beta' || v === 'experimental') return 'Preview';
    if (v === 'active' || v === 'ga' || v === 'generally available' || v === 'live') return 'Active';
  }
  if (m?.deprecated === true) return 'Deprecated';
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
  return `$${val.toFixed(2)}`;
}

export function LeaderboardTableClient({
  lastVerifiedDate,
}: {
  lastVerifiedDate?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'Verified' | 'Estimated' | 'Unavailable'>('ALL');
  const [licenseFilter, setLicenseFilter] = useState<'ALL' | 'Closed' | 'Open Weight'>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<'ALL' | LifecycleStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const enrichedModels = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ALL_MODELS as any[])
      .filter((m) => !m.archived)
      .map((m) => {
        const evidenceNorm = normalizeEvidence(m);
        const licenseNorm = normalizeLicense(m.license);
        const lifecycleNorm = normalizeLifecycle(m);
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

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of enrichedModels) {
      if (m.provider) set.add(String(m.provider));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enrichedModels]);

  const hasAnyElo = useMemo(
    () => enrichedModels.some((m) => typeof m.elo === 'number' && Number.isFinite(m.elo)),
    [enrichedModels]
  );

  const verifiedCount = useMemo(
    () => enrichedModels.filter((m) => m.evidenceNorm === 'Verified').length,
    [enrichedModels]
  );

  const deprecatedCount = useMemo(
    () => enrichedModels.filter((m) => m.lifecycleNorm === 'Deprecated' || m.lifecycleNorm === 'Legacy').length,
    [enrichedModels]
  );

  const maxScore = useMemo(() => {
    const vals = enrichedModels.map((m) => (typeof m.score === 'number' ? m.score : 0));
    return Math.max(100, ...vals);
  }, [enrichedModels]);

  const maxSpeed = useMemo(() => {
    const vals = enrichedModels.map((m) => (typeof m.tokPerSec === 'number' ? m.tokPerSec : 0));
    return Math.max(1, ...vals);
  }, [enrichedModels]);

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

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    providerFilter !== 'ALL' ||
    evidenceFilter !== 'ALL' ||
    licenseFilter !== 'ALL' ||
    lifecycleFilter !== 'ALL';

  function resetAllFilters() {
    setSearchQuery('');
    setProviderFilter('ALL');
    setEvidenceFilter('ALL');
    setLicenseFilter('ALL');
    setLifecycleFilter('ALL');
    setSortBy('score');
    setSortDir('desc');
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = enrichedModels.filter((m) => {
      if (providerFilter !== 'ALL' && m.provider !== providerFilter) return false;
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
  }, [enrichedModels, searchQuery, providerFilter, evidenceFilter, licenseFilter, lifecycleFilter, sortBy, sortDir]);

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
      {/* Top Freshness, Provenance & Lifecycle Strip */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/75 via-white to-slate-50/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
              Verified {formattedVerifiedDate}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {verifiedCount}/{enrichedModels.length} Verified
            </span>
            {deprecatedCount > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setLifecycleFilter((prev) => (prev === 'Deprecated' ? 'ALL' : 'Deprecated'))
                }
                className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100 transition-colors"
              >
                {deprecatedCount} Deprecated/Legacy
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-600">
            Ranked live by benchmark score, <strong className="font-semibold text-slate-800">Score/$</strong> value ratio (Score ÷ Output $/1M), token pricing per 1M, and throughput.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/pricing"
            className="inline-flex min-h-[36px] items-center rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-900 transition-colors"
          >
            Full Pricing Table
          </Link>
          <Link
            href="/compare"
            className="inline-flex min-h-[36px] items-center rounded-xl bg-slate-900 px-3.5 py-1.5 font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Compare Models →
          </Link>
        </div>
      </div>

      {/* Leader Spotlight Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {highlights.byScore ? (
          <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Top Score</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-emerald-800 ring-1 ring-emerald-200">
                {highlights.byScore.score} / 100
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.byScore.slug}`}
                className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors"
              >
                {highlights.byScore.name}
              </Link>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {formatPrice(highlights.byScore.inputPer1M)} / {formatPrice(highlights.byScore.outputPer1M)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{highlights.byScore.provider} · {highlights.byScore.licenseNorm}</span>
              <span className="font-mono">{highlights.byScore.lifecycleNorm}</span>
            </div>
          </div>
        ) : null}

        {highlights.byValue ? (
          <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Best Score/$</span>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-mono text-teal-800 ring-1 ring-teal-200">
                {highlights.byValue.scorePerDollar} pts/$
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.byValue.slug}`}
                className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors"
              >
                {highlights.byValue.name}
              </Link>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {formatPrice(highlights.byValue.inputPer1M)} / {formatPrice(highlights.byValue.outputPer1M)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{highlights.byValue.provider} · Score {highlights.byValue.score}</span>
              <span className="font-mono">{highlights.byValue.tokPerSec ?? '—'} tok/s</span>
            </div>
          </div>
        ) : null}

        {highlights.bySpeed ? (
          <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-sky-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Fastest Output</span>
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-sky-800 ring-1 ring-sky-200">
                {highlights.bySpeed.tokPerSec} tok/s
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <Link
                href={`/models/${highlights.bySpeed.slug}`}
                className="text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors"
              >
                {highlights.bySpeed.name}
              </Link>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {formatPrice(highlights.bySpeed.inputPer1M)} / {formatPrice(highlights.bySpeed.outputPer1M)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{highlights.bySpeed.provider} · {highlights.bySpeed.licenseNorm}</span>
              <span className="font-mono">Score {highlights.bySpeed.score ?? '—'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model, provider, tag..."
            aria-label="Search models or providers"
            className="sm:col-span-2 min-h-[40px] w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
          />

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            aria-label="Filter by provider"
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Providers ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={evidenceFilter}
            onChange={(e) => setEvidenceFilter(e.target.value as typeof evidenceFilter)}
            aria-label="Filter by provenance status"
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
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
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Licenses</option>
            <option value="Closed">Closed</option>
            <option value="Open Weight">Open Weight</option>
          </select>

          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value as typeof lifecycleFilter)}
            aria-label="Filter by model lifecycle status"
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Lifecycles</option>
            <option value="Active">Active</option>
            <option value="Preview">Preview</option>
            <option value="Deprecated">Deprecated</option>
            <option value="Legacy">Legacy</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 mr-1">Sort:</span>
            {[
              { id: 'score', label: 'Score' },
              { id: 'value', label: 'Best Score/$' },
              { id: 'price', label: 'Lowest Price' },
              { id: 'speed', label: 'Fastest Tok/s' },
              ...(hasAnyElo ? [{ id: 'elo', label: 'Elo' }] : []),
            ].map((pill) => {
              const active = sortBy === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleSortToggle(pill.id as SortKey)}
                  className={`min-h-[34px] rounded-xl px-3 py-1.5 font-semibold transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {pill.label} {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Reset filters
              </button>
            ) : null}
            <span className="text-slate-500 font-medium">
              <strong className="text-slate-900">{filteredAndSorted.length}</strong> models · Ranked{' '}
              <strong className="text-slate-900">1–{filteredAndSorted.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            No models match your current search or filter combination.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex min-h-[38px] items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Structured Leaderboard Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold uppercase tracking-wider text-slate-600">
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
                  const scorePct =
                    typeof m.score === 'number' ? Math.max(4, Math.min(100, Math.round((m.score / maxScore) * 100))) : 0;
                  const speedPct =
                    typeof m.tokPerSec === 'number'
                      ? Math.max(6, Math.min(100, Math.round((m.tokPerSec / maxSpeed) * 100)))
                      : 0;
                  const isRetired = m.lifecycleNorm === 'Deprecated' || m.lifecycleNorm === 'Legacy';

                  return (
                    <tr
                      key={m.slug}
                      className={`group transition-colors ${
                        isRetired ? 'bg-slate-50/60 hover:bg-slate-100/60' : 'hover:bg-slate-50/90'
                      }`}
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

                      <td className="py-4 px-3 align-top">
                        <div className="font-mono text-base font-extrabold text-slate-900">
                          {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}
                        </div>
                        {typeof m.score === 'number' ? (
                          <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-800"
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        ) : null}
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

                      <td className="py-4 pl-3 pr-5 align-top text-right">
                        <div className="font-mono text-xs font-bold text-teal-700 whitespace-nowrap">
                          {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                        </div>
                        {typeof m.tokPerSec === 'number' ? (
                          <div className="mt-1.5 ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-teal-600"
                              style={{ width: `${speedPct}%` }}
                            />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
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
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            m.lifecycleNorm === 'Active'
                              ? 'bg-sky-50 text-sky-800'
                              : m.lifecycleNorm === 'Preview'
                              ? 'bg-indigo-50 text-indigo-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
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
        </>
      )}

      {/* Methodology & GEO Citation Note */}
      <footer className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
        <div className="font-bold text-slate-900">Leaderboard Methodology &amp; Citation Note</div>
        <p>
          PromptBill ranks active language models dynamically by composite benchmark score, <strong className="text-slate-800">Score/$ efficiency</strong> (composite score divided by official output token price per 1M tokens), official API pricing, and measured output throughput (<strong className="text-slate-800">tok/s</strong>). All entries display explicit provenance (<strong className="text-slate-800">Verified</strong> vs. <strong className="text-slate-800">Estimated</strong>), licensing (<strong className="text-slate-800">Closed</strong> vs. <strong className="text-slate-800">Open Weight</strong>), and lifecycle status (<strong className="text-slate-800">Active</strong>, <strong className="text-slate-800">Preview</strong>, <strong className="text-slate-800">Deprecated</strong>, <strong className="text-slate-800">Legacy</strong>).
        </p>
      </footer>
    </section>
  );
}
