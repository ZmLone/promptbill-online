'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  evaluateModelEndpoints,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';

type TabKey =
  | 'llm-pricing'
  | 'cheapest-models'
  | 'image-models'
  | 'ai-subscriptions'
  | 'price-history';

type TierKey = 'all' | 'frontier' | 'workhorse' | 'economy' | 'open';
type SortKey = 'blended' | 'input' | 'output' | 'cached';

interface SubscriptionRow {
  id: string;
  provider: string;
  plan: string;
  priceMonthly: string;
  billing: string;
  apiEquivalence: string;
}

const SUBSCRIPTIONS: SubscriptionRow[] = [
  {
    id: 'openai-plus',
    provider: 'OpenAI',
    plan: 'ChatGPT Plus',
    priceMonthly: '$20.00',
    billing: 'Monthly',
    apiEquivalence: '~2M–4M blended tokens',
  },
  {
    id: 'anthropic-pro',
    provider: 'Anthropic',
    plan: 'Claude Pro',
    priceMonthly: '$20.00',
    billing: 'Monthly',
    apiEquivalence: '~1.5M–3.5M blended tokens',
  },
  {
    id: 'google-ai-pro',
    provider: 'Google',
    plan: 'Google AI Pro',
    priceMonthly: '$19.99',
    billing: 'Monthly',
    apiEquivalence: '~2M–5M blended tokens',
  },
  {
    id: 'perplexity-pro',
    provider: 'Perplexity',
    plan: 'Perplexity Pro',
    priceMonthly: '$20.00',
    billing: 'Monthly',
    apiEquivalence: 'Search-assisted queries',
  },
];

function fmtPrice(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

export function PricingCleanClient({ models }: { models: CatalogModel[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>('llm-pricing');
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [tier, setTier] = useState<TierKey>('all');
  const [provider, setProvider] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cachePct, setCachePct] = useState<number>(50);
  const [outputPct, setOutputPct] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortKey>('blended');

  const providers = useMemo(() => {
    const unique = new Set<string>();
    for (const m of models) {
      if (m.provider) unique.add(m.provider);
    }
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [models]);

  const selectTab = (next: TabKey) => {
    setActiveTab(next);
    if (next === 'cheapest-models') {
      setTier('economy');
      setSortBy('blended');
    } else if (next === 'llm-pricing') {
      setTier('all');
      setSortBy('blended');
    }
  };

  const tokenRows = useMemo(() => {
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

  const imageRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (provider !== 'all' && m.provider !== provider) return false;
      const matchesMedia = /vision|image|flux|gpt-4o|gpt-5|gpt-6|claude|gemini/i.test(
        `${m.name} ${m.slug}`
      );
      if (!matchesMedia) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
      );
    });
  }, [models, provider, query]);

  const historyRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...models]
      .filter((m) => {
        if (provider !== 'all' && m.provider !== provider) return false;
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
  }, [models, provider, query]);

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'llm-pricing', label: 'LLM Pricing' },
    { id: 'cheapest-models', label: 'Cheapest Models' },
    { id: 'image-models', label: 'Image Models' },
    { id: 'ai-subscriptions', label: 'AI Subscriptions' },
    { id: 'price-history', label: 'Price History' },
  ];

  const tiers: Array<{ id: TierKey; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'frontier', label: 'Frontier' },
    { id: 'workhorse', label: 'Workhorse' },
    { id: 'economy', label: 'Economy' },
    { id: 'open', label: 'Open' },
  ];

  const isTokenMode = activeTab === 'llm-pricing' || activeTab === 'cheapest-models';

  return (
    <div className="space-y-6">
      {/* Centered Category Switcher */}
      <div className="flex flex-col items-center gap-3">
        <div
          role="tablist"
          aria-label="Pricing categories"
          className="inline-flex flex-wrap items-center justify-center gap-1 border-b border-slate-200 pb-3"
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={`h-9 px-4 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-[13px] ${
                  active
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-950'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Uniform Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center py-2">
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

        {isTokenMode ? (
          <>
            <select
              aria-label="Endpoint mode"
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
                  aria-label="Cache hit share"
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
                  aria-label="Output share"
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
          </>
        ) : (
          <div className="lg:col-span-3 h-10 flex items-center justify-end text-xs text-slate-600">
            {activeTab === 'image-models'
              ? `${imageRows.length} entries`
              : activeTab === 'ai-subscriptions'
              ? `${SUBSCRIPTIONS.length} plans`
              : `${historyRows.length} catalog records`}
          </div>
        )}
      </div>

      {/* Tier Filter Row for LLM / Cheapest Views */}
      {isTokenMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-1.5">
            {tiers.map((item) => {
              const active = tier === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTier(item.id)}
                  className={`h-8 px-3 text-xs font-medium transition-colors cursor-pointer border ${
                    active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <span>
            {tokenRows.length} models · Blended ({100 - outputPct}% in at {cachePct}% cache +{' '}
            {outputPct}% out)
          </span>
        </div>
      )}

      {/* 1 & 2: UNIFORM LLM / CHEAPEST PRICING TABLE */}
      {isTokenMode && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4 hidden lg:table-cell">Endpoint</th>
                <th scope="col" className="py-3 px-4">Input / 1M</th>
                <th scope="col" className="py-3 px-4 hidden sm:table-cell">Cached / 1M</th>
                <th scope="col" className="py-3 px-4">Output / 1M</th>
                <th scope="col" className="py-3 px-4 hidden md:table-cell">Blended / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {tokenRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching models found.
                  </td>
                </tr>
              ) : (
                tokenRows.map(
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
                      <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(inRate)}</td>
                      <td className="py-3 px-4 text-emerald-800 hidden sm:table-cell tabular-nums">
                        {fmtPrice(cachedRate)}
                      </td>
                      <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(outRate)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-950 hidden md:table-cell tabular-nums">
                        {Number.isFinite(blendedRate) ? fmtPrice(blendedRate) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 tabular-nums">
                        {m.contextWindow ?? 'N/A'}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3: UNIFORM IMAGE MODELS TABLE */}
      {activeTab === 'image-models' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4">Input / 1M</th>
                <th scope="col" className="py-3 px-4">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Per-Image Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {imageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching image or multimodal models found.
                  </td>
                </tr>
              ) : (
                imageRows.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <th scope="row" className="py-3 px-4 font-sans font-semibold text-left text-slate-950">
                      <Link href={`/models/${m.slug}`} className="hover:underline underline-offset-2">
                        {m.name}
                      </Link>
                    </th>
                    <td className="py-3 px-4 font-sans text-xs text-slate-700">{m.provider}</td>
                    <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(m.inputPer1M)}</td>
                    <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(m.outputPer1M)}</td>
                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">N/A</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4: UNIFORM AI SUBSCRIPTIONS TABLE */}
      {activeTab === 'ai-subscriptions' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Plan</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4">Billing</th>
                <th scope="col" className="py-3 px-4">API Token Reference</th>
                <th scope="col" className="py-3 px-4 text-right">Monthly Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {SUBSCRIPTIONS.map((sub, idx) => (
                <tr
                  key={sub.id}
                  className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <th scope="row" className="py-3 px-4 font-sans font-semibold text-left text-slate-950">
                    {sub.plan}
                  </th>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{sub.provider}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{sub.billing}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{sub.apiEquivalence}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-950 tabular-nums">
                    {sub.priceMonthly}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5: UNIFORM PRICE HISTORY TABLE */}
      {activeTab === 'price-history' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Last Verified</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4">Input / 1M</th>
                <th scope="col" className="py-3 px-4">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Prior Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {historyRows.map((m, idx) => {
                const dateStr = m.pricingProvenance?.lastVerified
                  ? m.pricingProvenance.lastVerified.slice(0, 10)
                  : 'N/A';
                const statusStr = m.pricingProvenance?.status ?? 'Estimated';
                return (
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
                      <div className="text-xs text-slate-600">{m.provider}</div>
                    </th>
                    <td className="py-3 px-4 text-xs text-slate-800 tabular-nums">{dateStr}</td>
                    <td className="py-3 px-4 font-sans text-xs">
                      <span className={statusStr === 'Verified' ? 'text-emerald-800 font-medium' : 'text-amber-800 font-medium'}>
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(m.inputPer1M)}</td>
                    <td className="py-3 px-4 text-slate-950 tabular-nums">{fmtPrice(m.outputPer1M)}</td>
                    <td className="py-3 px-4 text-right text-xs text-slate-600 tabular-nums">N/A</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
