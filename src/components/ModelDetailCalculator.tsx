'use client';

import React, { useState, useMemo } from 'react';
import type { ModelEntry } from '@/lib/catalog';
import {
  calculateModelCost,
  formatCurrency,
  type LLMModel,
} from '@/lib/pricingEngine';

export function ModelDetailCalculator({ model }: { model: ModelEntry }) {
  const [inputTokens, setInputTokens] = useState<number>(6500);
  const [outputTokens, setOutputTokens] = useState<number>(650);
  const [callsPerDay, setCallsPerDay] = useState<number>(2500);
  const [cacheHitPct, setCacheHitPct] = useState<number>(0);
  const [cacheWriteSharePct, setCacheWriteSharePct] = useState<number>(0);
  const [batchEnabled, setBatchEnabled] = useState<boolean>(false);

  const effectiveModel: LLMModel = useMemo(
    () => ({
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
    }),
    [model]
  );

  const breakdown = useMemo(
    () =>
      calculateModelCost(effectiveModel, {
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
      effectiveModel,
      inputTokens,
      outputTokens,
      callsPerDay,
      cacheHitPct,
      cacheWriteSharePct,
      batchEnabled,
    ]
  );

  const batchPctLabel =
    breakdown.batchSupported
      ? `${Math.round(breakdown.batchDiscountRate * 100)}%`
      : 'Not available';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          30-Day Cost Calculator — {model.name}
        </h2>
        {breakdown.batchSupported ? (
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
            disabled={model.cachedInputPer1M === null}
            value={model.cachedInputPer1M === null ? 0 : cacheHitPct}
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
            disabled={!breakdown.cacheWriteSupported}
            value={!breakdown.cacheWriteSupported ? 0 : cacheWriteSharePct}
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
          <strong>Cache Read:</strong>{' '}
          {model.cachedInputPer1M !== null ? `$${model.cachedInputPer1M.toFixed(2)}/1M` : 'Not available'}{' '}
          · <strong>Cache Write:</strong>{' '}
          {model.cacheWritePer1M !== null ? `$${model.cacheWritePer1M.toFixed(2)}/1M` : 'Not available'}
        </span>
        <span className="font-mono font-medium text-slate-900">
          {breakdown.activeContextTierLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <span className="text-xs text-slate-700">
          Estimated 30-Day Spend ({breakdown.monthlyCalls.toLocaleString()} calls)
        </span>
        <span className="font-mono text-2xl font-bold text-emerald-800">
          {breakdown.hasPricingData ? `${formatCurrency(breakdown.monthlyTotalCost)}/mo` : 'N/A'}
        </span>
      </div>
    </div>
  );
}
