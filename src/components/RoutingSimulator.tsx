'use client';

import React, { useState, useMemo } from 'react';
import {
  type LLMModel,
  type CostInputs,
  calculateModelCost,
  formatCurrency,
} from '../lib/pricingEngine';
import { GitBranch, TrendingDown, Sparkles } from 'lucide-react';

interface Props {
  models: LLMModel[];
  baseInputs: CostInputs;
}

export const RoutingSimulator: React.FC<Props> = ({ models, baseInputs }) => {
  const safeModels = Array.isArray(models) ? models : [];
  const [simpleShare, setSimpleShare] = useState<number>(65);
  const [flagshipId, setFlagshipId] = useState<string>(safeModels[0]?.id ?? '');
  const [economyId, setEconomyId] = useState<string>(
    safeModels[safeModels.length - 1]?.id ?? safeModels[0]?.id ?? ''
  );

  const flagshipModel = useMemo(
    () => safeModels.find((m) => m.id === flagshipId) ?? safeModels[0],
    [safeModels, flagshipId]
  );

  const economyModel = useMemo(
    () => safeModels.find((m) => m.id === economyId) ?? safeModels[safeModels.length - 1] ?? safeModels[0],
    [safeModels, economyId]
  );

  const simulation = useMemo(() => {
    if (!flagshipModel || !economyModel) {
      return {
        allFlagshipCost: null,
        routedMonthlyCost: null,
        monthlySavings: null,
        savingsPct: null,
      };
    }

    const baseCalc = calculateModelCost(flagshipModel, baseInputs);
    const complexFraction = (100 - simpleShare) / 100;
    const simpleFraction = simpleShare / 100;

    const complexInputs: CostInputs = {
      ...baseInputs,
      callsPerDay: Math.round(Math.max(0, baseInputs.callsPerDay) * complexFraction),
    };

    const simpleInputs: CostInputs = {
      ...baseInputs,
      inputTokensPerCall: Math.max(0, Math.round(Math.max(0, baseInputs.inputTokensPerCall) * 0.35)),
      outputTokensPerCall: Math.max(0, Math.round(Math.max(0, baseInputs.outputTokensPerCall) * 0.3)),
      reasoningTokensPerCall: 0,
      callsPerDay: Math.round(Math.max(0, baseInputs.callsPerDay) * simpleFraction),
    };

    const complexCalc = calculateModelCost(flagshipModel, complexInputs);
    const simpleCalc = calculateModelCost(economyModel, simpleInputs);

    if (
      !baseCalc.hasPricingData ||
      !complexCalc.hasPricingData ||
      !simpleCalc.hasPricingData ||
      baseCalc.monthlyTotalCost === null ||
      complexCalc.monthlyTotalCost === null ||
      simpleCalc.monthlyTotalCost === null
    ) {
      return {
        allFlagshipCost: baseCalc.monthlyTotalCost,
        routedMonthlyCost: null,
        monthlySavings: null,
        savingsPct: null,
      };
    }

    const routedTotal = complexCalc.monthlyTotalCost + simpleCalc.monthlyTotalCost;
    const savings = Math.max(0, baseCalc.monthlyTotalCost - routedTotal);
    const pct =
      baseCalc.monthlyTotalCost > 0
        ? Math.round((savings / baseCalc.monthlyTotalCost) * 100)
        : 0;

    return {
      allFlagshipCost: baseCalc.monthlyTotalCost,
      routedMonthlyCost: routedTotal,
      monthlySavings: savings,
      savingsPct: pct,
    };
  }, [flagshipModel, economyModel, baseInputs, simpleShare]);

  if (!flagshipModel || !economyModel) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 text-sm text-slate-300">
        No model records available for routing simulation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
            <GitBranch className="w-3.5 h-3.5" />
            Hybrid Routing Simulator
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Model Routing &amp; Escalation Savings Estimate
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Estimate cost differences when routing a portion of requests to a lower-cost model while keeping complex requests on a higher-tier model. Estimates depend on prompt complexity and task accuracy requirements.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/40 px-4 py-3 text-left md:text-right">
          <div className="text-xs uppercase tracking-wider text-emerald-200">Estimated Monthly Savings</div>
          <div className="mt-0.5 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
            {simulation.monthlySavings !== null
              ? `${formatCurrency(simulation.monthlySavings)} (-${simulation.savingsPct ?? 0}%)`
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="routing-flagship-select" className="block text-xs font-medium uppercase tracking-wider text-slate-200 mb-2">
                Primary / Complex Model
              </label>
              <select
                id="routing-flagship-select"
                value={flagshipId}
                onChange={(e) => setFlagshipId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {safeModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="routing-economy-select" className="block text-xs font-medium uppercase tracking-wider text-slate-200 mb-2">
                Routed / Economy Model
              </label>
              <select
                id="routing-economy-select"
                value={economyId}
                onChange={(e) => setEconomyId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {safeModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-200">
                Traffic Routed to Secondary Model:{' '}
                <strong className="font-mono text-emerald-300">{simpleShare}%</strong>
              </span>
              <span className="font-mono text-xs text-slate-300">
                {100 - simpleShare}% Primary
              </span>
            </div>
            <input
              type="range"
              aria-label="Traffic Routed to Secondary Model percentage"
              min={0}
              max={95}
              step={5}
              value={simpleShare}
              onChange={(e) => setSimpleShare(Number(e.target.value))}
              className="h-6 w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-200">100% {flagshipModel.name}</div>
              <div className="text-xs text-slate-300 mt-0.5">Unrouted baseline</div>
            </div>
            <div className="font-mono text-lg font-semibold text-rose-200 tabular-nums">
              {simulation.allFlagshipCost !== null
                ? `${formatCurrency(simulation.allFlagshipCost)}/mo`
                : 'N/A'}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Hybrid Routed Estimate
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {economyModel.name} ({simpleShare}%) + {flagshipModel.name} ({100 - simpleShare}%)
              </div>
            </div>
            <div className="font-mono text-xl font-bold text-emerald-300 tabular-nums">
              {simulation.routedMonthlyCost !== null
                ? `${formatCurrency(simulation.routedMonthlyCost)}/mo`
                : 'N/A'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0a0f18] px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              Estimates are illustrative only and not an invoice guarantee; routing complex tasks to smaller models can reduce accuracy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
