'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export default function RoutingSimulatorPage() {
  const [simpleSharePct, setSimpleSharePct] = useState(65);
  const [callsPerDay, setCallsPerDay] = useState(5000);
  const [flagshipSlug, setFlagshipSlug] = useState<string>(ALL_MODELS[0]?.slug || 'claude-fable-5-2');
  const [economySlug, setEconomySlug] = useState<string>('qwen-3-7-flash');
  const [batchEnabled, setBatchEnabled] = useState<boolean>(false);

  const flagship = useMemo(
    () => ALL_MODELS.find((m) => m.slug === flagshipSlug) || ALL_MODELS[0],
    [flagshipSlug]
  );

  const economy = useMemo(
    () =>
      ALL_MODELS.find((m) => m.slug === economySlug) ||
      ALL_MODELS.find((m) => m.slug === 'qwen-3-7-flash') ||
      ALL_MODELS[ALL_MODELS.length - 1],
    [economySlug]
  );

  const batchFactor = batchEnabled ? 0.5 : 1.0;

  const stats = useMemo(() => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30;
    const baseCost =
      ((monthlyCalls * 6000 * flagship.inputPer1M) / 1_000_000 +
        (monthlyCalls * 800 * flagship.outputPer1M) / 1_000_000) *
      batchFactor;
    const simpleFrac = simpleSharePct / 100;
    const complexFrac = 1 - simpleFrac;
    const routedCost =
      (((monthlyCalls * complexFrac * 6000 * flagship.inputPer1M) / 1_000_000 +
        (monthlyCalls * complexFrac * 800 * flagship.outputPer1M) / 1_000_000) +
        ((monthlyCalls * simpleFrac * 2400 * economy.inputPer1M) / 1_000_000 +
          (monthlyCalls * simpleFrac * 320 * economy.outputPer1M) / 1_000_000)) *
      batchFactor;
    const savings = Math.max(0, baseCost - routedCost);
    const savingsPct = baseCost > 0 ? Math.round((savings / baseCost) * 100) : 0;
    return { baseCost, routedCost, savings, savingsPct };
  }, [simpleSharePct, callsPerDay, flagship, economy, batchFactor]);

  return (
    <SiteShell
      title="Hybrid LLM Routing Simulator — Cut API Costs Without Losing Quality"
      subtitle="promptbill.online/tools/routing-simulator · Economy vs. Flagship Traffic Split"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <strong>Hybrid Model Routing</strong> sends routine classification, formatting, and retrieval queries to an economy model while escalating complex reasoning and multi-step coding to a flagship model. Combine routing with <strong>prompt caching</strong> or <strong>50% Batch API</strong> processing for deeper cost savings.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Complex / Flagship Model</span>
              <select
                value={flagshipSlug}
                onChange={(e) => setFlagshipSlug(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.name} (${m.inputPer1M}/${m.outputPer1M})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Routine / Economy Model</span>
              <select
                value={economySlug}
                onChange={(e) => setEconomySlug(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.name} (${m.inputPer1M}/${m.outputPer1M})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Routine % routed to {economy.name}</span>
              <input
                type="number"
                min={0}
                max={95}
                value={simpleSharePct}
                onChange={(e) => setSimpleSharePct(Math.min(95, Math.max(0, Number(e.target.value))))}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Calls / day</span>
              <input
                type="number"
                min={0}
                value={callsPerDay}
                onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setBatchEnabled((prev) => !prev)}
              className={`min-h-[38px] rounded-lg border px-3.5 py-2 text-xs font-semibold ${
                batchEnabled
                  ? 'border-emerald-800 bg-emerald-800 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              {batchEnabled ? '50% Batch API Discount: ACTIVE' : 'Apply 50% Batch API Discount'}
            </button>

            <div className="text-xs text-slate-700">
              Flagship: <Link href={`/models/${flagship.slug}`} className="font-semibold underline text-slate-900">{flagship.name}</Link>{' '}
              · Economy: <Link href={`/models/${economy.slug}`} className="font-semibold underline text-slate-900">{economy.name}</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-[11px] font-sans text-slate-700">100% {flagship.name}</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">${stats.baseCost.toFixed(2)}/mo</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-[11px] font-sans text-slate-700">Hybrid Routed ({simpleSharePct}% Economy)</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">${stats.routedCost.toFixed(2)}/mo</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="text-[11px] font-sans font-semibold text-emerald-900">Estimated Monthly Savings</div>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">
                ${stats.savings.toFixed(2)}/mo (-{stats.savingsPct}%)
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
