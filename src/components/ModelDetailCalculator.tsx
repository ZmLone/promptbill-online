'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { ModelEntry } from '@/lib/catalog';
import { formatCurrency } from '@/lib/pricingEngine';
import {
  evaluateModelEndpoints,
  getEndpointKey,
  type EndpointQuote,
} from '@/lib/endpointPricing';

type EndpointMode = 'first-party' | 'cheapest' | 'custom';

export function ModelDetailCalculator({ model }: { model: ModelEntry }) {
  const [inputTokens, setInputTokens] = useState<number>(6500);
  const [outputTokens, setOutputTokens] = useState<number>(650);
  const [callsPerDay, setCallsPerDay] = useState<number>(2500);
  const [cacheHitPct, setCacheHitPct] = useState<number>(0);
  const [cacheWriteSharePct, setCacheWriteSharePct] = useState<number>(0);
  const [batchEnabled, setBatchEnabled] = useState<boolean>(false);

  const endpoints = useMemo(
    () => (Array.isArray(model.hostingEndpoints) ? model.hostingEndpoints : []),
    [model.hostingEndpoints]
  );

  const [endpointMode, setEndpointMode] = useState<EndpointMode>(
    endpoints.length > 1 ? 'cheapest' : 'first-party'
  );
  const [selectedEndpointKey, setSelectedEndpointKey] = useState<string>(() =>
    endpoints[0] ? getEndpointKey(endpoints[0], 0) : ''
  );

  useEffect(() => {
    if (endpoints.length <= 1) {
      setEndpointMode('first-party');
    }
    if (endpoints[0]) {
      setSelectedEndpointKey((prev) =>
        endpoints.some((ep, i) => getEndpointKey(ep, i) === prev)
          ? prev
          : getEndpointKey(endpoints[0], 0)
      );
    }
  }, [endpoints]);

  const calcInput = useMemo(
    () => ({
      inputTokensPerCall: inputTokens,
      outputTokensPerCall: outputTokens,
      reasoningTokensPerCall: 0,
      callsPerDay,
      cacheHitPercent: cacheHitPct,
      cacheWriteSharePercent: cacheWriteSharePct,
      batchPercent: batchEnabled ? 100 : 0,
      retriesPercent: 0,
    }),
    [
      inputTokens,
      outputTokens,
      callsPerDay,
      cacheHitPct,
      cacheWriteSharePct,
      batchEnabled,
    ]
  );

  const { quotes, firstPartyQuote, cheapestQuote } = useMemo(
    () => evaluateModelEndpoints(model, calcInput),
    [model, calcInput]
  );

  const activeQuote: EndpointQuote = useMemo(() => {
    if (endpointMode === 'first-party') return firstPartyQuote;
    if (endpointMode === 'cheapest') return cheapestQuote;
    return (
      quotes.find((q) => getEndpointKey(q.endpoint, q.index) === selectedEndpointKey) ??
      cheapestQuote
    );
  }, [endpointMode, firstPartyQuote, cheapestQuote, quotes, selectedEndpointKey]);

  const activeCachedInputRate = activeQuote.modelView.cachedInputPer1M ?? null;
  const activeCacheWriteRate = activeQuote.modelView.cacheWritePer1M ?? null;

  useEffect(() => {
    if (activeCachedInputRate === null) setCacheHitPct(0);
    if (!activeQuote.breakdown.cacheWriteSupported) setCacheWriteSharePct(0);
  }, [activeCachedInputRate, activeQuote.breakdown.cacheWriteSupported]);

  const savingsVsFirstParty = useMemo(() => {
    const firstCost = firstPartyQuote?.breakdown.monthlyTotalCost;
    const activeCost = activeQuote.breakdown.monthlyTotalCost;
    if (
      !firstPartyQuote?.breakdown.hasPricingData ||
      !activeQuote.breakdown.hasPricingData ||
      typeof firstCost !== 'number' ||
      typeof activeCost !== 'number' ||
      !Number.isFinite(firstCost) ||
      !Number.isFinite(activeCost) ||
      activeQuote.index === firstPartyQuote.index
    ) {
      return null;
    }
    const diff = firstCost - activeCost;
    const pct = firstCost > 0 ? (diff / firstCost) * 100 : 0;
    return { diff, pct, firstCost, activeCost };
  }, [firstPartyQuote, activeQuote]);

  const batchPctLabel = activeQuote.breakdown.batchSupported
    ? `${Math.round(activeQuote.breakdown.batchDiscountRate * 100)}%`
    : 'Not available';

  const activeEvidence =
    activeQuote.endpoint.evidenceStatus ?? model.pricingProvenance.status;
  const isUnverifiedPricing = activeEvidence !== 'Verified';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          30-Day Cost Calculator — {model.name}
        </h2>
        {activeQuote.breakdown.batchSupported ? (
          <button
            type="button"
            onClick={() => setBatchEnabled((prev) => !prev)}
            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              batchEnabled
                ? 'border-emerald-700 bg-emerald-800 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
            }`}
          >
            {batchEnabled
              ? `Batch Discount Active (${batchPctLabel} Off)`
              : `Apply Batch Discount (${batchPctLabel} Off)`}
          </button>
        ) : (
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Batch discount: Not available
          </span>
        )}
      </div>

      {endpoints.length > 1 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Endpoint pricing mode"
          >
            <button
              type="button"
              onClick={() => setEndpointMode('cheapest')}
              className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                endpointMode === 'cheapest'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cheapest Endpoint
            </button>
            <button
              type="button"
              onClick={() => setEndpointMode('first-party')}
              className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                endpointMode === 'first-party'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              First-Party
            </button>
            <button
              type="button"
              onClick={() => {
                setEndpointMode('custom');
                if (!selectedEndpointKey && endpoints[0]) {
                  setSelectedEndpointKey(getEndpointKey(endpoints[0], 0));
                }
              }}
              className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                endpointMode === 'custom'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Select Host
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <label htmlFor="endpoint-host-select" className="font-medium text-slate-700">
              Endpoint:
            </label>
            <select
              id="endpoint-host-select"
              value={getEndpointKey(activeQuote.endpoint, activeQuote.index)}
              onChange={(e) => {
                setSelectedEndpointKey(e.target.value);
                setEndpointMode('custom');
              }}
              className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-900"
            >
              {quotes.map((q) => {
                const costLabel =
                  q.breakdown.hasPricingData &&
                  typeof q.breakdown.monthlyTotalCost === 'number'
                    ? `${formatCurrency(q.breakdown.monthlyTotalCost)}/mo`
                    : 'N/A';
                const isCheapest =
                  q.index === cheapestQuote.index && q.breakdown.hasPricingData;
                const speedBits = [
                  typeof q.latencyMs === 'number' ? `<${q.latencyMs}ms` : null,
                  typeof q.tokPerSec === 'number' ? `~${q.tokPerSec} tok/s` : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <option
                    key={getEndpointKey(q.endpoint, q.index)}
                    value={getEndpointKey(q.endpoint, q.index)}
                  >
                    {q.endpoint.host} ({q.endpoint.providerType}) — {costLabel}
                    {speedBits ? ` [${speedBits}]` : ''}
                    {isCheapest ? ' • Cheapest' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {isUnverifiedPricing && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
          <strong>Estimate Warning:</strong> Pricing for{' '}
          <strong>{activeQuote.endpoint.host}</strong> is marked{' '}
          <strong>{activeEvidence}</strong>. Confirm live rates with the provider before billing.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <label htmlFor="detail-input-tokens" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Input tokens / call</span>
          <input
            id="detail-input-tokens"
            type="number"
            min={0}
            value={inputTokens}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              setInputTokens(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
            }}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label htmlFor="detail-output-tokens" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Output tokens / call</span>
          <input
            id="detail-output-tokens"
            type="number"
            min={0}
            value={outputTokens}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              setOutputTokens(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
            }}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label htmlFor="detail-calls-per-day" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Calls / day</span>
          <input
            id="detail-calls-per-day"
            type="number"
            min={0}
            value={callsPerDay}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              setCallsPerDay(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
            }}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label htmlFor="detail-cache-hit" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Cache read hit %</span>
          <input
            id="detail-cache-hit"
            type="number"
            min={0}
            max={100}
            disabled={activeCachedInputRate === null}
            value={activeCachedInputRate === null ? 0 : cacheHitPct}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              const safe = Number.isFinite(parsed) ? parsed : 0;
              setCacheHitPct(Math.min(100, Math.max(0, safe)));
            }}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 disabled:bg-slate-100"
          />
        </label>
        <label htmlFor="detail-cache-write" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Cache write share %</span>
          <input
            id="detail-cache-write"
            type="number"
            min={0}
            max={100}
            disabled={!activeQuote.breakdown.cacheWriteSupported}
            value={!activeQuote.breakdown.cacheWriteSupported ? 0 : cacheWriteSharePct}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              const safe = Number.isFinite(parsed) ? parsed : 0;
              setCacheWriteSharePct(Math.min(100, Math.max(0, safe)));
            }}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 disabled:bg-slate-100"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Host:</strong> {activeQuote.endpoint.host} ({activeQuote.endpoint.providerType}) ·{' '}
          <strong>In/Out:</strong> {formatCurrency(activeQuote.modelView.inputPer1M)} /{' '}
          {formatCurrency(activeQuote.modelView.outputPer1M)} per 1M ·{' '}
          <strong>Cache Read:</strong> {formatCurrency(activeCachedInputRate)}/1M ·{' '}
          <strong>Cache Write:</strong> {formatCurrency(activeCacheWriteRate)}/1M
          {typeof activeQuote.latencyMs === 'number'
            ? ` · TTFT: <${activeQuote.latencyMs}ms`
            : ''}
          {typeof activeQuote.tokPerSec === 'number'
            ? ` · Speed: ~${activeQuote.tokPerSec} tok/s`
            : ''}
          {typeof activeQuote.estimatedGenerationSec === 'number'
            ? ` (~${activeQuote.estimatedGenerationSec}s/resp)`
            : ''}
        </span>
        <span className="font-mono font-medium text-slate-900">
          {activeQuote.breakdown.activeContextTierLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <div className="space-y-0.5">
          <div className="text-xs text-slate-700">
            {isUnverifiedPricing
              ? 'Estimated 30-Day Spend (Unverified Rate)'
              : 'Estimated 30-Day Spend'}{' '}
            ({activeQuote.breakdown.monthlyCalls.toLocaleString()} calls)
          </div>
          {savingsVsFirstParty && savingsVsFirstParty.diff > 0.005 && (
            <div className="text-xs font-medium text-emerald-700">
              Saves {formatCurrency(savingsVsFirstParty.diff)}/mo (
              {savingsVsFirstParty.pct.toFixed(1)}%) vs. {firstPartyQuote.endpoint.host} (
              {formatCurrency(savingsVsFirstParty.firstCost)}/mo)
            </div>
          )}
        </div>
        <span className="font-mono text-2xl font-bold text-emerald-800">
          {activeQuote.breakdown.hasPricingData &&
          typeof activeQuote.breakdown.monthlyTotalCost === 'number'
            ? `${formatCurrency(activeQuote.breakdown.monthlyTotalCost)}/mo`
            : 'N/A'}
        </span>
      </div>
    </div>
  );
}
