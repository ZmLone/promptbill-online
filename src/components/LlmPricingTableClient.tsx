'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  evaluateModelEndpoints,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';

type TierKey = 'all' | 'frontier' | 'workhorse' | 'economy' | 'open';
type SortKey = 'blended' | 'input' | 'output' | 'cached';

function fmtRate(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

export function LlmPricingTableClient({
  models,
  defaultTier = 'all',
  hideTierPills = false,
}: {
  models: CatalogModel[];
  defaultTier?: TierKey;
  hideTierPills?: boolean;
}) {
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [tier, setTier] = useState<TierKey>(defaultTier);
  const [provider, setProvider] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cachePct, setCachePct] = useState<number>(50);
  const [outputPct, setOutputPct] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortKey>('blended');

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m.provider) set.add(m.provider);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [models]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const outFrac = Math.max(0, Math.min(80, outputPct)) / 100;
    const inFrac = 1 - outFrac;
    const cacheFrac = Math.max(0, Math.min(100, cachePct)) / 100;

    return models
      .filter((m) => {
        if (provider !== 'all' && m.provider !== provider) return false;
        if (tier === 'open' && m.license !== 'Open') return false;

        const baseIn =
          typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M)
            ? m.inputPer1M
            : null;

        if (
          tier === 'frontier' &&
          !((m.score ?? 0) >= 85 || (baseIn !== null && baseIn >= 3.0))
        ) {
          return false;
        }
        if (tier === 'workhorse' && (baseIn === null || baseIn < 0.5 || baseIn >= 3.0)) {
          return false;
        }
        if (tier === 'economy' && (baseIn === null || baseIn >= 0.5)) {
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
        const evalRes = evaluateModelEndpoints(m, {
          inputTokensPerCall: 8000,
          outputTokensPerCall: 600,
          callsPerDay: 2000,
          cacheHitPercent: cachePct,
          batchPercent: 0,
        });

        const quote =
          endpointMode === 'first-party'
            ? evalRes.firstPartyQuote
            : evalRes.cheapestQuote;

        const view = quote.modelView;
        const inRate =
          typeof view.inputPer1M === 'number' && Number.isFinite(view.inputPer1M)
            ? view.inputPer1M
            : null;
        const cachedRate =
          typeof view.cachedInputPer1M === 'number' && Number.isFinite(view.cachedInputPer1M)
            ? view.cachedInputPer1M
            : null;
        const outRate =
          typeof view.outputPer1M === 'number' && Number.isFinite(view.outputPer1M)
            ? view.outputPer1M
            : null;

        const effectiveIn =
          inRate !== null
            ? cachedRate !== null
              ? inRate * (1 - cacheFrac) + cachedRate * cacheFrac
              : inRate
            : null;

        const blendedRate =
          effectiveIn !== null && outRate !== null
            ? effectiveIn * inFrac + outRate * outFrac
            : effectiveIn ?? outRate ?? Number.POSITIVE_INFINITY;

        const statusRaw =
          quote.endpoint.evidenceStatus ?? m.pricingProvenance?.status ?? 'Estimated';
        const statusLabel =
          statusRaw === 'Verified'
            ? 'Verified Pricing'
            : statusRaw === 'Estimated'
            ? 'Estimated (Unverified)'
            : 'Pricing Unavailable';

        return {
          model: m,
          host: quote.endpoint.host,
          inRate,
          cachedRate,
          outRate,
          blendedRate,
          statusRaw,
          statusLabel,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'input') {
          return (a.inRate ?? Number.POSITIVE_INFINITY) - (b.inRate ?? Number.POSITIVE_INFINITY);
        }
        if (sortBy === 'output') {
          return (a.outRate ?? Number.POSITIVE_INFINITY) - (b.outRate ?? Number.POSITIVE_INFINITY);
        }
        if (sortBy === 'cached') {
          return (
            (a.cachedRate ?? Number.POSITIVE_INFINITY) - (b.cachedRate ?? Number.POSITIVE_INFINITY)
          );
        }
        return a.blendedRate - b.blendedRate;
      });
  }, [models, provider, tier, query, cachePct, outputPct, endpointMode, sortBy]);

  const tierButtons: Array<{ id: TierKey; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'frontier', label: 'Frontier' },
    { id: 'workhorse', label: 'Workhorse' },
    { id: 'economy', label: 'Economy' },
    { id: 'open', label: 'Open' },
  ];

  return (
    <div className="space-y-5">
      {/* Uniform Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search model or provider..."
          aria-label="Search model or provider"
          className="lg:col-span-2 h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-slate-950 focus:outline-none"
        />

        <select
          aria-label="Filter by provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? 'All Providers' : p}
            </option>
          ))}
        </select>

        <select
          aria-label="Endpoint selection mode"
          value={endpointMode}
          onChange={(e) => setEndpointMode(e.target.value as EndpointSelectionMode)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
        >
          <option value="cheapest">Cheapest Endpoint</option>
          <option value="first-party">First-Party API</option>
        </select>

        <select
          aria-label="Sort models"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
        >
          <option value="blended">Sort: Blended / 1M</option>
          <option value="input">Sort: Input / 1M</option>
          <option value="cached">Sort: Cached / 1M</option>
          <option value="output">Sort: Output / 1M</option>
        </select>

        <div className="h-10 w-full border border-slate-300 bg-white px-3 flex items-center justify-between text-xs text-slate-800">
          <label className="flex items-center gap-1">
            <span>Cache</span>
            <select
              aria-label="Cache hit percentage"
              value={cachePct}
              onChange={(e) => setCachePct(Number(e.target.value))}
              className="bg-transparent font-mono font-semibold text-slate-950 focus:outline-none"
            >
              <option value={0}>0%</option>
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={80}>80%</option>
            </select>
          </label>
          <span className="text-slate-300">/</span>
          <label className="flex items-center gap-1">
            <span>Out</span>
            <select
              aria-label="Output share percentage"
              value={outputPct}
              onChange={(e) => setOutputPct(Number(e.target.value))}
              className="bg-transparent font-mono font-semibold text-slate-950 focus:outline-none"
            >
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={35}>35%</option>
              <option value={50}>50%</option>
            </select>
          </label>
        </div>
      </div>

      {/* Tier Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
        {!hideTierPills ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {tierButtons.map((btn) => {
              const active = tier === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setTier(btn.id)}
                  className={`h-8 px-3 text-xs font-medium transition-colors cursor-pointer border ${
                    active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span>Showing economy models under $0.50 / 1M input tokens</span>
        )}
        <span className="tabular-nums">
          {rows.length} models · {100 - outputPct}% in ({cachePct}% cached) + {outputPct}% out
        </span>
      </div>

      {/* Uniform Table */}
      <div className="overflow-x-auto border border-slate-300 bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
              <th scope="col" className="py-3 px-4">Model</th>
              <th scope="col" className="py-3 px-4 hidden lg:table-cell">Endpoint</th>
              <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
              <th scope="col" className="py-3 px-4 hidden sm:table-cell text-right">Cached / 1M</th>
              <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
              <th scope="col" className="py-3 px-4 hidden md:table-cell text-right">Blended / 1M</th>
              <th scope="col" className="py-3 px-4 text-right">Context</th>
              <th scope="col" className="py-3 px-4 text-right">Simulate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                  No matching models found.
                </td>
              </tr>
            ) : (
              rows.map(
                ({ model: m, host, inRate, cachedRate, outRate, blendedRate, statusRaw, statusLabel }, idx) => (
                  <tr
                    key={m.id}
                    className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <th scope="row" className="py-3 px-4 font-sans font-normal text-left">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-semibold text-slate-950 hover:underline underline-offset-2"
                      >
                        {m.name}
                      </Link>
                      <div className="text-xs text-slate-600">
                        {m.provider} ·{' '}
                        <span className={statusRaw === 'Verified' ? 'text-emerald-800' : 'text-amber-800'}>
                          {statusLabel}
                        </span>
                      </div>
                    </th>
                    <td className="py-3 px-4 font-sans text-xs text-slate-800 hidden lg:table-cell">
                      {host}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(inRate)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800 hidden sm:table-cell tabular-nums">
                      {fmtRate(cachedRate)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(outRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-950 hidden md:table-cell tabular-nums">
                      {Number.isFinite(blendedRate) ? fmtRate(blendedRate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800 tabular-nums">
                      {m.contextWindow ?? 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-xs whitespace-nowrap">
                      <Link
                        href={`/?model=${encodeURIComponent(m.slug)}#estimator`}
                        className="font-medium text-slate-900 underline underline-offset-2 hover:text-emerald-800"
                      >
                        Calc
                      </Link>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
