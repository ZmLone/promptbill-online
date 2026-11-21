'use client';

import React, { useState, useMemo } from 'react';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export default function RoutingSimulatorPage() {
  const [simpleSharePct, setSimpleSharePct] = useState(65);
  const [callsPerDay, setCallsPerDay] = useState(5000);
  const flagship = ALL_MODELS[0];
  const economy = ALL_MODELS.find((m) => m.slug === 'qwen-3-7-flash') || ALL_MODELS[ALL_MODELS.length - 1];

  const stats = useMemo(() => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30;
    const baseCost = (monthlyCalls * 6000 * flagship.inputPer1M) / 1_000_000 + (monthlyCalls * 800 * flagship.outputPer1M) / 1_000_000;
    const simpleFrac = simpleSharePct / 100;
    const complexFrac = 1 - simpleFrac;
    const routedCost =
      (monthlyCalls * complexFrac * 6000 * flagship.inputPer1M) / 1_000_000 +
      (monthlyCalls * complexFrac * 800 * flagship.outputPer1M) / 1_000_000 +
      (monthlyCalls * simpleFrac * 2400 * economy.inputPer1M) / 1_000_000 +
      (monthlyCalls * simpleFrac * 320 * economy.outputPer1M) / 1_000_000;
    return { baseCost, routedCost, savings: Math.max(0, baseCost - routedCost) };
  }, [simpleSharePct, callsPerDay, flagship, economy]);

  return (
    <SiteShell title="Hybrid Routing Simulator" subtitle="promptbill.online/tools/routing-simulator">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="space-y-1">
            <span className="text-slate-600">Routine % routed to {economy.name}</span>
            <input type="number" min={0} max={95} value={simpleSharePct} onChange={(e) => setSimpleSharePct(Math.min(95, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600">Calls / day</span>
            <input type="number" min={0} value={callsPerDay} onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] font-sans text-slate-500">100% {flagship.name}</div><div className="text-lg font-bold">${stats.baseCost.toFixed(2)}/mo</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] font-sans text-slate-500">Hybrid Routed</div><div className="text-lg font-bold">${stats.routedCost.toFixed(2)}/mo</div></div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5"><div className="text-[11px] font-sans font-semibold text-emerald-800">Monthly Savings</div><div className="text-lg font-bold text-emerald-700">${stats.savings.toFixed(2)}/mo</div></div>
        </div>
      </section>
    </SiteShell>
  );
}
