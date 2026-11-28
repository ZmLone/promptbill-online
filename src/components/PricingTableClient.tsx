'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../../lib/catalog';
import {
  Search,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Clock,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

type TierFilter = 'all' | 'frontier' | 'balanced' | 'economy' | 'open';
type SortField = 'blended' | 'input' | 'output' | 'cached';

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

function getCacheDiscountLabel(
  inputVal: number | null | undefined,
  cachedVal: number | null | undefined
): string | null {
  if (
    typeof inputVal !== 'number' ||
    !Number.isFinite(inputVal) ||
    inputVal <= 0 ||
    typeof cachedVal !== 'number' ||
    !Number.isFinite(cachedVal)
  ) {
    return null;
  }
  const ratio = cachedVal / inputVal;
  if (ratio <= 0.001) return 'Free read';
  if (ratio < 0.06) return `${Math.round(ratio * 100)}% of in`;
  if (ratio < 0.99) return `${Math.round(ratio * 100)}% of in`;
  return '100% of in';
}

export function PricingTableClient({ models }: { models: CatalogModel[] }) {
  const [tier, setTier] = useState<TierFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cacheShare, setCacheShare] = useState<number>(50);
  const [outputShare, setOutputShare] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortField>('input');

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m.provider) set.add(m.provider);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [models]);

  const enrichedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const outFrac = Math.max(0, Math.min(80, outputShare)) / 100;
    const inFrac = 1 - outFrac;
    const cacheFrac = Math.max(0, Math.min(100, cacheShare)) / 100;

    return models
      .filter((m) => {
        if (providerFilter !== 'all' && m.provider !== providerFilter) return false;
        if (tier === 'open' && m.license !== 'Open') return false;

        const inVal =
          typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M) ? m.inputPer1M : null;

        if (tier === 'frontier' && !((m.score ?? 0) >= 85 || (inVal !== null && inVal >= 3.0))) {
          return false;
        }
        if (tier === 'balanced' && (inVal === null || inVal < 0.5 || inVal >= 3.0)) {
          return false;
        }
        if (tier === 'economy' && (inVal === null || inVal >= 0.5)) {
          return false;
        }

        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q)
        );
      })
      .map((m) => {
        const inVal =
          typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M) ? m.inputPer1M : null;
        const cachedVal =
          typeof m.cachedInputPer1M === 'number' && Number.isFinite(m.cachedInputPer1M)
            ? m.cachedInputPer1M
            : null;
        const outVal =
          typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M) ? m.outputPer1M : null;

        const effectiveInput =
          inVal !== null
            ? cachedVal !== null
              ? inVal * (1 - cacheFrac) + cachedVal * cacheFrac
              : inVal
            : null;

        const blendedPer1M =
          effectiveInput !== null && outVal !== null
            ? effectiveInput * inFrac + outVal * outFrac
            : effectiveInput ?? outVal ?? Number.POSITIVE_INFINITY;

        return {
          model: m,
          inVal,
          cachedVal,
          outVal,
          blendedPer1M,
          cacheBadge: getCacheDiscountLabel(inVal, cachedVal),
        };
      })
      .sort((a, b) => {
        if (sortBy === 'output') {
          return (a.outVal ?? Number.POSITIVE_INFINITY) - (b.outVal ?? Number.POSITIVE_INFINITY);
        }
        if (sortBy === 'cached') {
          return (a.cachedVal ?? Number.POSITIVE_INFINITY) - (b.cachedVal ?? Number.POSITIVE_INFINITY);
        }
        if (sortBy === 'blended') {
          return a.blendedPer1M - b.blendedPer1M;
        }
        return (a.inVal ?? Number.POSITIVE_INFINITY) - (b.inVal ?? Number.POSITIVE_INFINITY);
      });
  }, [models, providerFilter, tier, query, cacheShare, outputShare, sortBy]);

  const tierTabs: Array<{ id: TierFilter; label: string }> = [
    { id: 'all', label: `All Models (${models.length})` },
    { id: 'frontier', label: 'Frontier & Flagship' },
    { id: 'balanced', label: 'Workhorse ($0.50–$2.99)' },
    { id: 'economy', label: 'Economy (<$0.50 In)' },
    { id: 'open', label: 'Open-Weight' },
  ];

  return (
    <div className="space-y-5">
      {/* Category & Provider Directory Bar (Inspired by Multi-Provider / Multi-Category Pricing Directories) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Tier Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tierTabs.map((tab) => {
              const active = tier === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTier(tab.id)}
                  aria-pressed={active}
                  className={`h-9 rounded-full px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'border border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-slate-700">
            Showing <strong className="font-bold text-slate-950">{enrichedRows.length}</strong> of{' '}
            {models.length} models
          </div>
        </div>

        {/* Search + Provider Selector + Blended Mix Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-200 items-center">
          <div className="lg:col-span-4 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model or provider (GPT, Claude, Gemini, DeepSeek)..."
              aria-label="Search models or providers"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs sm:text-sm font-medium text-slate-950 placeholder:text-slate-600 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="pricing-provider-select" className="sr-only">
              Filter by provider
            </label>
            <div className="relative flex items-center">
              <SlidersHorizontal className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-600" />
              <select
                id="pricing-provider-select"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-bold text-slate-950 focus:border-emerald-700 focus:outline-none"
              >
                {providers.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov === 'all' ? 'All Providers' : prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="pricing-sort-select" className="sr-only">
              Sort pricing table
            </label>
            <select
              id="pricing-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 focus:border-emerald-700 focus:outline-none"
            >
              <option value="input">Sort: Input / 1M</option>
              <option value="output">Sort: Output / 1M</option>
              <option value="cached">Sort: Cached / 1M</option>
              <option value="blended">Sort: Blended / 1M</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
              <label htmlFor="pricing-cache-select" className="font-bold text-slate-800">
                Cache:
              </label>
              <select
                id="pricing-cache-select"
                value={cacheShare}
                onChange={(e) => setCacheShare(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-slate-950"
              >
                <option value={0}>0%</option>
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={80}>80%</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="pricing-out-select" className="font-bold text-slate-800">
                Out:
              </label>
              <select
                id="pricing-out-select"
                value={outputShare}
                onChange={(e) => setOutputShare(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-slate-950"
              >
                <option value={10}>10%</option>
                <option value={20}>20%</option>
                <option value={35}>35%</option>
                <option value={50}>50%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">
            API Token Pricing per 1 Million Input, Cached Input, and Output Tokens with provenance status
          </caption>
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100/95 text-xs font-bold text-slate-900">
              <th scope="col" className="py-3.5 px-4">Model</th>
              <th scope="col" className="py-3.5 px-3">Input / 1M</th>
              <th scope="col" className="py-3.5 px-3">Cached / 1M</th>
              <th scope="col" className="py-3.5 px-3">Output / 1M</th>
              <th scope="col" className="py-3.5 px-3 hidden lg:table-cell">
                Blended ({100 - outputShare}/{outputShare})
              </th>
              <th scope="col" className="py-3.5 px-3 hidden sm:table-cell text-right">Context</th>
              <th scope="col" className="py-3.5 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {enrichedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center font-sans text-sm font-semibold text-slate-700">
                  No models match the selected filter. Reset search or select All Models.
                </td>
              </tr>
            ) : (
              enrichedRows.map(({ model: m, inVal, cachedVal, outVal, blendedPer1M, cacheBadge }, idx) => {
                const isVerified = m.pricingProvenance.status === 'Verified';
                const statusLabel = isVerified
                  ? 'Verified Pricing'
                  : m.pricingProvenance.status === 'Estimated'
                  ? 'Estimated (Unverified)'
                  : 'Pricing Unavailable';

                return (
                  <tr
                    key={m.id}
                    className={`pb-clean-row ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/55'}`}
                  >
                    <th scope="row" className="py-3.5 px-4 font-sans font-normal text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/models/${m.slug}`}
                          className="font-bold text-slate-950 hover:text-emerald-900 underline-offset-2 hover:underline"
                        >
                          {m.name}
                        </Link>
                        {m.license === 'Open' && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                            Open
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                        <span>{m.provider}</span>
                        <span>·</span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-900">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                            <Clock className="h-3.5 w-3.5 text-amber-800 shrink-0" />
                            {statusLabel}
                          </span>
                        )}
                      </span>
                    </th>

                    <td className="py-3.5 px-3 font-bold text-slate-950 tabular-nums">
                      {fmtRate(inVal)}
                    </td>

                    <td className="py-3.5 px-3 tabular-nums">
                      <div className="font-bold text-emerald-900">{fmtRate(cachedVal)}</div>
                      {cacheBadge && (
                        <div className="font-sans text-[11px] font-semibold text-slate-700">
                          {cacheBadge}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-950 tabular-nums">
                      {fmtRate(outVal)}
                    </td>

                    <td className="py-3.5 px-3 hidden lg:table-cell font-extrabold text-slate-950 tabular-nums">
                      {Number.isFinite(blendedPer1M) ? fmtRate(blendedPer1M) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-3 hidden sm:table-cell text-right font-semibold text-slate-800 tabular-nums">
                      {m.contextWindow ?? 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/?model=${encodeURIComponent(m.slug)}#estimator`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-50 hover:border-emerald-700 transition-colors"
                        >
                          <Calculator className="h-3.5 w-3.5 text-emerald-800" />
                          <span>Calc</span>
                        </Link>
                        <Link
                          href={`/models/${m.slug}`}
                          className="inline-flex h-8 items-center gap-0.5 rounded-lg bg-slate-900 px-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                        >
                          <span>Model</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
