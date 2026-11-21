'use client';

import React, { useState } from 'react';
import { ModelEntry } from '../lib/catalog';

export function ModelDetailCalculator({ model }: { model: ModelEntry }) {
  const [inputTokens, setInputTokens] = useState(6500);
  const [outputTokens, setOutputTokens] = useState(650);
  const [callsPerDay, setCallsPerDay] = useState(2500);
  const [cacheHitPct, setCacheHitPct] = useState(50);
  const [batchSharePct, setBatchSharePct] = useState(0);

  const monthlyCalls = Math.max(0, callsPerDay) * 30;
  const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
  const batchMult = 1 - Math.min(1, Math.max(0, batchSharePct / 100)) * 0.5;

  const blendedInputRate = ((1 - cacheFrac) * model.inputPer1M + cacheFrac * model.cachedInputPer1M) * batchMult;
  const blendedOutputRate = model.outputPer1M * batchMult;

  const monthlyInputCost = (monthlyCalls * inputTokens * blendedInputRate) / 1_000_000;
  const monthlyOutputCost = (monthlyCalls * outputTokens * blendedOutputRate) / 1_000_000;
  const monthlyTotal = monthlyInputCost + monthlyOutputCost;
  const costPer1k = monthlyCalls > 0 ? (monthlyTotal / monthlyCalls) * 1000 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Dedicated 30-Day API Cost Calculator — {model.name}
          </h2>
          <p className="text-xs text-slate-600">
            Pre-loaded with {model.name} list pricing (${model.inputPer1M.toFixed(2)} in / ${model.cachedInputPer1M.toFixed(2)} cached / ${model.outputPer1M.toFixed(2)} out per 1M tokens).
          </p>
        </div>
        <span className="rounded-md bg-emerald-100 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-900">
          {monthlyCalls.toLocaleString()} calls/mo
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Input tokens / call</span>
          <input
            type="number"
            min={0}
            value={inputTokens}
            onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Output tokens / call</span>
          <input
            type="number"
            min={0}
            value={outputTokens}
            onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Calls / day</span>
          <input
            type="number"
            min={0}
            value={callsPerDay}
            onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Cache hit %</span>
          <input
            type="number"
            min={0}
            max={95}
            value={cacheHitPct}
            onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Batch % (50% off)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={batchSharePct}
            onChange={(e) => setBatchSharePct(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 font-mono">
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <div className="text-[11px] font-sans text-slate-500">Input Spend</div>
          <div className="text-base font-bold text-slate-900">${monthlyInputCost.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <div className="text-[11px] font-sans text-slate-500">Output Spend</div>
          <div className="text-base font-bold text-slate-900">${monthlyOutputCost.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <div className="text-[11px] font-sans text-slate-500">Cost / 1K Calls</div>
          <div className="text-base font-bold text-slate-900">${costPer1k.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <div className="text-[11px] font-sans font-semibold text-emerald-800">Est. 30-Day Total</div>
          <div className="text-lg font-bold text-emerald-700">${monthlyTotal.toFixed(2)}/mo</div>
        </div>
      </div>
    </div>
  );
}
