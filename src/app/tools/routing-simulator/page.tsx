'use client';

import React, { useState, useMemo } from 'react';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export default function RoutingSimulatorPage() {
  const [flagshipId, setFlagshipId] = useState('claude-fable-5-2');
  const [economyId, setEconomyId] = useState('qwen-3-7-flash');
  const [simpleSharePct, setSimpleSharePct] = useState(65);
  const [callsPerDay, setCallsPerDay] = useState(5000);
  const [inputTokens, setInputTokens] = useState(6000);
  const [outputTokens, setOutputTokens] = useState(800);

  const flagship = ALL_MODELS.find((m) => m.id === flagshipId) || ALL_MODELS[0];
  const economy = ALL_MODELS.find((m) => m.id === economyId) || ALL_MODELS[ALL_MODELS.length - 1];

  const calc = useMemo(() => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30;
    const unroutedCost =
      (monthlyCalls * inputTokens * flagship.inputPer1M) / 1_000_000 +
      (monthlyCalls * outputTokens * flagship.outputPer1M) / 1_000_000;

    const simpleFrac = simpleSharePct / 100;
    const complexFrac = 1 - simpleFrac;

    const routedCost =
      (monthlyCalls * complexFrac * inputTokens * flagship.inputPer1M) / 1_000_000 +
      (monthlyCalls * complexFrac * outputTokens * flagship.outputPer1M) / 1_000_000 +
      (monthlyCalls * simpleFrac * inputTokens * 0.4 * economy.inputPer1M) / 1_000_000 +
      (monthlyCalls * simpleFrac * outputTokens * 0.4 * economy.outputPer1M) / 1_000_000;

    const savings = Math.max(0, unroutedCost - routedCost);
    const savingsPct = unroutedCost > 0 ? Math.round((savings / unroutedCost) * 100) : 0;

    return { unroutedCost, routedCost, savings, savingsPct };
  }, [flagship, economy, simpleSharePct, callsPerDay, inputTokens, outputTokens]);

  return (
    <SiteShell
      title="Hybrid Model Routing Simulator"
      subtitle="promptbill.online/tools/routing-simulator · Economy + Flagship Escalation"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs border-b border-slate-100 pb-5">
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Flagship model</span>
            <select value={flagshipId} onChange={(e) => setFlagshipId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900">
              {ALL_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Economy model</span>
            <select value={economyId} onChange={(e) => setEconomyId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900">
              {ALL_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Routine % to economy</span>
            <input type="number" min={0} max={95} value={simpleSharePct} onChange={(e) => setSimpleSharePct(Math.min(95, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Calls / day</span>
            <input type="number" min={0} value={callsPerDay} onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Input / Output tok</span>
            <div className="flex gap-1.5">
              <input type="number" min={0} value={inputTokens} onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))} className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 font-mono text-slate-900" />
              <input type="number" min={0} value={outputTokens} onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))} className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 font-mono text-slate-900" />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">100% {flagship.name}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900">${calc.unroutedCost.toFixed(2)}/mo</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Hybrid Routed Spend</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900">${calc.routedCost.toFixed(2)}/mo</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="text-xs font-semibold text-emerald-800">Estimated Monthly Savings</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-700">
              ${calc.savings.toFixed(2)}/mo (-{calc.savingsPct}%)
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
