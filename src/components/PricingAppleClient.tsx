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
  Scale,
  Server,
  Sparkles,
  Image as ImageIcon,
  CreditCard,
  History,
  Coins,
} from 'lucide-react';

type PricingSection =
  | 'llm-pricing'
  | 'cheapest-models'
  | 'image-models'
  | 'ai-subscriptions'
  | 'price-history';

type TierSegment = 'all' | 'frontier' | 'workhorse' | 'economy' | 'open';
type SortField = 'blended' | 'input' | 'output' | 'cached' | 'speed';

interface SubscriptionPlan {
  id: string;
  provider: string;
  planName: string;
  monthlyPriceUsd: number;
  billingCadence: string;
  summary: string;
  apiEquivalentTokensM: string;
  bestFor: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'chatgpt-plus',
    provider: 'OpenAI',
    planName: 'ChatGPT Plus',
    monthlyPriceUsd: 20,
    billingCadence: 'Monthly',
    summary: 'Web & mobile frontier chat, reasoning access, image generation, and workspace tools.',
    apiEquivalentTokensM: '~2M–4M blended tokens',
    bestFor: 'Interactive drafting, research & ad-hoc prototyping',
  },
  {
    id: 'claude-pro',
    provider: 'Anthropic',
    planName: 'Claude Pro',
    monthlyPriceUsd: 20,
    billingCadence: 'Monthly',
    summary: 'Extended Claude web & desktop usage, code analysis, and document workspaces.',
    apiEquivalentTokensM: '~1.5M–3.5M blended tokens',
    bestFor: 'Long-document synthesis & pair programming sessions',
  },
  {
    id: 'gemini-advanced',
    provider: 'Google',
    planName: 'Google AI Pro',
    monthlyPriceUsd: 19.99,
    billingCadence: 'Monthly',
    summary: 'Gemini web app access, long-context document workflows, and Google Workspace integration.',
    apiEquivalentTokensM: '~2M–5M blended tokens',
    bestFor: 'Large-context ingestion & daily productivity',
  },
  {
    id: 'perplexity-pro',
    provider: 'Perplexity',
    planName: 'Perplexity Pro',
    monthlyPriceUsd: 20,
    billingCadence: 'Monthly',
    summary: 'Cited real-time web search, multi-model switching, and file uploads.',
    apiEquivalentTokensM: 'Search-augmented queries',
    bestFor: 'Live web citations & market/technical lookup',
  },
];

function fmtUsd(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

function fmtCachedMultiplier(
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
  if (ratio <= 0.001) return '0.00× input';
  if (ratio < 0.99) return `${ratio.toFixed(2)}× input`;
  return '1.00× input';
}

export function PricingAppleClient({ models }: { models: CatalogModel[] }) {
  const [section, setSection] = useState<PricingSection>('llm-pricing');
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [tier, setTier] = useState<TierSegment>('all');
  const [selectedHost, setSelectedHost] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cachePct, setCachePct] = useState<number>(50);
  const [outputSharePct, setOutputSharePct] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortField>('blended');

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m.provider) set.add(m.provider);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
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

  const handleSectionSelect = (next: PricingSection) => {
    setSection(next);
    if (next === 'cheapest-models') {
      setTier('economy');
      setEndpointMode('cheapest');
      setSortBy('blended');
    } else if (next === 'llm-pricing') {
      setTier('all');
      setSortBy('blended');
    }
  };

  const evaluatedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const outFrac = Math.max(0, Math.min(80, outputSharePct)) / 100;
    const inFrac = 1 - outFrac;
    const cacheFrac = Math.max(0, Math.min(100, cachePct)) / 100;

    return models
      .map((model) => {
        const evalRes = evaluateModelEndpoints(model, {
          inputTokensPerCall: 8000,
          outputTokensPerCall: 600,
          callsPerDay: 2000,
          cacheHitPercent: cachePct,
          batchPercent: 0,
        });

        let quote =
          endpointMode === 'first-party'
            ? evalRes.firstPartyQuote
            : evalRes.cheapestQuote;

        if (selectedHost !== 'all') {
          const found = evalRes.quotes.find((item) => item.endpoint.host === selectedHost);
          if (!found) return null;
          quote = found;
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

        const effectiveIn =
          inRate !== null
            ? cachedRate !== null
              ? inRate * (1 - cacheFrac) + cachedRate * cacheFrac
              : inRate
            : null;

        const blendedPer1M =
          effectiveIn !== null && outRate !== null
            ? effectiveIn * inFrac + outRate * outFrac
            : effectiveIn ?? outRate ?? Number.POSITIVE_INFINITY;

        const officialMonthly = evalRes.firstPartyQuote.breakdown.monthlyTotalCost;
        const currentMonthly = quote.breakdown.monthlyTotalCost;
        const hostSavingsPct =
          typeof officialMonthly === 'number' &&
          typeof currentMonthly === 'number' &&
          officialMonthly > 0 &&
          currentMonthly < officialMonthly
            ? Math.round(((officialMonthly - currentMonthly) / officialMonthly) * 100)
            : 0;

        return {
          model,
          quote,
          endpointCount: evalRes.quotes.length,
          inRate,
          cachedRate,
          outRate,
          blendedPer1M,
          hostSavingsPct,
          cacheMultLabel: fmtCachedMultiplier(inRate, cachedRate),
          tokPerSec: quote.tokPerSec ?? null,
          latencyMs: quote.latencyMs ?? null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(({ model, inRate }) => {
        if (selectedProvider !== 'all' && model.provider !== selectedProvider) return false;
        if (tier === 'open' && model.license !== 'Open') return false;
        if (tier === 'frontier' && !((model.score ?? 0) >= 85 || (inRate !== null && inRate >= 3.0))) {
          return false;
        }
        if (tier === 'workhorse' && (inRate === null || inRate < 0.5 || inRate >= 3.0)) {
          return false;
        }
        if (tier === 'economy' && (inRate === null || inRate >= 0.5)) {
          return false;
        }

        if (!q) return true;
        const hostNames = Array.isArray(model.hostingEndpoints)
          ? model.hostingEndpoints.map((ep) => ep.host.toLowerCase()).join(' ')
          : '';
        return (
          model.name.toLowerCase().includes(q) ||
          model.provider.toLowerCase().includes(q) ||
          model.slug.toLowerCase().includes(q) ||
          hostNames.includes(q)
        );
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
        if (sortBy === 'speed') {
          return (b.tokPerSec ?? -1) - (a.tokPerSec ?? -1);
        }
        return a.blendedPer1M - b.blendedPer1M;
      });
  }, [models, query, tier, selectedProvider, selectedHost, endpointMode, cachePct, outputSharePct, sortBy]);

  const imageCapableModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (selectedProvider !== 'all' && m.provider !== selectedProvider) return false;
      const mods = Array.isArray(m.modalities) ? m.modalities.map((x) => x.toLowerCase()) : [];
      const supportsImage =
        mods.some((x) => x.includes('image') || x.includes('vision')) ||
        /vision|image|flux|gpt-4o|gpt-5|gpt-6|claude|gemini/i.test(`${m.name} ${m.slug}`);
      if (!supportsImage) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
      );
    });
  }, [models, query, selectedProvider]);

  const historyModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...models]
      .filter((m) => {
        if (selectedProvider !== 'all' && m.provider !== selectedProvider) return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dA = a.pricingProvenance?.lastVerified ?? '';
        const dB = b.pricingProvenance?.lastVerified ?? '';
        return dB.localeCompare(dA);
      });
  }, [models, query, selectedProvider]);

  const navItems: Array<{
    id: PricingSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'llm-pricing', label: 'LLM Pricing', icon: Coins },
    { id: 'cheapest-models', label: 'Cheapest Models', icon: Sparkles },
    { id: 'image-models', label: 'Image Models', icon: ImageIcon },
    { id: 'ai-subscriptions', label: 'AI Subscriptions', icon: CreditCard },
    { id: 'price-history', label: 'Price History', icon: History },
  ];

  const tierOptions: Array<{ id: TierSegment; label: string }> = [
    { id: 'all', label: 'All Models' },
    { id: 'frontier', label: 'Frontier' },
    { id: 'workhorse', label: 'Workhorse' },
    { id: 'economy', label: 'Economy (<$0.50)' },
    { id: 'open', label: 'Open-Weight' },
  ];

  const showTokenTable = section === 'llm-pricing' || section === 'cheapest-models';

  return (
    <div className="space-y-8">
      {/* Segmented Control Bar (Apple-inspired calm hairline bar) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div
          role="tablist"
          aria-label="Pricing sections"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/90 p-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSectionSelect(item.id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-slate-950 shadow-2xs ring-1 ring-slate-200/90'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {showTokenTable && (
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/90 p-1 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setEndpointMode('cheapest')}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                endpointMode === 'cheapest'
                  ? 'bg-white text-slate-950 shadow-2xs ring-1 ring-slate-200/90'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Cheapest Endpoint
            </button>
            <button
              type="button"
              onClick={() => setEndpointMode('first-party')}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                endpointMode === 'first-party'
                  ? 'bg-white text-slate-950 shadow-2xs ring-1 ring-slate-200/90'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              First-Party API
            </button>
          </div>
        )}
      </div>

      {/* Filter & Blend Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by model, provider, or endpoint..."
            aria-label="Filter models, providers, or endpoints"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            aria-label="Filter by provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-400 focus:outline-none"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {showTokenTable ? (
          <>
            <div className="lg:col-span-2">
              <select
                aria-label="Filter by hosting endpoint"
                value={selectedHost}
                onChange={(e) => setSelectedHost(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-400 focus:outline-none"
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
              <select
                aria-label="Sort models"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                <option value="blended">Sort: Blended / 1M</option>
                <option value="input">Sort: Input / 1M</option>
                <option value="cached">Sort: Cached / 1M</option>
                <option value="output">Sort: Output / 1M</option>
                <option value="speed">Sort: Throughput</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 h-10 text-xs">
              <label className="flex items-center gap-1 text-slate-700 font-medium">
                <span>Cache</span>
                <select
                  aria-label="Prompt cache hit percentage"
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

              <span className="text-slate-300">|</span>

              <label className="flex items-center gap-1 text-slate-700 font-medium">
                <span>Out</span>
                <select
                  aria-label="Output token share percentage"
                  value={outputSharePct}
                  onChange={(e) => setOutputSharePct(Number(e.target.value))}
                  className="bg-transparent font-mono font-semibold text-slate-950 focus:outline-none"
                >
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                  <option value={35}>35%</option>
                  <option value={50}>50%</option>
                </select>
              </label>
            </div>
          </>
        ) : (
          <div className="lg:col-span-6 flex items-center justify-end text-xs text-slate-600">
            Showing {section === 'image-models' ? 'multimodal & vision-capable catalog entries' : section === 'ai-subscriptions' ? 'consumer & pro subscription plans' : 'catalog verification & rate provenance dates'}
          </div>
        )}
      </div>

      {/* SECTION 1 & 2: LLM PRICING / CHEAPEST MODELS */}
      {showTokenTable && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {tierOptions.map((t) => {
                const active = tier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    aria-pressed={active}
                    className={`h-8 rounded-full px-3 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{evaluatedRows.length}</span> models ·{' '}
              Blended = {100 - outputSharePct}% in ({cachePct}% cached) + {outputSharePct}% out
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <caption className="sr-only">
                LLM API token pricing per 1 million tokens across models, endpoints, cache discounts, and speed
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600">
                  <th scope="col" className="py-3 px-4">Model</th>
                  <th scope="col" className="py-3 px-3 hidden lg:table-cell">Endpoint</th>
                  <th scope="col" className="py-3 px-3">Input / 1M</th>
                  <th scope="col" className="py-3 px-3 hidden md:table-cell">Cached / 1M</th>
                  <th scope="col" className="py-3 px-3">Output / 1M</th>
                  <th scope="col" className="py-3 px-3">Blended / 1M</th>
                  <th scope="col" className="py-3 px-3 hidden sm:table-cell text-right">Speed</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {evaluatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-4 text-center text-sm text-slate-600">
                      No models match the current filter criteria.
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
                      hostSavingsPct,
                      cacheMultLabel,
                      tokPerSec,
                      latencyMs,
                    }) => {
                      const statusRaw =
                        quote.endpoint.evidenceStatus ?? m.pricingProvenance?.status;
                      const statusLabel =
                        statusRaw === 'Verified'
                          ? 'Verified Pricing'
                          : statusRaw === 'Estimated'
                          ? 'Estimated (Unverified)'
                          : 'Pricing Unavailable';

                      return (
                        <tr key={m.id} className="pb-clean-row align-middle">
                          <th scope="row" className="py-3.5 px-4 font-normal text-left">
                            <div className="flex items-center gap-3">
                              <ProviderLogo
                                provider={m.provider}
                                modelName={m.name}
                                modelSlug={m.slug}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/models/${m.slug}`}
                                    className="font-semibold text-slate-950 hover:underline underline-offset-2 truncate"
                                  >
                                    {m.name}
                                  </Link>
                                  {m.license === 'Open' && (
                                    <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                                      Open
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                                  <span>{m.provider}</span>
                                  <span>·</span>
                                  <span
                                    className={
                                      statusRaw === 'Verified'
                                        ? 'font-medium text-emerald-800'
                                        : 'font-medium text-amber-800'
                                    }
                                  >
                                    {statusLabel}
                                  </span>
                                  {m.contextWindow && (
                                    <>
                                      <span>·</span>
                                      <span className="font-mono text-slate-700">
                                        {m.contextWindow}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </th>

                          <td className="py-3.5 px-3 hidden lg:table-cell">
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900">
                              <Server className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{quote.endpoint.host}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-600">
                              {endpointCount} {endpointCount === 1 ? 'endpoint' : 'endpoints'}
                              {hostSavingsPct > 0 && (
                                <span className="ml-1.5 font-semibold text-emerald-800">
                                  -{hostSavingsPct}% vs official
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs sm:text-sm font-medium text-slate-950 tabular-nums">
                            {fmtUsd(inRate)}
                          </td>

                          <td className="py-3.5 px-3 hidden md:table-cell font-mono text-xs sm:text-sm tabular-nums">
                            <div className="font-medium text-emerald-800">{fmtUsd(cachedRate)}</div>
                            {cacheMultLabel && (
                              <div className="text-[11px] text-slate-600">{cacheMultLabel}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs sm:text-sm font-medium text-slate-950 tabular-nums">
                            {fmtUsd(outRate)}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs sm:text-sm font-semibold text-slate-950 tabular-nums">
                            {Number.isFinite(blendedPer1M) ? fmtUsd(blendedPer1M) : 'N/A'}
                          </td>

                          <td className="py-3.5 px-3 hidden sm:table-cell text-right font-mono text-xs tabular-nums">
                            {typeof tokPerSec === 'number' ? (
                              <div className="font-medium text-slate-900">~{tokPerSec} tok/s</div>
                            ) : (
                              <div className="text-slate-600">N/A</div>
                            )}
                            {typeof latencyMs === 'number' && (
                              <div className="text-[11px] text-slate-600">&lt;{latencyMs}ms</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/?model=${encodeURIComponent(m.slug)}#estimator`}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                              >
                                <Calculator className="h-3.5 w-3.5 text-slate-600" />
                                <span>Calc</span>
                              </Link>
                              <Link
                                href={`/compare?models=${encodeURIComponent(m.slug)}`}
                                className="hidden sm:inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Scale className="h-3.5 w-3.5 text-slate-500" />
                                <span>Compare</span>
                              </Link>
                              <Link
                                href={`/models/${m.slug}`}
                                className="inline-flex h-8 items-center gap-0.5 rounded-lg bg-slate-900 px-2.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
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
      )}

      {/* SECTION 3: IMAGE MODELS (Honest N/A when per-image rate isn't in catalog) */}
      {section === 'image-models' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            PromptBill&apos;s primary ledger tracks per-1M-token text/API rates. Dedicated per-image or per-megapixel generation rates are displayed when recorded in the catalog and shown as <strong className="font-mono text-slate-950">N/A</strong> when not tracked.
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600">
                  <th scope="col" className="py-3 px-4">Model</th>
                  <th scope="col" className="py-3 px-3">Provider</th>
                  <th scope="col" className="py-3 px-3">Input / 1M</th>
                  <th scope="col" className="py-3 px-3">Output / 1M</th>
                  <th scope="col" className="py-3 px-3">Per-Image Rate</th>
                  <th scope="col" className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {imageCapableModels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-sm text-slate-600">
                      No vision or image-capable catalog models match your current filter.
                    </td>
                  </tr>
                ) : (
                  imageCapableModels.map((m) => (
                    <tr key={m.id} className="pb-clean-row">
                      <th scope="row" className="py-3.5 px-4 font-normal text-left">
                        <div className="flex items-center gap-3">
                          <ProviderLogo
                            provider={m.provider}
                            modelName={m.name}
                            modelSlug={m.slug}
                            size="sm"
                          />
                          <Link
                            href={`/models/${m.slug}`}
                            className="font-semibold text-slate-950 hover:underline underline-offset-2"
                          >
                            {m.name}
                          </Link>
                        </div>
                      </th>
                      <td className="py-3.5 px-3 text-xs text-slate-700">{m.provider}</td>
                      <td className="py-3.5 px-3 font-mono text-xs sm:text-sm text-slate-900">
                        {fmtUsd(m.inputPer1M)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs sm:text-sm text-slate-900">
                        {fmtUsd(m.outputPer1M)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs sm:text-sm text-slate-600">
                        N/A
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/models/${m.slug}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: AI SUBSCRIPTIONS */}
      {section === 'ai-subscriptions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            Flat monthly subscriptions suit interactive chat and browser workflows, whereas pay-as-you-go token APIs scale directly with automated request volume, caching, and batch discounts.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <ProviderLogo provider={plan.provider} size="sm" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">{plan.planName}</h3>
                        <p className="text-xs text-slate-600">{plan.provider}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-lg font-semibold text-slate-950">
                        ${plan.monthlyPriceUsd.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-600">{plan.billingCadence}</div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                    {plan.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    API feel: <strong className="font-mono text-slate-900">{plan.apiEquivalentTokensM}</strong>
                  </span>
                  <span>{plan.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: PRICE HISTORY & CATALOG VERIFICATION LOG */}
      {section === 'price-history' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            Verification timestamps and provenance records from the current catalog snapshot. Historical delta rows show <strong className="font-mono text-slate-950">N/A</strong> where prior-period rate snapshots are not recorded.
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600">
                  <th scope="col" className="py-3 px-4">Model</th>
                  <th scope="col" className="py-3 px-3">Last Verified</th>
                  <th scope="col" className="py-3 px-3">Provenance</th>
                  <th scope="col" className="py-3 px-3">Current In / 1M</th>
                  <th scope="col" className="py-3 px-3">Current Out / 1M</th>
                  <th scope="col" className="py-3 px-4 text-right">Prior Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {historyModels.map((m) => {
                  const verifiedDate = m.pricingProvenance?.lastVerified
                    ? m.pricingProvenance.lastVerified.slice(0, 10)
                    : 'N/A';
                  const statusStr = m.pricingProvenance?.status ?? 'Estimated';
                  return (
                    <tr key={m.id} className="pb-clean-row">
                      <th scope="row" className="py-3 px-4 font-normal text-left">
                        <div className="flex items-center gap-2.5">
                          <ProviderLogo
                            provider={m.provider}
                            modelName={m.name}
                            modelSlug={m.slug}
                            size="sm"
                          />
                          <div>
                            <Link
                              href={`/models/${m.slug}`}
                              className="font-semibold text-slate-950 hover:underline underline-offset-2"
                            >
                              {m.name}
                            </Link>
                            <div className="text-xs text-slate-600">{m.provider}</div>
                          </div>
                        </div>
                      </th>
                      <td className="py-3 px-3 font-mono text-xs text-slate-800">{verifiedDate}</td>
                      <td className="py-3 px-3 text-xs">
                        <span
                          className={
                            statusStr === 'Verified'
                              ? 'font-medium text-emerald-800'
                              : 'font-medium text-amber-800'
                          }
                        >
                          {statusStr}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs sm:text-sm font-medium text-slate-950">
                        {fmtUsd(m.inputPer1M)}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs sm:text-sm font-medium text-slate-950">
                        {fmtUsd(m.outputPer1M)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                        N/A
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
