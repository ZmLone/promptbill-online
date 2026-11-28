'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  evaluateModelEndpoints,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';

export type PricingTabId =
  | 'llm-pricing'
  | 'cheapest-models'
  | 'image-models'
  | 'ai-subscriptions'
  | 'price-history';

type TierId = 'all' | 'frontier' | 'workhorse' | 'economy' | 'open';
type SortId = 'blended' | 'input' | 'output' | 'cached';

interface TabMeta {
  id: PricingTabId;
  label: string;
  heading: string;
  description: string;
  geoAnswer: string;
  geoQuestion: string;
}

const TAB_CONFIG: Record<PricingTabId, TabMeta> = {
  'llm-pricing': {
    id: 'llm-pricing',
    label: 'LLM Pricing',
    heading: 'LLM API Token Pricing',
    description:
      'Compare per-1M-token input, cached input, output, and workload-blended rates across official APIs and inference hosts.',
    geoQuestion: 'How does PromptBill calculate blended LLM token pricing per 1 million tokens?',
    geoAnswer:
      'Blended cost per 1M tokens combines input tokens (adjusted by your selected prompt cache hit rate) and output tokens according to your output share, letting engineers compare true workload economics rather than sticker input price alone.',
  },
  'cheapest-models': {
    id: 'cheapest-models',
    label: 'Cheapest Models',
    heading: 'Lowest-Cost LLM API Models',
    description:
      'Rank economy and low-cost API models by blended token cost per 1M tokens across available endpoints.',
    geoQuestion: 'Which API models have the lowest blended cost per 1 million tokens on PromptBill?',
    geoAnswer:
      'Models with low input and output rates—especially when paired with high prompt-cache hit ratios or lower-cost hosting endpoints—rank lowest in blended cost per 1M tokens, while models lacking verified rates display N/A.',
  },
  'image-models': {
    id: 'image-models',
    label: 'Image Models',
    heading: 'Vision & Image-Capable Models',
    description:
      'Review multimodal and vision-capable catalog models alongside token rates and per-image availability.',
    geoQuestion: 'How does PromptBill display image model pricing when per-image rates are not listed?',
    geoAnswer:
      'When a catalog entry tracks text/multimodal token pricing without a dedicated per-image generation rate in the current snapshot, token rates are shown where available and per-image pricing is explicitly reported as N/A.',
  },
  'ai-subscriptions': {
    id: 'ai-subscriptions',
    label: 'AI Subscriptions',
    heading: 'Monthly AI Subscriptions vs. Token APIs',
    description:
      'Compare flat monthly subscription plans against pay-as-you-go token pricing for interactive and programmatic workloads.',
    geoQuestion: 'When is a monthly AI subscription more cost-effective than pay-as-you-go token APIs?',
    geoAnswer:
      'Flat monthly subscriptions suit regular interactive chat and browser workflows, whereas pay-as-you-go token APIs scale with automated request volume, prompt caching, and batch processing.',
  },
  'price-history': {
    id: 'price-history',
    label: 'Price History',
    heading: 'Catalog Verification & Price History',
    description:
      'Inspect catalog verification dates, provenance status, and current per-1M-token rates across tracked models.',
    geoQuestion: 'How does PromptBill track model pricing updates and verification status?',
    geoAnswer:
      'Each catalog row records its current per-1M-token rates, provenance status (Verified or Estimated), and last verification date, displaying N/A when prior historical price deltas are not recorded.',
  },
};

interface SubscriptionEntry {
  id: string;
  provider: string;
  plan: string;
  billing: string;
  monthlyPrice: string;
  apiComparison: string;
}

const SUBSCRIPTION_ROWS: SubscriptionEntry[] = [
  {
    id: 'openai-plus',
    provider: 'OpenAI',
    plan: 'ChatGPT Plus',
    billing: 'Monthly',
    monthlyPrice: '$20.00',
    apiComparison: '~2M–4M blended tokens',
  },
  {
    id: 'anthropic-pro',
    provider: 'Anthropic',
    plan: 'Claude Pro',
    billing: 'Monthly',
    monthlyPrice: '$20.00',
    apiComparison: '~1.5M–3.5M blended tokens',
  },
  {
    id: 'google-ai-pro',
    provider: 'Google',
    plan: 'Google AI Pro',
    billing: 'Monthly',
    monthlyPrice: '$19.99',
    apiComparison: '~2M–5M blended tokens',
  },
  {
    id: 'perplexity-pro',
    provider: 'Perplexity',
    plan: 'Perplexity Pro',
    billing: 'Monthly',
    monthlyPrice: '$20.00',
    apiComparison: 'Search-assisted queries',
  },
];

function fmtRate(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

export function PricingCleanClient({
  models,
  initialTab = 'llm-pricing',
}: {
  models: CatalogModel[];
  initialTab?: PricingTabId;
}) {
  const [activeTab, setActiveTab] = useState<PricingTabId>(initialTab);
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [tier, setTier] = useState<TierId>(
    initialTab === 'cheapest-models' ? 'economy' : 'all'
  );
  const [provider, setProvider] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [cachePct, setCachePct] = useState<number>(50);
  const [outputPct, setOutputPct] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortId>('blended');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (
      hash === 'llm-pricing' ||
      hash === 'cheapest-models' ||
      hash === 'image-models' ||
      hash === 'ai-subscriptions' ||
      hash === 'price-history'
    ) {
      setActiveTab(hash);
      if (hash === 'cheapest-models') {
        setTier('economy');
        setSortBy('blended');
      }
    }
  }, []);

  const handleSelectTab = (tab: PricingTabId) => {
    setActiveTab(tab);
    if (tab === 'cheapest-models') {
      setTier('economy');
      setSortBy('blended');
    } else if (tab === 'llm-pricing') {
      setTier('all');
      setSortBy('blended');
    }
    if (typeof window !== 'undefined') {
      const nextUrl = `${window.location.pathname}${window.location.search}#${tab}`;
      window.history.replaceState(null, '', nextUrl);
    }
  };

  const providers = useMemo(() => {
    const names = new Set<string>();
    for (const m of models) {
      if (m.provider) names.add(m.provider);
    }
    return ['all', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [models]);

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

  const currentMeta = TAB_CONFIG[activeTab];
  const isTokenView = activeTab === 'llm-pricing' || activeTab === 'cheapest-models';

  const dynamicSectionJsonLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: currentMeta.geoQuestion,
          acceptedAnswer: {
            '@type': 'Answer',
            text: currentMeta.geoAnswer,
          },
        },
      ],
    };
  }, [currentMeta]);

  const tierButtons: Array<{ id: TierId; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'frontier', label: 'Frontier' },
    { id: 'workhorse', label: 'Workhorse' },
    { id: 'economy', label: 'Economy' },
    { id: 'open', label: 'Open' },
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicSectionJsonLd) }}
      />

      {/* Centered Tab Navigation */}
      <div className="flex justify-center border-b border-slate-200 pb-3">
        <div
          role="tablist"
          aria-label="Pricing views"
          className="inline-flex flex-wrap items-center justify-center gap-2"
        >
          {(Object.keys(TAB_CONFIG) as PricingTabId[]).map((tabKey) => {
            const cfg = TAB_CONFIG[tabKey];
            const active = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectTab(tabKey)}
                className={`h-9 px-4 text-sm transition-colors cursor-pointer border-b-2 -mb-[13px] ${
                  active
                    ? 'border-slate-950 font-semibold text-slate-950'
                    : 'border-transparent font-medium text-slate-600 hover:text-slate-950'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic View Context Header (Updates completely when switching tabs) */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
          {currentMeta.heading}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">{currentMeta.description}</p>
      </div>

      {/* Uniform Filter Controls */}
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

        {isTokenView ? (
          <>
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
              onChange={(e) => setSortBy(e.target.value as SortId)}
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
          </>
        ) : (
          <div className="lg:col-span-3 h-10 flex items-center justify-end text-xs text-slate-600 tabular-nums">
            {activeTab === 'image-models'
              ? `${imageRows.length} models`
              : activeTab === 'ai-subscriptions'
              ? `${SUBSCRIPTION_ROWS.length} plans`
              : `${historyRows.length} records`}
          </div>
        )}
      </div>

      {/* Tier Filter Row for Token Views */}
      {isTokenView && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
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
          <span className="tabular-nums">
            {tokenRows.length} models · {100 - outputPct}% in ({cachePct}% cached) + {outputPct}% out
          </span>
        </div>
      )}

      {/* VIEW 1 & 2: LLM PRICING / CHEAPEST MODELS TABLE */}
      {isTokenView && (
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
                <th scope="col" className="py-3 px-4 text-right">Calculator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {tokenRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
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
                          Simulate
                        </Link>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: IMAGE MODELS TABLE */}
      {activeTab === 'image-models' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Per-Image Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {imageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching vision or image-capable models found.
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
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.inputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.outputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">N/A</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 4: AI SUBSCRIPTIONS TABLE */}
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
              {SUBSCRIPTION_ROWS.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <th scope="row" className="py-3 px-4 font-sans font-semibold text-left text-slate-950">
                    {row.plan}
                  </th>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.provider}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.billing}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.apiComparison}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-950 tabular-nums">
                    {row.monthlyPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 5: PRICE HISTORY TABLE */}
      {activeTab === 'price-history' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Last Verified</th>
                <th scope="col" className="py-3 px-4">Provenance</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
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
                      <span
                        className={
                          statusStr === 'Verified'
                            ? 'text-emerald-800 font-medium'
                            : 'text-amber-800 font-medium'
                        }
                      >
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.inputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.outputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-600 tabular-nums">N/A</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* GEO Answer Block & Quiet Provenance Footnote at Bottom */}
      <div className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2">
        <h3 className="text-sm font-semibold text-slate-950">{currentMeta.geoQuestion}</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{currentMeta.geoAnswer}</p>
        <p className="pt-2 text-xs text-slate-600">
          Estimated entries lack a primary source timestamp in the current snapshot; missing values show N/A.{' '}
          <Link href="/methodology" className="underline underline-offset-2 text-slate-900 font-medium">
            Provenance &amp; Methodology
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
