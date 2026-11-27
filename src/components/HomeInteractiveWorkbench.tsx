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
import { Calculator, ArrowRight, Sparkles, CheckCircle2, Info, Server } from 'lucide-react';

interface WorkloadPreset {
  id: string;
  label: string;
  badge: string;
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
    badge: '2k / 400 tok',
    inputTokens: 2000,
    outputTokens: 400,
    callsPerDay: 3000,
    cachePct: 20,
    batchPct: 0,
  },
  {
    id: 'rag',
    label: 'RAG / Doc Q&A',
    badge: '8k / 600 tok',
    inputTokens: 8000,
    outputTokens: 600,
    callsPerDay: 2000,
    cachePct: 50,
    batchPct: 0,
  },
  {
    id: 'coding',
    label: 'Code Agent',
    badge: '24k / 1.5k tok',
    inputTokens: 24000,
    outputTokens: 1500,
    callsPerDay: 800,
    cachePct: 60,
    batchPct: 0,
  },
  {
    id: 'batch',
    label: 'Batch Classify',
    badge: '1.2k / 80 tok',
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

export function HomeInteractiveWorkbench({ models }: { models: CatalogModel[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>(models[0]?.slug ?? '');
  const [presetId, setPresetId] = useState<string>('rag');
  const [callsPerDay, setCallsPerDay] = useState<number>(2000);
  const [inputTokens, setInputTokens] = useState<number>(8000);
  const [outputTokens, setOutputTokens] = useState<number>(600);
  const [cachePct, setCachePct] = useState<number>(50);
  const [useBatch, setUseBatch] = useState<boolean>(false);
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [customHostKey, setCustomHostKey] = useState<string>('');

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
      aria-labelledby="quick-estimator-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h2 id="quick-estimator-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Instant API Spend Estimator
            </h2>
            <p className="text-xs text-slate-600">
              Compare official provider APIs vs. third-party routers &amp; inference clouds in real time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EndpointModeSwitcher mode={endpointMode} onChange={handleModeSwitch} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {WORKLOAD_PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {hasMultipleHosts && (
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="home-host-select" className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Server className="h-3.5 w-3.5 text-emerald-700" />
              <span>Endpoint:</span>
            </label>
            <select
              id="home-host-select"
              value={getEndpointKey(activeQuote.endpoint, activeQuote.index)}
              onChange={(e) => {
                setCustomHostKey(e.target.value);
                if (e.target.value === getEndpointKey(endpointEval.firstPartyQuote.endpoint, endpointEval.firstPartyQuote.index)) {
                  setEndpointMode('first-party');
                } else {
                  setEndpointMode('cheapest');
                }
              }}
              className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
            >
              {endpointEval.quotes.map((q) => (
                <option
                  key={getEndpointKey(q.endpoint, q.index)}
                  value={getEndpointKey(q.endpoint, q.index)}
                >
                  {q.endpoint.host} ({q.endpoint.providerType}) — {formatCurrency(q.breakdown.monthlyTotalCost)}/mo
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label
              htmlFor="home-model-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Choose LLM Model ({models.length} in catalog)
            </label>
            <select
              id="home-model-select"
              value={selectedModel.slug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              {models.map((m) => {
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
                return (
                  <option key={m.id} value={m.slug}>
                    {m.name} ({m.provider}) — {fmtRate(chosen.modelView.inputPer1M)} /{' '}
                    {fmtRate(chosen.modelView.outputPer1M)} per 1M via {chosen.endpoint.host}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="home-calls-day"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              API Calls / Day
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
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="home-cache-pct"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Prompt Cache Hit Rate
            </label>
            <select
              id="home-cache-pct"
              disabled={activeRates.cachedInputPer1M === null}
              value={activeRates.cachedInputPer1M === null ? 0 : cachePct}
              onChange={(e) => {
                setPresetId('custom');
                setCachePct(Number(e.target.value));
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-700 focus:outline-none"
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
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Input Tokens / Call
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
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="home-output-tok"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Output Tokens / Call
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
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              {isVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              ) : (
                <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              )}
              Endpoint:{' '}
              <strong className="text-slate-900">
                {activeQuote.endpoint.host} ({activeEvidence})
              </strong>
            </span>

            {breakdown.batchSupported ? (
              <button
                type="button"
                onClick={() => setUseBatch((v) => !v)}
                className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  useBatch
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                {useBatch
                  ? `Batch Discount On (${Math.round(breakdown.batchDiscountRate * 100)}% off)`
                  : `Apply Batch (${Math.round(breakdown.batchDiscountRate * 100)}% off)`}
              </button>
            ) : (
              <span>Batch discount: Not available</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-slate-900 text-white p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                {activeQuote.endpoint.host} · {activeQuote.endpoint.providerType}
              </span>
              <span className="font-mono">{selectedModel.contextWindow ?? 'N/A'} ctx</span>
            </div>

            <div>
              <div className="text-xs text-slate-300">Estimated 30-Day Bill ({selectedModel.name})</div>
              <div className="mt-1 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                {formatCurrency(breakdown.monthlyTotalCost)}
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-300 tabular-nums">
                {formatCurrency(breakdown.costPer1KCalls)} / 1K reqs ·{' '}
                {typeof activeQuote.latencyMs === 'number' ? `<${activeQuote.latencyMs}ms · ` : ''}
                {typeof activeQuote.tokPerSec === 'number' ? `~${activeQuote.tokPerSec} tok/s` : `${breakdown.monthlyCalls.toLocaleString()} calls/mo`}
              </div>
              {monthlySavings > 0 && (
                <div className="mt-1.5 inline-flex items-center rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                  Saves {formatCurrency(monthlySavings)}/mo ({savingsPct}%) vs.{' '}
                  {endpointEval.firstPartyQuote.endpoint.host}
                </div>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-xs">
              <div>
                <dt className="text-slate-400">Input / 1M</dt>
                <dd className="font-mono font-semibold text-white">{fmtRate(activeRates.inputPer1M)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Cached / 1M</dt>
                <dd className="font-mono font-semibold text-emerald-300">
                  {fmtRate(activeRates.cachedInputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Output / 1M</dt>
                <dd className="font-mono font-semibold text-white">{fmtRate(activeRates.outputPer1M)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Link
              href={`/models/${selectedModel.slug}`}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              Full Model Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
