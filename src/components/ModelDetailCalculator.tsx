'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { CatalogHostingEndpoint, ModelEntry } from '@/lib/catalog';
import {
  calculateModelCost,
  formatCurrency,
  type CostBreakdown,
  type LLMModel,
} from '@/lib/pricingEngine';

type EndpointMode = 'first-party' | 'cheapest' | 'custom';

interface EndpointQuote {
  index: number;
  endpoint: CatalogHostingEndpoint;
  modelView: LLMModel;
  breakdown: CostBreakdown;
}

function endpointKey(ep: CatalogHostingEndpoint, index: number): string {
  return `${index}::${ep.host}`;
}

function buildModelForEndpoint(
  model: ModelEntry,
  ep?: CatalogHostingEndpoint
): LLMModel {
  if (!ep) {
    return {
      id: model.id,
      slug: model.slug,
      name: model.name,
      provider: model.provider,
      family: model.family,
      inputPer1M: model.inputPer1M,
      cachedInputPer1M: model.cachedInputPer1M,
      cacheWritePer1M: model.cacheWritePer1M,
      outputPer1M: model.outputPer1M,
      batchDiscount: model.batchDiscount,
      longContextMultiplierInput: model.longContextMultiplierInput,
      longContextMultiplierOutput: model.longContextMultiplierOutput,
      longContextThresholdTokens: model.longContextThresholdTokens,
      contextWindow: model.contextWindow,
      qualityScore: model.qualityScore,
      score: model.score,
      speedTokensPerSec: model.speedTokensPerSec,
      tokPerSec: model.tokPerSec,
      notes: model.notes,
      hostingEndpoints: model.hostingEndpoints,
    };
  }

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    provider: model.provider,
    family: model.family,
    inputPer1M: ep.inputPer1M ?? model.inputPer1M,
    cachedInputPer1M:
      ep.cachedInputPer1M !== undefined ? ep.cachedInputPer1M : model.cachedInputPer1M,
    cacheWritePer1M:
      ep.cacheWritePer1M !== undefined ? ep.cacheWritePer1M : model.cacheWritePer1M,
    outputPer1M: ep.outputPer1M ?? model.outputPer1M,
    batchDiscount:
      ep.batchDiscount !== undefined ? ep.batchDiscount : model.batchDiscount,
    longContextMultiplierInput: model.longContextMultiplierInput,
    longContextMultiplierOutput: model.longContextMultiplierOutput,
    longContextThresholdTokens: model.longContextThresholdTokens,
    contextWindow: model.contextWindow,
    qualityScore: model.qualityScore,
    score: model.score,
    speedTokensPerSec: model.speedTokensPerSec,
    tokPerSec: model.tokPerSec,
    notes: ep.notes ?? model.notes,
    hostingEndpoints: model.hostingEndpoints,
  };
}

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

  const firstPartyIndex = useMemo(() => {
    const idx = endpoints.findIndex((ep) => ep.providerType === 'Official API');
    return idx >= 0 ? idx : 0;
  }, [endpoints]);

  const [endpointMode, setEndpointMode] = useState<EndpointMode>(
    endpoints.length > 1 ? 'cheapest' : 'first-party'
  );
  const [selectedEndpointKey, setSelectedEndpointKey] = useState<string>(() =>
    endpoints[0] ? endpointKey(endpoints[0], 0) : ''
  );

  useEffect(() => {
    if (endpoints.length <= 1) {
      setEndpointMode('first-party');
    }
    if (endpoints[0]) {
      setSelectedEndpointKey((prev) =>
        endpoints.some((ep, i) => endpointKey(ep, i) === prev)
          ? prev
          : endpointKey(endpoints[0], 0)
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

  const quotes: EndpointQuote[] = useMemo(() => {
    if (endpoints.length === 0) {
      const fallbackModel = buildModelForEndpoint(model);
      return [
        {
          index: 0,
          endpoint: {
            host: `${model.provider} (Default)`,
            providerType: 'Official API',
            inputPer1M: model.inputPer1M,
            cachedInputPer1M: model.cachedInputPer1M,
            cacheWritePer1M: model.cacheWritePer1M,
            outputPer1M: model.outputPer1M,
            batchDiscount: model.batchDiscount,
            evidenceStatus: model.pricingProvenance.status,
          },
          modelView: fallbackModel,
          breakdown: calculateModelCost(fallbackModel, calcInput),
        },
      ];
    }

    return endpoints.map((ep, index) => {
      const modelView = buildModelForEndpoint(model, ep);
      return {
        index,
        endpoint: ep,
        modelView,
        breakdown: calculateModelCost(modelView, calcInput),
      };
    });
  }, [endpoints, model, calcInput]);

  const firstPartyQuote = useMemo(
    () => quotes.find((q) => q.index === firstPartyIndex) ?? quotes[0],
    [quotes, firstPartyIndex]
  );

  const cheapestQuote = useMemo(() => {
    const priced = quotes.filter((q) => q.breakdown.hasPricingData);
    if (priced.length === 0) return firstPartyQuote;
    return priced.reduce((best, curr) =>
      curr.breakdown.monthlyTotalCost < best.breakdown.monthlyTotalCost ? curr : best
    );
  }, [quotes, firstPartyQuote]);

  const activeQuote = useMemo(() => {
    if (endpointMode === 'first-party') return firstPartyQuote;
    if (endpointMode === 'cheapest') return cheapestQuote;
    return (
      quotes.find((q) => endpointKey(q.endpoint, q.index) === selectedEndpointKey) ??
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
    if (
      !firstPartyQuote?.breakdown.hasPricingData ||
      !activeQuote.breakdown.hasPricingData ||
      activeQuote.index === firstPartyQuote.index
    ) {
      return null;
    }
    const diff =
      firstPartyQuote.breakdown.monthlyTotalCost - activeQuote.breakdown.monthlyTotalCost;
    const pct =
      firstPartyQuote.breakdown.monthlyTotalCost > 0
        ? (diff / firstPartyQuote.breakdown.monthlyTotalCost) * 100
        : 0;
    return { diff, pct };
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
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Endpoint pricing mode">
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
                  setSelectedEndpointKey(endpointKey(endpoints[0], 0));
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
              value={endpointKey(activeQuote.endpoint, activeQuote.index)}
              onChange={(e) => {
                setSelectedEndpointKey(e.target.value);
                setEndpointMode('custom');
              }}
              className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-900"
            >
              {quotes.map((q) => {
                const costLabel = q.breakdown.hasPricingData
                  ? `${formatCurrency(q.breakdown.monthlyTotalCost)}/mo`
                  : 'N/A';
                const isCheapest = q.index === cheapestQuote.index && q.breakdown.hasPricingData;
                return (
                  <option
                    key={endpointKey(q.endpoint, q.index)}
                    value={endpointKey(q.endpoint, q.index)}
                  >
                    {q.endpoint.host} ({q.endpoint.providerType}) — {costLabel}
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
          {typeof activeQuote.endpoint.latencyMs === 'number'
            ? ` · ~${activeQuote.endpoint.latencyMs}ms`
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
              {formatCurrency(firstPartyQuote.breakdown.monthlyTotalCost)}/mo)
            </div>
          )}
        </div>
        <span className="font-mono text-2xl font-bold text-emerald-800">
          {activeQuote.breakdown.hasPricingData
            ? `${formatCurrency(activeQuote.breakdown.monthlyTotalCost)}/mo`
            : 'N/A'}
        </span>
      </div>
    </div>
  );
}
