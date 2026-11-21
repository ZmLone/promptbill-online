'use client';

import React, { useState } from 'react';
import { LLMModel, CostInputs, calculateModelCost, formatCurrency } from '../lib/pricingEngine';
import { GitBranch, TrendingDown, Sparkles } from 'lucide-react';

interface Props {
  models: LLMModel[];
  baseInputs: CostInputs;
}

export const RoutingSimulator: React.FC<Props> = ({ models, baseInputs }) => {
  const [simpleShare, setSimpleShare] = useState<number>(65);
  const [flagshipId, setFlagshipId] = useState<string>('claude-fable-5-2');
  const [economyId, setEconomyId] = useState<string>('qwen-3-7-flash');

  const flagshipModel = models.find((m) => m.id === flagshipId) || models[4];
  const economyModel = models.find((m) => m.id === economyId) || models[models.length - 2];

  const allFlagshipCost = calculateModelCost(flagshipModel, baseInputs).monthlyTotalCost;

  const complexFraction = (100 - simpleShare) / 100;
  const simpleFraction = simpleShare / 100;

  const complexInputs: CostInputs = {
    ...baseInputs,
    callsPerDay: Math.round(baseInputs.callsPerDay * complexFraction),
  };

  const simpleInputs: CostInputs = {
    ...baseInputs,
    inputTokensPerCall: Math.max(400, Math.round(baseInputs.inputTokensPerCall * 0.35)),
    outputTokensPerCall: Math.max(120, Math.round(baseInputs.outputTokensPerCall * 0.3)),
    reasoningTokensPerCall: 0,
    callsPerDay: Math.round(baseInputs.callsPerDay * simpleFraction),
  };

  const routedMonthlyCost =
    calculateModelCost(flagshipModel, complexInputs).monthlyTotalCost +
    calculateModelCost(economyModel, simpleInputs).monthlyTotalCost;

  const monthlySavings = Math.max(0, allFlagshipCost - routedMonthlyCost);
  const savingsPct = allFlagshipCost > 0 ? Math.round((monthlySavings / allFlagshipCost) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <GitBranch className="w-3.5 h-3.5" />
            Tool 4 of 4 · Hybrid Routing Simulator
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Model Routing &amp; Escalation Savings
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Route routine classification, formatting, and retrieval checks to a fast economy model while reserving frontier reasoning for complex prompts.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-left md:text-right">
          <div className="text-xs uppercase tracking-wider text-emerald-300/80">Estimated Monthly Savings</div>
          <div className="mt-0.5 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {formatCurrency(monthlySavings)}{' '}
            <span className="text-sm font-semibold text-emerald-300">(-{savingsPct}%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Complex / Flagship Model
              </label>
              <select
                value={flagshipId}
                onChange={(e) => setFlagshipId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Routine / Fast Economy Model
              </label>
              <select
                value={economyId}
                onChange={(e) => setEconomyId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {models.map((m) => (
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
                Traffic Routed to Economy Model: <strong className="font-mono text-emerald-400">{simpleShare}%</strong>
              </span>
              <span className="font-mono text-xs text-slate-400">
                {100 - simpleShare}% Flagship
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={simpleShare}
              onChange={(e) => setSimpleShare(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>0% (All Flagship)</span>
              <span>50% Split</span>
              <span>95% (Aggressive Routing)</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">100% {flagshipModel.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">Unrouted baseline</div>
            </div>
            <div className="font-mono text-lg font-semibold text-rose-300 tabular-nums">
              {formatCurrency(allFlagshipCost)}/mo
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Hybrid Routed Spend
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {economyModel.name} ({simpleShare}%) + {flagshipModel.name} ({100 - simpleShare}%)
              </div>
            </div>
            <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
              {formatCurrency(routedMonthlyCost)}/mo
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0a0f18] px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Output tokens cost 4x–5x more than input tokens across frontier APIs—capping verbosity and routing simple prompts compounds savings fast.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
