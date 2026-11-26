'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, LayoutGrid, List, ArrowUpRight, RotateCcw } from 'lucide-react';
import { ModelJobMatcher } from './ModelJobMatcher';

const MOBILE_PAGE_SIZES = [8, 12, 20] as const;
const DESKTOP_PAGE_SIZES = [12, 24, 48, 96] as const;

type SortField = 'score' | 'value' | 'price_asc' | 'price_desc' | 'speed' | 'name';
type ViewMode = 'compact' | 'cards';

function fmtPrice(val: unknown): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

function fmtScore(val: unknown): string {
  return typeof val === 'number' && Number.isFinite(val) ? val.toFixed(1) : '—';
}

function computeScorePerDollar(score: unknown, outputPer1M: unknown): number | null {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null;
  if (typeof outputPer1M !== 'number' || !Number.isFinite(outputPer1M) || outputPer1M <= 0) return null;
  return Number((score / outputPer1M).toFixed(1));
}

function normalizeLicense(raw: unknown): 'Closed' | 'Open Weight' {
  const s = String(raw || '').trim();
  if (!s) return 'Closed';
  if (/open/i.test(s) || /apache|mit|llama|gemma|qwen|deepseek|mistral/i.test(s)) {
    return 'Open Weight';
  }
  return 'Closed';
}

function normalizeEvidence(m: {
  evidence?: string | null;
  pricingProvenance?: { status?: string | null } | null;
}): 'Verified' | 'Estimated' {
  const ev = String(m.evidence || '').toLowerCase();
  const pr = String(m.pricingProvenance?.status || '').toLowerCase();
  if (ev === 'verified' || pr === 'verified') return 'Verified';
  return 'Estimated';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ModelsDirectoryClient({ models }: { models: any[] }) {
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('ALL');
  const [license, setLicense] = useState<'ALL' | 'Closed' | 'Open Weight'>('ALL');
  const [evidence, setEvidence] = useState<'ALL' | 'Verified' | 'Estimated'>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('score');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [mobilePageSize, setMobilePageSize] = useState<number>(8);
  const [desktopPageSize, setDesktopPageSize] = useState<number>(24);
  const [page, setPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  useEffect(() => {
    function checkWidth() {
      setIsMobile(window.innerWidth < 768);
    }
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const enriched = useMemo(() => {
    return models.map((m) => {
      const lic = normalizeLicense(m.license);
      const ev = normalizeEvidence(m);
      const valPerDollar = computeScorePerDollar(m.score, m.outputPer1M);
      return {
        ...m,
        _lic: lic,
        _ev: ev,
        _valPerDollar: valPerDollar,
      };
    });
  }, [models]);

  const providers = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of enriched) {
      const p = String(m.provider || 'Other');
      map.set(p, (map.get(p) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [enriched]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = enriched.filter((m) => {
      if (provider !== 'ALL' && String(m.provider) !== provider) return false;
      if (license !== 'ALL' && m._lic !== license) return false;
      if (evidence !== 'ALL' && m._ev !== evidence) return false;
      if (q) {
        const hay = `${m.name || ''} ${m.slug || ''} ${m.provider || ''} ${m.bestFor || ''} ${m.notes || ''} ${m._lic}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? -Infinity) - (a.score ?? -Infinity);
      if (sortBy === 'value') return (b._valPerDollar ?? -Infinity) - (a._valPerDollar ?? -Infinity);
      if (sortBy === 'price_asc') return (a.outputPer1M ?? Infinity) - (b.outputPer1M ?? Infinity);
      if (sortBy === 'price_desc') return (b.outputPer1M ?? -Infinity) - (a.outputPer1M ?? -Infinity);
      if (sortBy === 'speed') return (b.tokPerSec ?? -Infinity) - (a.tokPerSec ?? -Infinity);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [enriched, search, provider, license, evidence, sortBy]);

  const perPage = isMobile ? mobilePageSize : desktopPageSize;
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / perPage));
  const safePage = Math.min(page, totalPages);

  const visibleModels = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredSorted.slice(start, start + perPage);
  }, [filteredSorted, safePage, perPage]);

  const hasActiveFilters =
    Boolean(search.trim()) || provider !== 'ALL' || license !== 'ALL' || evidence !== 'ALL';

  function resetFilters() {
    setSearch('');
    setProvider('ALL');
    setLicense('ALL');
    setEvidence('ALL');
    setSortBy('score');
    setPage(1);
  }

  return (
    <div className="space-y-8 sm:space-y-10 pb-14">
      {/* 1. Interactive Workload Matcher */}
      <ModelJobMatcher />

      {/* 2. Scalable Catalog Search, Filters & View Controls */}
      <section aria-label="Search and Filter Models" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Models Directory ({filteredSorted.length} of {enriched.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Engineered for large multi-provider catalogs—search by model, provider, or use case and switch density or page size.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Compact Index</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Detail Cards</span>
            </button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search model name, provider, coding, reasoning, open weight..."
                aria-label="Search models"
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              aria-expanded={filtersExpanded}
              className="md:hidden inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Refine</span>
            </button>
          </div>

          {/* Horizontal Provider Chips for Quick Filtering */}
          {providers.length > 1 ? (
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="region"
              aria-label="Provider filters"
            >
              <button
                type="button"
                onClick={() => {
                  setProvider('ALL');
                  setPage(1);
                }}
                className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 font-semibold cursor-pointer ${
                  provider === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({enriched.length})
              </button>
              {providers.map((p) => {
                const active = provider === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setProvider(active ? 'ALL' : p.name);
                      setPage(1);
                    }}
                    className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 font-semibold cursor-pointer ${
                      active
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.name} ({p.count})
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Secondary Filters & Sort */}
          <div
            className={`${
              filtersExpanded ? 'grid' : 'hidden'
            } md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1`}
          >
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by provider"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Providers ({providers.length})</option>
              {providers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.count})
                </option>
              ))}
            </select>

            <select
              value={license}
              onChange={(e) => {
                setLicense(e.target.value as typeof license);
                setPage(1);
              }}
              aria-label="Filter by license"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Licenses (Closed &amp; Open Weight)</option>
              <option value="Closed">Closed API</option>
              <option value="Open Weight">Open Weight</option>
            </select>

            <select
              value={evidence}
              onChange={(e) => {
                setEvidence(e.target.value as typeof evidence);
                setPage(1);
              }}
              aria-label="Filter by data provenance"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="ALL">All Provenance (Verified &amp; Estimated)</option>
              <option value="Verified">Verified Only</option>
              <option value="Estimated">Estimated</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortField);
                setPage(1);
              }}
              aria-label="Sort models"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
            >
              <option value="score">Sort: Highest Benchmark Score</option>
              <option value="value">Sort: Best Score/$ Value</option>
              <option value="price_asc">Sort: Lowest Output Price ($/1M)</option>
              <option value="price_desc">Sort: Highest Output Price ($/1M)</option>
              <option value="speed">Sort: Fastest Speed (tok/s)</option>
              <option value="name">Sort: Name (A–Z)</option>
            </select>
          </div>

          {/* Individual Mobile & Desktop Page Limit Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile per-page selector */}
              <label className="md:hidden inline-flex items-center gap-2 text-slate-600 font-medium">
                <span>Mobile per page:</span>
                <select
                  value={mobilePageSize}
                  onChange={(e) => {
                    setMobilePageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-900"
                >
                  {MOBILE_PAGE_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} models
                    </option>
                  ))}
                </select>
              </label>

              {/* Desktop per-page selector */}
              <label className="hidden md:inline-flex items-center gap-2 text-slate-600 font-medium">
                <span>Desktop per page:</span>
                <select
                  value={desktopPageSize}
                  onChange={(e) => {
                    setDesktopPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-900"
                >
                  {DESKTOP_PAGE_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} models
                    </option>
                  ))}
                </select>
              </label>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              ) : null}
            </div>

            <div className="font-medium text-slate-600">
              Page <strong className="text-slate-900">{safePage}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong> · Showing{' '}
              <strong className="text-slate-900">{visibleModels.length}</strong> of{' '}
              <strong className="text-slate-900">{filteredSorted.length}</strong>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {visibleModels.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              No models matched your search or filter settings.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-[40px] items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : viewMode === 'compact' ? (
          /* Innovative High-Density Compact Index (Scales Cleanly to Thousands of Models) */
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Mobile Compact Stack */}
            <div className="md:hidden divide-y divide-slate-100">
              {visibleModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/models/${m.slug}`}
                  className="block p-4 hover:bg-slate-50/90 active:bg-emerald-50/40 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate">{m.name}</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {m.provider} · {m._lic} · {m._ev}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-900 ring-1 ring-emerald-200">
                      {fmtScore(m.score)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs text-slate-700 pt-1">
                    <span>
                      In {fmtPrice(m.inputPer1M)} · Out {fmtPrice(m.outputPer1M)}
                    </span>
                    <span className="text-teal-700 font-semibold">
                      {m.contextWindow || '—'} · {m.tokPerSec ? `${m.tokPerSec} tok/s` : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Compact Index Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-5">Model &amp; Provider</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Score/$</th>
                    <th className="py-3.5 px-4">API In / Out (1M)</th>
                    <th className="py-3.5 px-4">Context</th>
                    <th className="py-3.5 px-4">Speed</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleModels.map((m) => (
                    <tr key={m.slug} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/models/${m.slug}`}
                            className="font-bold text-slate-900 hover:text-emerald-800 hover:underline"
                          >
                            {m.name}
                          </Link>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {m._lic}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              m._ev === 'Verified'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {m._ev}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {m.provider}
                          {m.bestFor ? ` · ${m.bestFor}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {fmtScore(m.score)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {m._valPerDollar !== null ? `${m._valPerDollar.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {m.contextWindow || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-teal-700 whitespace-nowrap">
                        {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Link
                          href={`/models/${m.slug}`}
                          className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline text-xs"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Detail Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {visibleModels.map((m) => (
              <Link
                key={m.slug}
                href={`/models/${m.slug}`}
                className="group rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
                        {m.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {m.provider} · {m._lic} · {m._ev}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1 font-mono text-xs font-extrabold text-emerald-900 ring-1 ring-emerald-200">
                      {fmtScore(m.score)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {m.bestFor || m.notes || `${m.provider} language model`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 font-mono text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-sans font-bold">
                      In / Out (1M)
                    </div>
                    <div className="font-bold text-slate-900">
                      {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400 font-sans font-bold">
                      Context · Speed
                    </div>
                    <div className="font-bold text-teal-700">
                      {m.contextWindow || '—'} · {m.tokPerSec ? `${m.tokPerSec} t/s` : '—'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Page <strong className="text-slate-900">{safePage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({filteredSorted.length} models)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[38px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[38px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* 3. GEO Citation & Key Definitions Block */}
      <footer
        data-geo-facts="true"
        className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50/80 p-5 sm:p-7 text-xs text-slate-600 space-y-4 leading-relaxed"
      >
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-900">
            Models Directory Methodology &amp; GEO Reference
          </h2>
          <p>
            Every model page on <strong className="text-slate-800">promptbill.online/models</strong> provides official per-1M-token input and output rates, context window limits, output tokens per second (<strong className="text-slate-800">tok/s</strong>), <strong className="text-slate-800">Score/$</strong> value efficiency, and explicit <strong className="text-slate-800">Verified</strong> vs. <strong className="text-slate-800">Estimated</strong> provenance.
          </p>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Score/$ Value Metric</dt>
            <dd>
              Composite benchmark score divided by output API price per 1M tokens (USD). Higher Score/$ signals stronger capability per output dollar.
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Provenance Auditability</dt>
            <dd>
              <strong>Verified</strong> rates match documented provider pricing; <strong>Estimated</strong> rates reflect preliminary or router-derived figures.
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Large-Catalog Scalability</dt>
            <dd>
              Supports client-side instant search, provider/license filtering, compact index vs. card views, and independent mobile/desktop pagination.
            </dd>
          </div>
        </dl>
      </footer>
    </div>
  );
}
