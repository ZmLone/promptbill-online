'use client';

import React, { useState } from 'react';
import { ModelEntry } from '../lib/catalog';

export function ModelDetailCalculator({ model }: { model: ModelEntry }) {
  const [inputTokens, setInputTokens] = useState(6500);
  const [outputTokens, setOutputTokens] = useState(650);
  const [callsPerDay, setCallsPerDay] = useState(2500);
  const [cacheHitPct, setCacheHitPct] = useState(50);

  const monthlyCalls = Math.max(0, callsPerDay) * 30;
  const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
  const blendedIn = (1 - cacheFrac) * model.inputPer1M + cacheFrac * model.cachedInputPer1M;
  const monthlyTotal = (monthlyCalls * inputTokens * blendedIn) / 1_000_000 + (monthlyCalls * outputTokens * model.outputPer1M) / 1_000_000;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-bold text-slate-900">30-Day Cost Calculator — {model.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Input tokens / call</span>
          <input type="number" min={0} value={inputTokens} onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900" />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Output tokens / call</span>
          <input type="number" min={0} value={outputTokens} onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900" />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Calls / day</span>
          <input type="number" min={0} value={callsPerDay} onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900" />
        </label>
        <label className="space-y-1">
          <span className="text-slate-600 font-medium">Cache hit %</span>
          <input type="number" min={0} max={95} value={cacheHitPct} onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900" />
        </label>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <span className="text-xs text-slate-600">Estimated Monthly Spend ({monthlyCalls.toLocaleString()} calls)</span>
        <span className="font-mono text-2xl font-bold text-emerald-700">${monthlyTotal.toFixed(2)}/mo</span>
      </div>
    </div>
  );
}
