'use client';

import React, { useState } from 'react';
import { ModelEntry } from '@/lib/catalog';

export function ModelDetailCalculator({ model }: { model: ModelEntry }) {
  const [inputTokens, setInputTokens] = useState(6500);
  const [outputTokens, setOutputTokens] = useState(650);
  const [callsPerDay, setCallsPerDay] = useState(2500);
  const [cacheHitPct, setCacheHitPct] = useState(50);
  const [cacheWriteSharePct, setCacheWriteSharePct] = useState(25);
  const [batchEnabled, setBatchEnabled] = useState(false);

  const monthlyCalls = Math.max(0, callsPerDay) * 30;
  const cacheReadFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
  const uncachedFrac = 1 - cacheReadFrac;
  const writeFrac = uncachedFrac * Math.min(1, Math.max(0, cacheWriteSharePct / 100));
  const readUncachedFrac = Math.max(0, uncachedFrac - writeFrac);

  const cacheWriteRate = model.inputPer1M * 1.25;
  const longCtxThreshold = 200_000;
  const isLongContext = inputTokens > longCtxThreshold;
  const ctxInputMult = isLongContext ? 2.0 : 1.0;
  const ctxOutputMult = isLongContext ? 1.5 : 1.0;
  const batchMult = batchEnabled ? 0.5 : 1.0;

  const blendedIn =
    (readUncachedFrac * model.inputPer1M +
      writeFrac * cacheWriteRate +
      cacheReadFrac * model.cachedInputPer1M) *
    ctxInputMult *
    batchMult;
  const blendedOut = model.outputPer1M * ctxOutputMult * batchMult;

  const monthlyTotal =
    (monthlyCalls * inputTokens * blendedIn) / 1_000_000 +
    (monthlyCalls * outputTokens * blendedOut) / 1_000_000;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          30-Day Cost Calculator — {model.name}
        </h2>
        <button
          type="button"
          onClick={() => setBatchEnabled((prev) => !prev)}
          className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            batchEnabled
              ? 'border-emerald-700 bg-emerald-800 text-white'
              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
          }`}
        >
          {batchEnabled ? 'Batch API Active (50% Off)' : 'Apply 50% Batch API Discount'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <label htmlFor="detail-input-tokens" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Input tokens / call</span>
          <input
            id="detail-input-tokens"
            type="number"
            min={0}
            value={inputTokens}
            onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))}
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
            onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))}
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
            onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label htmlFor="detail-cache-hit" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Cache read hit %</span>
          <input
            id="detail-cache-hit"
            type="number"
            min={0}
            max={95}
            value={cacheHitPct}
            onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label htmlFor="detail-cache-write" className="space-y-1.5">
          <span className="text-slate-700 font-medium block">Cache write share %</span>
          <input
            id="detail-cache-write"
            type="number"
            min={0}
            max={100}
            value={cacheWriteSharePct}
            onChange={(e) => setCacheWriteSharePct(Number(e.target.value))}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Cache Read:</strong> ${model.cachedInputPer1M.toFixed(2)}/1M -{' '}
          <strong>Cache Write (1.25x):</strong> ${cacheWriteRate.toFixed(2)}/1M
        </span>
        <span className="font-mono font-medium text-slate-900">
          {isLongContext ? `Long-Context (>200K): ${ctxInputMult}x In / ${ctxOutputMult}x Out` : 'Standard Context Tier (<=200K)'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <span className="text-xs text-slate-700">Estimated Monthly Spend ({monthlyCalls.toLocaleString()} calls)</span>
        <span className="font-mono text-2xl font-bold text-emerald-800">${monthlyTotal.toFixed(2)}/mo</span>
      </div>
    </div>
  );
}
