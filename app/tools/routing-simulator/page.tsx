'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { calculateModelCost, formatCurrency } from '../../../lib/pricingEngine';

function fmtRateLabel(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function RoutingSimulatorPage() {
  const [simpleSharePct, setSimpleSharePct] = useState<number>(65);
  const [callsPerDay, setCallsPerDay] = useState<number>(5000);
  const [flagshipSlug, setFlagshipSlug] = useState<string>(ALL_MODELS[0]?.slug ?? '');
  const [economySlug, setEconomySlug] = useState<string>(
    ALL_MODELS[ALL_MODELS.length - 1]?.slug ?? ALL_MODELS[0]?.slug ?? ''
  );
  const [batchEnabled, setBatchEnabled] = useState<boolean>(false);

  const flagship = useMemo(
    () => ALL_MODELS.find((m) => m.slug === flagshipSlug) ?? ALL_MODELS[0],
    [flagshipSlug]
  );

  const economy = useMemo(
    () =>
      ALL_MODELS.find((m) => m.slug === economySlug) ??
      ALL_MODELS[ALL_MODELS.length - 1] ??
      ALL_MODELS[0],
    [economySlug]
  );

  const stats = useMemo(() => {
    if (!flagship || !economy) {
      return { baseCost: null, routedCost: null, savings: null, savingsPct: null, batchSupported: false };
    }

    const batchPct = batchEnabled ? 100 : 0;
    const baseCalc = calculateModelCost(flagship, {
      inputTokensPerCall: 6000,
      outputTokensPerCall: 800,
      reasoningTokensPerCall: 0,
      callsPerDay,
      cacheHitPercent: 0,
      cacheWriteSharePercent: 0,
      batchPercent: batchPct,
      retriesPercent: 0,
    });

    const simpleFrac = simpleSharePct / 100;
    const complexFrac = 1 - simpleFrac;

    const complexCalc = calculateModelCost(flagship, {
      inputTokensPerCall: 6000,
      outputTokensPerCall: 800,
      reasoningTokensPerCall: 0,
      callsPerDay: callsPerDay * complexFrac,
      cacheHitPercent: 0,
      cacheWriteSharePercent: 0,
      batchPercent: batchPct,
      retriesPercent: 0,
    });

    const simpleCalc = calculateModelCost(economy, {
      inputTokensPerCall: 2400,
      outputTokensPerCall: 320,
      reasoningTokensPerCall: 0,
      callsPerDay: callsPerDay * simpleFrac,
      cacheHitPercent: 0,
      cacheWriteSharePercent: 0,
      batchPercent: batchPct,
      retriesPercent: 0,
    });

    const batchSupported = baseCalc.batchSupported || simpleCalc.batchSupported;

    if (
      !baseCalc.hasPricingData ||
      !complexCalc.hasPricingData ||
      !simpleCalc.hasPricingData ||
      baseCalc.monthlyTotalCost === null ||
      complexCalc.monthlyTotalCost === null ||
      simpleCalc.monthlyTotalCost === null
    ) {
      return {
        baseCost: baseCalc.monthlyTotalCost,
        routedCost: null,
        savings: null,
        savingsPct: null,
        batchSupported,
      };
    }

    const routedCost = Number((complexCalc.monthlyTotalCost + simpleCalc.monthlyTotalCost).toFixed(4));
    const savings = Math.max(0, Number((baseCalc.monthlyTotalCost - routedCost).toFixed(4)));
    const savingsPct =
      baseCalc.monthlyTotalCost > 0
        ? Math.round((savings / baseCalc.monthlyTotalCost) * 100)
        : 0;

    return {
      baseCost: baseCalc.monthlyTotalCost,
      routedCost,
      savings,
      savingsPct,
      batchSupported,
    };
  }, [simpleSharePct, callsPerDay, flagship, economy, batchEnabled]);

  if (!flagship || !economy) {
    return (
      <SiteShell
        title="Hybrid LLM Routing Simulator"
        subtitle="promptbill.online/tools/routing-simulator"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Model data is unavailable. Visit{' '}
          <Link href="/models" className="font-semibold text-emerald-800 underline">
            /models
          </Link>
          .
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      title="Hybrid LLM Routing Simulator"
      subtitle="promptbill.online/tools/routing-simulator · Primary vs. Routed Traffic Split"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <strong>Routing Estimate Disclaimer:</strong> This simulator models hypothetical cost differences when routing a share of requests to a lower-cost model. Actual accuracy, latency, and API invoices depend on your workload and prompt complexity.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Primary / Complex Model</span>
              <select
                value={flagshipSlug}
                onChange={(e) => setFlagshipSlug(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.name} ({fmtRateLabel(m.inputPer1M)}/{fmtRateLabel(m.outputPer1M)})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Routed / Lower-Cost Model</span>
              <select
                value={economySlug}
                onChange={(e) => setEconomySlug(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.name} ({fmtRateLabel(m.inputPer1M)}/{fmtRateLabel(m.outputPer1M)})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">
                Routed % to {economy.name}
              </span>
              <input
                type="number"
                min={0}
                max={95}
                value={simpleSharePct}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  const safe = Number.isFinite(parsed) ? parsed : 0;
                  setSimpleSharePct(Math.min(95, Math.max(0, safe)));
                }}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-slate-800 font-medium block">Calls / day</span>
              <input
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {stats.batchSupported ? (
              <button
                type="button"
                onClick={() => setBatchEnabled((prev) => !prev)}
                className={`min-h-[38px] rounded-lg border px-3.5 py-2 text-xs font-semibold ${
                  batchEnabled
                    ? 'border-emerald-800 bg-emerald-800 text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                }`}
              >
                {batchEnabled ? 'Batch API Discount: ACTIVE' : 'Apply Model Batch Discount'}
              </button>
            ) : (
              <span className="text-xs text-slate-600">Batch discount: Not verified on selected models</span>
            )}

            <div className="text-xs text-slate-700">
              Primary:{' '}
              <Link href={`/models/${flagship.slug}`} className="font-semibold underline text-slate-900">
                {flagship.name}
              </Link>{' '}
              · Secondary:{' '}
              <Link href={`/models/${economy.slug}`} className="font-semibold underline text-slate-900">
                {economy.name}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-[11px] font-sans text-slate-700">100% {flagship.name}</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {stats.baseCost !== null ? `${formatCurrency(stats.baseCost)}/mo` : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-[11px] font-sans text-slate-700">
                Routed Estimate ({simpleSharePct}% Secondary)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {stats.routedCost !== null ? `${formatCurrency(stats.routedCost)}/mo` : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="text-[11px] font-sans font-semibold text-emerald-900">
                Estimated Monthly Difference
              </div>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">
                {stats.savings !== null
                  ? `${formatCurrency(stats.savings)}/mo (-${stats.savingsPct ?? 0}%)`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
