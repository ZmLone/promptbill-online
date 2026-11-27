'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import { formatCurrency } from '../lib/pricingEngine';
import {
  evaluateModelEndpoints,
  getEndpointKey,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';
import { EndpointModeSwitcher } from './EndpointModeSwitcher';
import { ProviderLogo } from './ProviderLogo';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  Info,
  Server,
  Gauge,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface WorkloadPreset {
  id: string;
  label: string;
  detail: string;
  inputTokens: number;
  outputTokens: number;
  callsPerDay: number;
  cachePct: number;
  batchPct: number;
}

const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'chat',
    label: 'Support Chat',
    detail: '2K in · 400 out · 3K/day',
    inputTokens: 2000,
    outputTokens: 400,
    callsPerDay: 3000,
    cachePct: 20,
    batchPct: 0,
  },
  {
    id: 'rag',
    label: 'RAG / Doc Q&A',
    detail: '8K in · 600 out · 2K/day',
    inputTokens: 8000,
    outputTokens: 600,
    callsPerDay: 2000,
    cachePct: 50,
    batchPct: 0,
  },
  {
    id: 'coding',
    label: 'Code Agent',
    detail: '24K in · 1.5K out · 800/day',
    inputTokens: 24000,
    outputTokens: 1500,
    callsPerDay: 800,
    cachePct: 60,
    batchPct: 0,
  },
  {
    id: 'batch',
    label: 'Batch Classify',
    detail: '1.2K in · 80 out · 25K/day',
    inputTokens: 1200,
    outputTokens: 80,
    callsPerDay: 25000,
    cachePct: 0,
    batchPct: 100,
  },
];

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

export function HomeInteractiveWorkbench({
  models,
  externalSelectedSlug,
}: {
  models: CatalogModel[];
  externalSelectedSlug?: string | null;
}) {
  const defaultSlug = useMemo(() => {
    const preferred = models.find(
      (m) => m.slug === 'claude-sonnet-5-5' || m.slug === 'gemini-4-carbon'
    );
    return preferred?.slug ?? models[0]?.slug ?? '';
  }, [models]);

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultSlug);
  const [presetId, setPresetId] = useState<string>('rag');
  const [callsPerDay, setCallsPerDay] = useState<number>(2000);
  const [inputTokens, setInputTokens] = useState<number>(8000);
  const [outputTokens, setOutputTokens] = useState<number>(600);
  const [cachePct, setCachePct] = useState<number>(50);
  const [useBatch, setUseBatch] = useState<boolean>(false);
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [customHostKey, setCustomHostKey] = useState<string>('');

  useEffect(() => {
    if (externalSelectedSlug && models.some((m) => m.slug === externalSelectedSlug)) {
      setSelectedSlug(externalSelectedSlug);
    }
  }, [externalSelectedSlug, models]);

  const selectedModel = useMemo(
    () => models.find((m) => m.slug === selectedSlug) ?? models[0],
    [models, selectedSlug]
  );

  useEffect(() => {
    setCustomHostKey('');
  }, [selectedSlug]);

  const endpointEval = useMemo(() => {
    if (!selectedModel) return null;
    return evaluateModelEndpoints(selectedModel, {
      inputTokensPerCall: Math.max(0, inputTokens),
      outputTokensPerCall: Math.max(0, outputTokens),
      reasoningTokensPerCall: 0,
      callsPerDay: Math.max(0, callsPerDay),
      cacheHitPercent: cachePct,
      cacheWriteSharePercent: 0,
      batchPercent: useBatch ? 100 : 0,
      retriesPercent: 0,
    });
  }, [selectedModel, inputTokens, outputTokens, callsPerDay, cachePct, useBatch]);

  const activeQuote = useMemo(() => {
    if (!endpointEval) return null;
    if (customHostKey) {
      const matched = endpointEval.quotes.find(
        (q) => getEndpointKey(q.endpoint, q.index) === customHostKey
      );
      if (matched) return matched;
    }
    return endpointMode === 'first-party' || endpointMode === 'official'
      ? endpointEval.firstPartyQuote
      : endpointEval.cheapestQuote;
  }, [endpointEval, endpointMode, customHostKey]);

  const modelDropdownRows = useMemo(() => {
    return models.map((m) => {
      const evalPreview = evaluateModelEndpoints(m, {
        inputTokensPerCall: inputTokens,
        outputTokensPerCall: outputTokens,
        callsPerDay,
        cacheHitPercent: cachePct,
        batchPercent: useBatch ? 100 : 0,
      });
      const chosen =
        endpointMode === 'first-party'
          ? evalPreview.firstPartyQuote
          : evalPreview.cheapestQuote;
      return {
        model: m,
        chosen,
      };
    });
  }, [models, inputTokens, outputTokens, callsPerDay, cachePct, useBatch, endpointMode]);

  if (!selectedModel || !endpointEval || !activeQuote) return null;

  const breakdown = activeQuote.breakdown;
  const activeRates = activeQuote.modelView;
  const hasMultipleHosts = endpointEval.quotes.length > 1;

  const applyPreset = (p: WorkloadPreset) => {
    setPresetId(p.id);
    setInputTokens(p.inputTokens);
    setOutputTokens(p.outputTokens);
    setCallsPerDay(p.callsPerDay);
    setCachePct(p.cachePct);
    setUseBatch(p.batchPct > 0);
  };

  const handleModeSwitch = (nextMode: EndpointSelectionMode) => {
    setEndpointMode(nextMode);
    setCustomHostKey('');
  };

  const activeEvidence =
    activeQuote.endpoint.evidenceStatus ?? selectedModel.pricingProvenance.status;
  const isVerified = activeEvidence === 'Verified';

  const firstCost = endpointEval.firstPartyQuote.breakdown.monthlyTotalCost;
  const activeCost = breakdown.monthlyTotalCost;
  const monthlySavings =
    typeof firstCost === 'number' &&
    typeof activeCost === 'number' &&
    activeQuote.index !== endpointEval.firstPartyQuote.index &&
    firstCost - activeCost > 0.005
      ? firstCost - activeCost
      : 0;
  const savingsPct =
    monthlySavings > 0 && typeof firstCost === 'number' && firstCost > 0
      ? Math.round((monthlySavings / firstCost) * 100)
      : 0;

  return (
    <section
      id="estimator"
      aria-labelledby="quick-estimator-heading"
      className="pb-calculator-shell relative overflow-hidden rounded-[28px] bg-white p-5 sm:p-8 space-y-6"
    >
      {/* Vivid Diagonal Corner-to-Corner Colorful Wave (Top-Left Emerald/Cyan/Sky -> Bottom-Right Violet/Rose/Amber) */}
      <div
        aria-hidden="true"
        className="pb-diagonal-wave pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/40 via-cyan-400/30 to-transparent blur-2xl" />
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="pbVividDiag1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.34" />
              <stop offset="32%" stopColor="#06B6D4" stopOpacity="0.28" />
              <stop offset="66%" stopColor="#8B5CF6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.34" />
            </linearGradient>
            <linearGradient id="pbVividDiag2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.22" />
              <stop offset="78%" stopColor="#EC4899" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.32" />
            </linearGradient>
          </defs>
          <path
            d="M-60,-30 C230,50 310,330 640,355 C940,375 1040,520 1260,630 L1260,420 C1020,330 890,190 610,170 C310,150 200,-20 -60,-130 Z"
            fill="url(#pbVividDiag1)"
          />
          <path
            d="M-80,90 C220,180 390,430 720,455 C980,475 1090,565 1260,660 L1260,515 C1060,420 920,295 660,270 C350,245 180,45 -80,-35 Z"
            fill="url(#pbVividDiag2)"
          />
        </svg>
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-tl from-rose-500/32 via-violet-500/28 to-amber-400/28 blur-2xl" />
      </div>

      {/* Calculator Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400 shadow-sm">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="quick-estimator-heading"
                className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                30-Day API Spend Calculator
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                Live Math
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Simulate production traffic with prompt caching, batch discounts, and official vs. cloud hosts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EndpointModeSwitcher mode={endpointMode} onChange={handleModeSwitch} />
        </div>
      </div>

      {/* Workload Presets & Host Selector */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            Workloads
          </span>
          {WORKLOAD_PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`min-h-[36px] rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-white/90 ring-1 ring-slate-200/80 text-slate-700 hover:bg-white'
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`hidden sm:inline ml-1.5 font-mono text-[11px] ${
                    active ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {p.detail}
                </span>
              </button>
            );
          })}
        </div>

        {hasMultipleHosts && (
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="home-host-select"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 shrink-0"
            >
              <Server className="h-3.5 w-3.5 text-emerald-700" />
              <span>Host:</span>
            </label>
            <select
              id="home-host-select"
              value={getEndpointKey(activeQuote.endpoint, activeQuote.index)}
              onChange={(e) => {
                setCustomHostKey(e.target.value);
                if (
                  e.target.value ===
                  getEndpointKey(
                    endpointEval.firstPartyQuote.endpoint,
                    endpointEval.firstPartyQuote.index
                  )
                ) {
                  setEndpointMode('first-party');
                } else {
                  setEndpointMode('cheapest');
                }
              }}
              className="min-h-[38px] max-w-[270px] sm:max-w-xs rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {endpointEval.quotes.map((q) => (
                <option
                  key={getEndpointKey(q.endpoint, q.index)}
                  value={getEndpointKey(q.endpoint, q.index)}
                >
                  {q.endpoint.host} ({q.endpoint.providerType}) —{' '}
                  {formatCurrency(q.breakdown.monthlyTotalCost)}/mo
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Calculator Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="home-model-select"
              className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5"
            >
              <span>Select Model ({models.length} tracked)</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <ProviderLogo
                  provider={selectedModel.provider}
                  modelName={selectedModel.name}
                  modelSlug={selectedModel.slug}
                  size="sm"
                />
                <span>{selectedModel.provider}</span>
              </span>
            </label>
            <select
              id="home-model-select"
              value={selectedModel.slug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-2xs focus:border-slate-900 focus:outline-none transition-colors"
            >
              {modelDropdownRows.map(({ model: m, chosen }) => (
                <option key={m.id} value={m.slug}>
                  {m.name} ({m.provider}) — {fmtRate(chosen.modelView.inputPer1M)} /{' '}
                  {fmtRate(chosen.modelView.outputPer1M)} per 1M via {chosen.endpoint.host}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="home-calls-day"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Requests / Day
            </label>
            <input
              id="home-calls-day"
              type="number"
              min={0}
              step={100}
              value={callsPerDay}
              onChange={(e) => {
                setPresetId('custom');
                setCallsPerDay(Math.max(0, Number(e.target.value) || 0));
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="home-cache-pct"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Prompt Cache Hit Share
            </label>
            <select
              id="home-cache-pct"
              disabled={activeRates.cachedInputPer1M === null}
              value={activeRates.cachedInputPer1M === null ? 0 : cachePct}
              onChange={(e) => {
                setPresetId('custom');
                setCachePct(Number(e.target.value));
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-900 focus:outline-none"
            >
              <option value={0}>0% (No cache hits)</option>
              <option value={20}>20% Cached reads</option>
              <option value={50}>50% Cached reads</option>
              <option value={80}>80% Cached reads</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="home-input-tok"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Input Tokens / Request
            </label>
            <input
              id="home-input-tok"
              type="number"
              min={0}
              step={250}
              value={inputTokens}
              onChange={(e) => {
                setPresetId('custom');
                setInputTokens(Math.max(0, Number(e.target.value) || 0));
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="home-output-tok"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Output Tokens / Request
            </label>
            <input
              id="home-output-tok"
              type="number"
              min={0}
              step={50}
              value={outputTokens}
              onChange={(e) => {
                setPresetId('custom');
                setOutputTokens(Math.max(0, Number(e.target.value) || 0));
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/75 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              {isVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              ) : (
                <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              )}
              <span>
                Source:{' '}
                <strong className="text-slate-900">
                  {activeQuote.endpoint.host} · {activeEvidence}
                </strong>
              </span>
            </span>

            {breakdown.batchSupported ? (
              <button
                type="button"
                onClick={() => setUseBatch((v) => !v)}
                className={`min-h-[34px] rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  useBatch
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {useBatch
                  ? `Batch API On (${Math.round(breakdown.batchDiscountRate * 100)}% off)`
                  : `Enable Batch (${Math.round(breakdown.batchDiscountRate * 100)}% off)`}
              </button>
            ) : (
              <span className="text-slate-500">Batch discount: N/A</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-slate-950/95 backdrop-blur-md text-white p-6 flex flex-col justify-between gap-5 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-medium text-emerald-300">
                <Server className="h-3 w-3" />
                {activeQuote.endpoint.host}
              </span>
              <span className="font-mono text-slate-400">
                {selectedModel.contextWindow ?? 'N/A'} ctx
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ProviderLogo
                  provider={selectedModel.provider}
                  modelName={selectedModel.name}
                  modelSlug={selectedModel.slug}
                  size="sm"
                />
                <span>30-Day Spend · {selectedModel.name}</span>
              </div>
              <div className="mt-1.5 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                {formatCurrency(breakdown.monthlyTotalCost)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-300 tabular-nums">
                <span>{formatCurrency(breakdown.costPer1KCalls)} / 1K calls</span>
                {typeof activeQuote.latencyMs === 'number' && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Gauge className="h-3 w-3" />
                    &lt;{activeQuote.latencyMs}ms
                  </span>
                )}
                {typeof activeQuote.tokPerSec === 'number' && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Zap className="h-3 w-3" />~{activeQuote.tokPerSec} tok/s
                  </span>
                )}
              </div>

              {monthlySavings > 0 && (
                <div className="mt-2.5 inline-flex items-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  Saves {formatCurrency(monthlySavings)}/mo ({savingsPct}%) vs.{' '}
                  {endpointEval.firstPartyQuote.endpoint.host}
                </div>
              )}

              {breakdown.triggersLongContextMultiplier && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{breakdown.activeContextTierLabel}</span>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-4 text-xs">
              <div>
                <dt className="text-slate-400">Input / 1M</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white">
                  {fmtRate(activeRates.inputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Cached / 1M</dt>
                <dd className="mt-0.5 font-mono font-semibold text-emerald-300">
                  {fmtRate(activeRates.cachedInputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Output / 1M</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white">
                  {fmtRate(activeRates.outputPer1M)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href={`/models/${selectedModel.slug}`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-300 transition-colors"
            >
              <span>Inspect Endpoints</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
