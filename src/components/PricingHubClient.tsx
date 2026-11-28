'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  evaluateModelEndpoints,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';
import { ProviderLogo } from './ProviderLogo';
import {
  Search,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Clock,
  Server,
  Gauge,
  Zap,
  Layers,
  SlidersHorizontal,
  Coins,
  Cpu,
  Database,
  Sparkles,
  Scale,
} from 'lucide-react';

type PricingViewTab =
  | 'llm-tokens'
  | 'cheapest-models'
  | 'cached-value'
  | 'open-weights'
  | 'providers';

type TierFilter = 'all' | 'frontier' | 'balanced' | 'economy' | 'open';
type SortKey = 'blended' | 'input' | 'output' | 'cached' | 'speed';

function fmtUsd(val: number | null | undefined, decimals = 2): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01 && decimals === 2) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(decimals)}`;
}

function getCacheDiscountBadge(
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
  const mult = cachedVal / inputVal;
  if (mult <= 0.001) return '0.00× (Free read)';
  if (mult < 0.99) return `${mult.toFixed(2)}× input`;
  return '1.00× input';
}

export function PricingHubClient({ models }: { models: CatalogModel[] }) {
  const [activeTab, setActiveTab] = useState<PricingViewTab>('llm-tokens');
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [tier, setTier] = useState<TierFilter>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedHost, setSelectedHost] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cacheShare, setCacheShare] = useState<number>(50);
  const [outputShare, setOutputShare] = useState<number>(20);
  const [sortKey, setSortKey] = useState<SortKey>('blended');

  const providers = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of models) {
      if (m.provider) {
        map.set(m.provider, (map.get(m.provider) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [models]);

  const hosts = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (Array.isArray(m.hostingEndpoints)) {
        for (const ep of m.hostingEndpoints) {
          if (ep.host) set.add(ep.host);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [models]);

  const handleTabChange = (tab: PricingViewTab) => {
    setActiveTab(tab);
    if (tab === 'cheapest-models') {
      setTier('economy');
      setEndpointMode('cheapest');
      setSortKey('blended');
    } else if (tab === 'cached-value') {
      setCacheShare(75);
      setSortKey('cached');
    } else if (tab === 'open-weights') {
      setTier('open');
      setEndpointMode('cheapest');
      setSortKey('blended');
    } else if (tab === 'llm-tokens') {
      setTier('all');
      setSortKey('blended');
    }
  };

  const evaluatedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const outFrac = Math.max(0, Math.min(80, outputShare)) / 100;
    const inFrac = 1 - outFrac;
    const cacheFrac = Math.max(0, Math.min(100, cacheShare)) / 100;

    return models
      .map((model) => {
        const evalRes = evaluateModelEndpoints(model, {
          inputTokensPerCall: 8000,
          outputTokensPerCall: 600,
          callsPerDay: 2000,
          cacheHitPercent: cacheShare,
          batchPercent: 0,
        });

        let quote =
          endpointMode === 'first-party'
            ? evalRes.firstPartyQuote
            : evalRes.cheapestQuote;

        if (selectedHost !== 'all') {
          const matching = evalRes.quotes.find((item) => item.endpoint.host === selectedHost);
          if (!matching) return null;
          quote = matching;
        }

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

        const effectiveInput =
          inRate !== null
            ? cachedRate !== null
              ? inRate * (1 - cacheFrac) + cachedRate * cacheFrac
              : inRate
            : null;

        const blendedPer1M =
          effectiveInput !== null && outRate !== null
            ? effectiveInput * inFrac + outRate * outFrac
            : effectiveInput ?? outRate ?? Number.POSITIVE_INFINITY;

        const cacheSavingsPct =
          inRate !== null &&
          inRate > 0 &&
          cachedRate !== null &&
          cachedRate < inRate
            ? Math.round(((inRate - cachedRate) / inRate) * 100)
            : 0;

        const officialMonthly = evalRes.firstPartyQuote.breakdown.monthlyTotalCost;
        const activeMonthly = quote.breakdown.monthlyTotalCost;
        const hostSavingsPct =
          typeof officialMonthly === 'number' &&
          typeof activeMonthly === 'number' &&
          officialMonthly > 0 &&
          activeMonthly < officialMonthly
            ? Math.round(((officialMonthly - activeMonthly) / officialMonthly) * 100)
            : 0;

        return {
          model,
          quote,
          endpointCount: evalRes.quotes.length,
          inRate,
          cachedRate,
          outRate,
          blendedPer1M,
          cacheSavingsPct,
          hostSavingsPct,
          cacheBadge: getCacheDiscountBadge(inRate, cachedRate),
          tokPerSec: quote.tokPerSec ?? null,
          latencyMs: quote.latencyMs ?? null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .filter(({ model, inRate }) => {
        if (selectedProvider !== 'all' && model.provider !== selectedProvider) return false;
        if (tier === 'open' && model.license !== 'Open') return false;
        if (tier === 'frontier' && !((model.score ?? 0) >= 85 || (inRate !== null && inRate >= 3.0))) {
          return false;
        }
        if (tier === 'balanced' && (inRate === null || inRate < 0.5 || inRate >= 3.0)) {
          return false;
        }
        if (tier === 'economy' && (inRate === null || inRate >= 0.5)) {
          return false;
        }

        if (!q) return true;
        const hostText = Array.isArray(model.hostingEndpoints)
          ? model.hostingEndpoints.map((e) => e.host.toLowerCase()).join(' ')
          : '';
        return (
          model.name.toLowerCase().includes(q) ||
          model.provider.toLowerCase().includes(q) ||
          model.slug.toLowerCase().includes(q) ||
          hostText.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === 'input') {
          return (a.inRate ?? Number.POSITIVE_INFINITY) - (b.inRate ?? Number.POSITIVE_INFINITY);
        }
        if (sortKey === 'output') {
          return (a.outRate ?? Number.POSITIVE_INFINITY) - (b.outRate ?? Number.POSITIVE_INFINITY);
        }
        if (sortKey === 'cached') {
          return (a.cachedRate ?? Number.POSITIVE_INFINITY) - (b.cachedRate ?? Number.POSITIVE_INFINITY);
        }
        if (sortKey === 'speed') {
          return (b.tokPerSec ?? -1) - (a.tokPerSec ?? -1);
        }
        return a.blendedPer1M - b.blendedPer1M;
      });
  }, [models, query, tier, selectedProvider, selectedHost, endpointMode, cacheShare, outputShare, sortKey]);

  const pricingCategoryTabs: Array<{
    id: PricingViewTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'llm-tokens',
      label: 'LLM Token Pricing',
      description: 'Normalized per-1M input, cached, output & blended rates',
      icon: Coins,
    },
    {
      id: 'cheapest-models',
      label: 'Cheapest Models',
      description: 'Sub-$0.50/1M input models ranked by blended token cost',
      icon: Sparkles,
    },
    {
      id: 'cached-value',
      label: 'Prompt Cache Leaders',
      description: 'Lowest cached-read multipliers for RAG & agent loops',
      icon: Database,
    },
    {
      id: 'open-weights',
      label: 'Open-Weight Hosts',
      description: 'Open-license models across cloud inference endpoints',
      icon: Cpu,
    },
    {
      id: 'providers',
      label: 'Provider Directory',
      description: 'Browse catalog counts and rate coverage by provider',
      icon: Server,
    },
  ];

  const tierPills: Array<{ id: TierFilter; label: string }> = [
    { id: 'all', label: `All Tiers (${models.length})` },
    { id: 'frontier', label: 'Frontier & High-Tier' },
    { id: 'balanced', label: 'Balanced Workhorse' },
    { id: 'economy', label: 'Economy (<$0.50 In)' },
    { id: 'open', label: 'Open-Weight' },
  ];

  const topThreeCheapest = useMemo(() => {
    return [...evaluatedRows]
      .filter((r) => Number.isFinite(r.blendedPer1M))
      .slice(0, 3);
  }, [evaluatedRows]);

  return (
    <div className="space-y-6">
      {/* Multi-View Pricing Navigation Bar (Inspired by Structured Pricing Hubs) */}
      <nav
        aria-label="Pricing views and directories"
        className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {pricingCategoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                aria-pressed={isActive}
                className={`rounded-xl p-3 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-emerald-50 ring-2 ring-emerald-700 text-slate-950 shadow-2xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 ring-1 ring-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-950">
                    <Icon className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-700 leading-snug">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Provider Quick Directory Strip (Visible in Provider Directory tab or as quick jump) */}
      {activeTab === 'providers' && (
        <section
          aria-labelledby="provider-directory-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="provider-directory-heading" className="text-base font-extrabold text-slate-950">
                Browse Pricing by Model Provider
              </h2>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                Select a provider below to filter the token pricing table to that vendor&apos;s models.
              </p>
            </div>
            {selectedProvider !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedProvider('all')}
                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                Reset Provider ({selectedProvider})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {providers.map(([provName, count]) => {
              const active = selectedProvider === provName;
              return (
                <button
                  key={provName}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(active ? 'all' : provName);
                    setActiveTab('llm-tokens');
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-700 bg-emerald-50 font-extrabold text-slate-950'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white font-bold text-slate-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <ProviderLogo provider={provName} size="sm" />
                    <span className="truncate">{provName}</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Logical Tier & Workload Blend Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tierPills.map((pill) => {
              const active = tier === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTier(pill.id)}
                  aria-pressed={active}
                  className={`h-9 rounded-full px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'border border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 p-1 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setEndpointMode('cheapest')}
              className={`h-8 rounded-full px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                endpointMode === 'cheapest'
                  ? 'bg-white text-slate-950 shadow-2xs ring-1 ring-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Cheapest Endpoint
            </button>
            <button
              type="button"
              onClick={() => setEndpointMode('first-party')}
              className={`h-8 rounded-full px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                endpointMode === 'first-party'
                  ? 'bg-white text-slate-950 shadow-2xs ring-1 ring-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              First-Party API
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-200 items-center">
          <div className="lg:col-span-3 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model, provider, or host..."
              aria-label="Search models, providers, or hosts"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs sm:text-sm font-medium text-slate-950 placeholder:text-slate-600 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="pricing-provider-filter" className="sr-only">
              Filter by provider
            </label>
            <div className="relative flex items-center">
              <SlidersHorizontal className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-600" />
              <select
                id="pricing-provider-filter"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-bold text-slate-950 focus:border-emerald-700 focus:outline-none"
              >
                <option value="all">All Providers</option>
                {providers.map(([provName]) => (
                  <option key={provName} value={provName}>
                    {provName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="pricing-host-filter" className="sr-only">
              Filter by endpoint host
            </label>
            <select
              id="pricing-host-filter"
              value={selectedHost}
              onChange={(e) => setSelectedHost(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 focus:border-emerald-700 focus:outline-none"
            >
              <option value="all">All Endpoints</option>
              {hosts.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="pricing-sort-key" className="sr-only">
              Sort models by rate
            </label>
            <select
              id="pricing-sort-key"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 focus:border-emerald-700 focus:outline-none"
            >
              <option value="blended">Sort: Blended / 1M</option>
              <option value="input">Sort: Input / 1M</option>
              <option value="cached">Sort: Cached / 1M</option>
              <option value="output">Sort: Output / 1M</option>
              <option value="speed">Sort: Throughput (tok/s)</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
              <label htmlFor="pricing-cache-hit" className="font-bold text-slate-800">
                Cache:
              </label>
              <select
                id="pricing-cache-hit"
                value={cacheShare}
                onChange={(e) => setCacheShare(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-slate-950"
              >
                <option value={0}>0%</option>
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="pricing-out-mix" className="font-bold text-slate-800">
                Out:
              </label>
              <select
                id="pricing-out-mix"
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

      {/* Top 3 Lowest Blended Rate Snapshot Strip for Fast Decision-Making */}
      {topThreeCheapest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {topThreeCheapest.map((item, idx) => (
            <div
              key={item.model.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-xs font-extrabold text-emerald-950">
                  #{idx + 1}
                </span>
                <ProviderLogo
                  provider={item.model.provider}
                  modelName={item.model.name}
                  modelSlug={item.model.slug}
                  size="sm"
                />
                <div className="min-w-0">
                  <Link
                    href={`/models/${item.model.slug}`}
                    className="text-sm font-extrabold text-slate-950 hover:text-emerald-900 hover:underline truncate block"
                  >
                    {item.model.name}
                  </Link>
                  <span className="text-[11px] font-semibold text-slate-700 truncate block">
                    {item.model.provider} · {item.quote.endpoint.host}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm font-extrabold text-emerald-950 tabular-nums">
                  {fmtUsd(item.blendedPer1M)}
                </div>
                <div className="text-[10px] font-bold text-slate-700">blended / 1M</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 px-1">
        <span>
          Displaying <strong className="font-bold text-slate-950">{evaluatedRows.length}</strong> of{' '}
          {models.length} models · Blended rate models{' '}
          <strong className="font-bold text-slate-950">{100 - outputShare}%</strong> input (at{' '}
          <strong className="font-bold text-slate-950">{cacheShare}%</strong> cache read) +{' '}
          <strong className="font-bold text-slate-950">{outputShare}%</strong> output per 1M tokens.
        </span>
        <span>Missing rates display N/A.</span>
      </div>

      {/* Main High-Contrast Multi-Endpoint Rate Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">
            Normalized LLM API token pricing per 1 million tokens across models, endpoints, cache discounts, and speed
          </caption>
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-xs font-bold text-slate-950">
              <th scope="col" className="py-3.5 px-4">Model &amp; Provenance</th>
              <th scope="col" className="py-3.5 px-3 hidden lg:table-cell">Endpoint</th>
              <th scope="col" className="py-3.5 px-3">Input / 1M</th>
              <th scope="col" className="py-3.5 px-3 hidden md:table-cell">Cached / 1M</th>
              <th scope="col" className="py-3.5 px-3">Output / 1M</th>
              <th scope="col" className="py-3.5 px-3">Blended / 1M</th>
              <th scope="col" className="py-3.5 px-3 hidden sm:table-cell text-right">Speed</th>
              <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {evaluatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 px-4 text-center font-sans text-sm font-semibold text-slate-700"
                >
                  No models match the active filter combination. Try resetting filters or switching to All Tiers.
                </td>
              </tr>
            ) : (
              evaluatedRows.map(
                ({
                  model: m,
                  quote,
                  endpointCount,
                  inRate,
                  cachedRate,
                  outRate,
                  blendedPer1M,
                  cacheSavingsPct,
                  hostSavingsPct,
                  cacheBadge,
                  tokPerSec,
                  latencyMs,
                }, idx) => {
                  const statusRaw = quote.endpoint.evidenceStatus ?? m.pricingProvenance.status;
                  const isVerified = statusRaw === 'Verified';
                  const statusText = isVerified
                    ? 'Verified Pricing'
                    : statusRaw === 'Estimated'
                    ? 'Estimated (Unverified)'
                    : 'Pricing Unavailable';

                  return (
                    <tr
                      key={m.id}
                      className={`pb-clean-row align-middle ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/55'
                      }`}
                    >
                      <th scope="row" className="py-3.5 px-4 font-sans font-normal text-left">
                        <div className="flex items-center gap-3">
                          <ProviderLogo
                            provider={m.provider}
                            modelName={m.name}
                            modelSlug={m.slug}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/models/${m.slug}`}
                                className="font-extrabold text-slate-950 hover:text-emerald-900 underline-offset-2 hover:underline truncate"
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
                                  {statusText}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                                  <Clock className="h-3.5 w-3.5 text-amber-800 shrink-0" />
                                  {statusText}
                                </span>
                              )}
                              {m.contextWindow && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {m.contextWindow}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </th>

                      <td className="py-3.5 px-3 font-sans hidden lg:table-cell">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950">
                          <Server className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                          <span className="truncate max-w-[185px]">{quote.endpoint.host}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-slate-700">
                          {endpointCount} {endpointCount === 1 ? 'host' : 'hosts'}
                          {hostSavingsPct > 0 && (
                            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.2 font-bold text-emerald-950">
                              -{hostSavingsPct}% vs official
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-950 tabular-nums">
                        {fmtUsd(inRate)}
                      </td>

                      <td className="py-3.5 px-3 hidden md:table-cell tabular-nums">
                        <div className="font-bold text-emerald-900">{fmtUsd(cachedRate)}</div>
                        {(cacheBadge || cacheSavingsPct > 0) && (
                          <div className="font-sans text-[11px] font-semibold text-slate-700">
                            {cacheSavingsPct > 0 ? `-${cacheSavingsPct}%` : ''}
                            {cacheSavingsPct > 0 && cacheBadge ? ' · ' : ''}
                            {cacheBadge ?? ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-950 tabular-nums">
                        {fmtUsd(outRate)}
                      </td>

                      <td className="py-3.5 px-3 font-extrabold text-slate-950 tabular-nums">
                        {Number.isFinite(blendedPer1M) ? fmtUsd(blendedPer1M) : 'N/A'}
                      </td>

                      <td className="py-3.5 px-3 hidden sm:table-cell text-right text-xs tabular-nums">
                        {typeof tokPerSec === 'number' ? (
                          <div className="inline-flex items-center gap-1 font-bold text-slate-950">
                            <Zap className="h-3.5 w-3.5 text-indigo-800" />~{tokPerSec} tok/s
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700">N/A</span>
                        )}
                        {typeof latencyMs === 'number' && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900">
                            <Gauge className="h-3 w-3" />&lt;{latencyMs}ms
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/?model=${encodeURIComponent(m.slug)}#estimator`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-50 hover:border-emerald-700 transition-colors"
                            title={`Calculate 30-day cost for ${m.name}`}
                          >
                            <Calculator className="h-3.5 w-3.5 text-emerald-800" />
                            <span>Calc</span>
                          </Link>
                          <Link
                            href={`/compare?models=${encodeURIComponent(m.slug)}`}
                            className="hidden sm:inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-colors"
                            title={`Compare ${m.name}`}
                          >
                            <Scale className="h-3.5 w-3.5 text-slate-700" />
                            <span>Compare</span>
                          </Link>
                          <Link
                            href={`/models/${m.slug}`}
                            className="inline-flex h-8 items-center gap-0.5 rounded-lg bg-slate-900 px-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                          >
                            <span>Specs</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
