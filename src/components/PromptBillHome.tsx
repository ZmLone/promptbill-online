'use client';

import React, { useState, useMemo, useEffect } from 'react';
import modelsJson from '../data/models.json';
import presetsJson from '../data/presets.json';
import {
  type LLMModel,
  type CostInputs,
  type InputUnitMode,
  calculateModelCost,
  formatCurrency,
  formatTokenThreshold,
  unitValueToTokens,
  tokensToUnitValue,
} from '../lib/pricingEngine';
import { BrandMark } from './BrandMark';
import { LivePromptTokenizer } from './LivePromptTokenizer';
import { ComparisonMatrix } from './ComparisonMatrix';
import { RoutingSimulator } from './RoutingSimulator';
import { FeatureGuideAndFaq, type WorkspaceTab } from './FeatureGuideAndFaq';
import {
  Calculator,
  Zap,
  ShieldCheck,
  Sliders,
  Check,
  ArrowUpRight,
  Cpu,
  DollarSign,
  FileText,
  Table2,
  GitBranch,
  Layers,
  Server,
  AlertTriangle,
} from 'lucide-react';

const models = Array.isArray(modelsJson) ? (modelsJson as LLMModel[]) : [];
const presets = Array.isArray(presetsJson) ? presetsJson : [];

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function PromptBillHome() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('calculator');
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id ?? '');
  const [activePresetId, setActivePresetId] = useState<string>(presets[0]?.id ?? 'custom');
  const [unitMode, setUnitMode] = useState<InputUnitMode>('tokens');
  const [cacheWriteSharePct, setCacheWriteSharePct] = useState<number>(0);

  const [inputs, setInputs] = useState<CostInputs>({
    inputTokensPerCall: 6500,
    outputTokensPerCall: 650,
    reasoningTokensPerCall: 0,
    callsPerDay: 2500,
    cacheHitPercent: 0,
    batchPercent: 0,
    retriesPercent: 0,
  });

  const [monthlyActiveUsers, setMonthlyActiveUsers] = useState<number>(4000);
  const [pricePerUserUsd, setPricePerUserUsd] = useState<number>(19);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const m = params.get('m');
    if (m && models.some((item) => item.id === m)) {
      setSelectedModelId(m);
    }
    const inTok = params.get('in');
    const outTok = params.get('out');
    const rsnTok = params.get('rsn');
    const cpd = params.get('cpd');
    const cache = params.get('cache');
    const batch = params.get('batch');
    const retry = params.get('retry');
    if (inTok || outTok || cpd) {
      setActivePresetId('custom');
      setInputs((prev) => ({
        ...prev,
        inputTokensPerCall: inTok ? Math.max(0, Number(inTok) || 0) : prev.inputTokensPerCall,
        outputTokensPerCall: outTok ? Math.max(0, Number(outTok) || 0) : prev.outputTokensPerCall,
        reasoningTokensPerCall: rsnTok
          ? Math.max(0, Number(rsnTok) || 0)
          : prev.reasoningTokensPerCall,
        callsPerDay: cpd ? Math.max(0, Number(cpd) || 0) : prev.callsPerDay,
        cacheHitPercent: cache
          ? Math.min(100, Math.max(0, Number(cache) || 0))
          : prev.cacheHitPercent,
        batchPercent: batch
          ? Math.min(100, Math.max(0, Number(batch) || 0))
          : prev.batchPercent,
        retriesPercent: retry
          ? Math.min(100, Math.max(0, Number(retry) || 0))
          : prev.retriesPercent,
      }));
    }
  }, []);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) || models[0],
    [selectedModelId]
  );

  const effectiveCostInputs = useMemo<CostInputs>(
    () => ({
      ...inputs,
      cacheWriteSharePercent: cacheWriteSharePct,
    }),
    [inputs, cacheWriteSharePct]
  );

  const activeBreakdown = useMemo(
    () =>
      selectedModel
        ? calculateModelCost(selectedModel, effectiveCostInputs)
        : null,
    [selectedModel, effectiveCostInputs]
  );

  const cheapestModelRow = useMemo(() => {
    const priced = models
      .map((m) => ({ model: m, calc: calculateModelCost(m, effectiveCostInputs) }))
      .filter(
        (row): row is { model: LLMModel; calc: ReturnType<typeof calculateModelCost> & { monthlyTotalCost: number } } =>
          row.calc.hasPricingData && typeof row.calc.monthlyTotalCost === 'number'
      )
      .sort((a, b) => a.calc.monthlyTotalCost - b.calc.monthlyTotalCost);
    return priced[0] ?? null;
  }, [effectiveCostInputs]);

  const hostingComparisons = useMemo(() => {
    if (!selectedModel) return [];
    const endpoints =
      selectedModel.hostingEndpoints && selectedModel.hostingEndpoints.length > 0
        ? selectedModel.hostingEndpoints
        : [
            {
              host: `${selectedModel.provider} Primary`,
              providerType: 'Official API' as const,
              inputPer1M: selectedModel.inputPer1M,
              cachedInputPer1M: selectedModel.cachedInputPer1M,
              cacheWritePer1M: selectedModel.cacheWritePer1M ?? null,
              outputPer1M: selectedModel.outputPer1M,
              batchDiscount: selectedModel.batchDiscount ?? null,
              notes: selectedModel.notes ?? null,
            },
          ];

    return endpoints
      .map((ep) => {
        const variantModel: LLMModel = {
          ...selectedModel,
          provider: ep.host,
          inputPer1M: ep.inputPer1M,
          cachedInputPer1M: ep.cachedInputPer1M ?? null,
          cacheWritePer1M: ep.cacheWritePer1M ?? null,
          outputPer1M: ep.outputPer1M,
          batchDiscount: ep.batchDiscount ?? null,
        };
        return {
          endpoint: ep,
          calc: calculateModelCost(variantModel, effectiveCostInputs),
        };
      })
      .sort((a, b) => {
        const costA = a.calc.monthlyTotalCost;
        const costB = b.calc.monthlyTotalCost;
        if (costA === null && costB === null) return 0;
        if (costA === null) return 1;
        if (costB === null) return -1;
        return costA - costB;
      });
  }, [selectedModel, effectiveCostInputs]);

  if (!selectedModel || !activeBreakdown) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 p-8 text-sm">
        No models available in the catalog snapshot.
      </div>
    );
  }

  const applyPreset = (preset: (typeof presets)[number]) => {
    setActivePresetId(preset.id);
    setInputs({
      inputTokensPerCall: preset.inputTokensPerCall,
      outputTokensPerCall: preset.outputTokensPerCall,
      reasoningTokensPerCall: preset.reasoningTokensPerCall ?? 0,
      callsPerDay: preset.callsPerDay,
      cacheHitPercent: preset.cacheHitPercent ?? 0,
      batchPercent: preset.batchPercent ?? 0,
      retriesPercent: preset.retriesPercent ?? 0,
    });
  };

  const jumpToTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApplyPromptTokens = (tokens: number) => {
    setActivePresetId('custom');
    setUnitMode('tokens');
    setInputs((prev) => ({ ...prev, inputTokensPerCall: tokens }));
    setActiveTab('calculator');
  };

  const handleSelectModelFromMatrix = (id: string) => {
    setSelectedModelId(id);
    setActiveTab('calculator');
  };

  const projectedMonthlyRevenue = monthlyActiveUsers * pricePerUserUsd;
  const aiCostShareOfRevenue =
    projectedMonthlyRevenue > 0 && activeBreakdown.monthlyTotalCost !== null
      ? (activeBreakdown.monthlyTotalCost / projectedMonthlyRevenue) * 100
      : null;
  const estimatedGrossMarginPct =
    aiCostShareOfRevenue !== null ? Math.max(0, 100 - aiCostShareOfRevenue) : null;

  const unitLabel =
    unitMode === 'tokens' ? 'Tokens' : unitMode === 'words' ? 'Words' : 'Characters';

  const TABS: {
    id: WorkspaceTab;
    label: string;
    badge?: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'calculator', label: '1. Cost Calculator', icon: Calculator },
    { id: 'tokenizer', label: '2. Prompt Tokenizer', icon: FileText },
    { id: 'matrix', label: '3. Compare Models', badge: 'CSV', icon: Table2 },
    { id: 'routing', label: '4. Routing Simulator', icon: GitBranch },
  ];

  const batchPctLabel =
    activeBreakdown.batchSupported
      ? `${Math.round(activeBreakdown.batchDiscountRate * 100)}%`
      : 'Not available';

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080b12]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#" aria-label="PromptBill Home" className="flex min-h-[44px] items-center gap-2.5 pr-2">
            <BrandMark className="h-8 w-8" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">PromptBill</span>
              <span className="hidden rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-200 sm:inline-block">
                promptbill.online
              </span>
            </div>
          </a>

          <nav aria-label="Workspace Navigation" className="hidden md:flex items-center gap-2 text-sm text-slate-200">
            <button
              type="button"
              onClick={() => jumpToTab('calculator')}
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              Calculator
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('tokenizer')}
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              Tokenizer
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('matrix')}
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              Model Matrix
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('routing')}
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              Routing
            </button>
            <a
              href="#feature-guide"
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              Guide &amp; FAQ
            </a>
          </nav>

          <a
            href="#pro-license"
            className="inline-flex min-h-[40px] items-center rounded-lg bg-emerald-400 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-300 transition-colors"
          >
            Pro License ($9)
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#0e1422] px-3.5 py-1.5 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              LLM API Cost Estimator · Caching · Batch &amp; Context Tiers · Endpoints
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Calculate &amp; Compare AI API Token Costs.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Estimate 30-day API spend using model-specific caching rates, batch discounts where supported, long-context thresholds, and endpoint comparisons.
            </p>
          </div>

          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-slate-800 bg-[#0d121d] p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Active Model ({selectedModel.contextWindow ?? 'N/A'})</span>
              <span className="font-mono text-emerald-300">
                {formatCurrency(activeBreakdown.costPerRequest)}/req
              </span>
            </div>
            <div className="text-lg font-bold text-white">{selectedModel.name}</div>
            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-300">Est. 30-Day Bill</span>
              <span className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">
                {formatCurrency(activeBreakdown.monthlyTotalCost)}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>Lowest listed cost</span>
              <span className="font-mono text-white tabular-nums">
                {cheapestModelRow
                  ? `${cheapestModelRow.model.name} (${formatCurrency(cheapestModelRow.calc.monthlyTotalCost)})`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        <section id="workspace" className="space-y-6">
          <div
            role="tablist"
            aria-label="PromptBill Tools"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 rounded-2xl border border-slate-800 bg-[#0b1019] p-2"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-emerald-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0d121d] p-5 sm:p-8">
            {activeTab === 'calculator' && (
              <div className="space-y-8">
                {presets.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Workload Presets
                      </span>
                      <span className="text-xs text-slate-300">Select to load assumptions</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {presets.map((preset) => {
                        const isActive = activePresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`text-left rounded-xl border p-4 transition-all ${
                              isActive
                                ? 'border-emerald-400/70 bg-emerald-950/30'
                                : 'border-slate-800 bg-[#111827] hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs sm:text-sm text-white">
                                {preset.title}
                              </span>
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-300 line-clamp-2">
                              {preset.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-300" />
                        <h2 className="text-lg font-bold text-white">Token &amp; Billing Parameters</h2>
                      </div>

                      <div className="inline-flex rounded-xl border border-slate-700 bg-[#131a29] p-1 text-xs">
                        {(['tokens', 'words', 'characters'] as InputUnitMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setUnitMode(mode)}
                            className={`min-h-[36px] rounded-lg px-3 py-1.5 capitalize font-medium transition-colors ${
                              unitMode === mode
                                ? 'bg-emerald-400 text-slate-950'
                                : 'text-slate-200 hover:text-white'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="calc-model-select"
                          className="block text-xs font-medium text-slate-200 mb-1.5"
                        >
                          Model Selection
                        </label>
                        <select
                          id="calc-model-select"
                          value={selectedModelId}
                          onChange={(e) => setSelectedModelId(e.target.value)}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.provider} ({fmtRate(m.inputPer1M)}/{fmtRate(m.outputPer1M)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="calc-calls-per-day"
                          className="block text-xs font-medium text-slate-200 mb-1.5"
                        >
                          API Calls / Requests per Day
                        </label>
                        <input
                          id="calc-calls-per-day"
                          type="number"
                          min={0}
                          value={inputs.callsPerDay}
                          onChange={(e) => {
                            setActivePresetId('custom');
                            const parsed = Number(e.target.value);
                            setInputs({
                              ...inputs,
                              callsPerDay: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
                            });
                          }}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="calc-input-units"
                          className="block text-xs font-medium text-slate-200 mb-1.5"
                        >
                          Input {unitLabel} per Call{' '}
                          {unitMode !== 'tokens' && (
                            <span className="text-emerald-300 font-mono">
                              ({inputs.inputTokensPerCall.toLocaleString()} tok)
                            </span>
                          )}
                        </label>
                        <input
                          id="calc-input-units"
                          type="number"
                          min={0}
                          step={unitMode === 'characters' ? 200 : 50}
                          value={tokensToUnitValue(inputs.inputTokensPerCall, unitMode)}
                          onChange={(e) => {
                            setActivePresetId('custom');
                            setInputs({
                              ...inputs,
                              inputTokensPerCall: unitValueToTokens(Number(e.target.value), unitMode),
                            });
                          }}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="calc-output-units"
                          className="block text-xs font-medium text-slate-200 mb-1.5"
                        >
                          Output {unitLabel} per Call{' '}
                          {unitMode !== 'tokens' && (
                            <span className="text-emerald-300 font-mono">
                              ({inputs.outputTokensPerCall.toLocaleString()} tok)
                            </span>
                          )}
                        </label>
                        <input
                          id="calc-output-units"
                          type="number"
                          min={0}
                          step={unitMode === 'characters' ? 100 : 25}
                          value={tokensToUnitValue(inputs.outputTokensPerCall, unitMode)}
                          onChange={(e) => {
                            setActivePresetId('custom');
                            setInputs({
                              ...inputs,
                              outputTokensPerCall: unitValueToTokens(Number(e.target.value), unitMode),
                            });
                          }}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        activeBreakdown.exceedsContextWindow
                          ? 'border-rose-400/50 bg-rose-950/30 text-rose-100'
                          : activeBreakdown.triggersLongContextMultiplier
                          ? 'border-amber-400/50 bg-amber-950/30 text-amber-100'
                          : 'border-slate-800 bg-[#111827] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-300 shrink-0" />
                        <span>
                          <strong>Context Tier:</strong> {activeBreakdown.activeContextTierLabel}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-300">
                        Threshold: {formatTokenThreshold(selectedModel.longContextThresholdTokens)} /
                        Max {selectedModel.contextWindow ?? 'N/A'}
                      </span>
                    </div>

                    {activeBreakdown.exceedsContextWindow && (
                      <div className="rounded-xl border border-rose-400/50 bg-rose-950/40 p-3.5 text-xs text-rose-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                        <span>
                          Combined input + output tokens (
                          {(inputs.inputTokensPerCall + inputs.outputTokensPerCall).toLocaleString()}
                          ) exceed {selectedModel.name}&apos;s {selectedModel.contextWindow ?? 'N/A'}{' '}
                          context window.
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                          <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                          Prompt Caching, Batch Discount &amp; Retries
                        </div>
                        {activeBreakdown.batchSupported ? (
                          <button
                            type="button"
                            onClick={() =>
                              setInputs((prev) => ({
                                ...prev,
                                batchPercent: prev.batchPercent >= 50 ? 0 : 100,
                              }))
                            }
                            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              inputs.batchPercent > 0
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-700 bg-[#131a29] text-slate-200 hover:border-slate-500'
                            }`}
                          >
                            {inputs.batchPercent > 0
                              ? `Batch Active (${inputs.batchPercent}% · ${batchPctLabel} Off)`
                              : `Enable Batch Discount (${batchPctLabel} Off)`}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Batch discount: Not available
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">Cache Read Hit Rate</span>
                            <span className="font-mono text-emerald-300">
                              {inputs.cacheHitPercent}%
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label="Prompt Cache Read Hit Rate percentage"
                            min={0}
                            max={100}
                            step={5}
                            disabled={selectedModel.cachedInputPer1M === null}
                            value={
                              selectedModel.cachedInputPer1M === null ? 0 : inputs.cacheHitPercent
                            }
                            onChange={(e) =>
                              setInputs({ ...inputs, cacheHitPercent: Number(e.target.value) })
                            }
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="flex justify-between text-[11px] font-mono text-slate-300">
                            <span>Read: {formatCurrency(activeBreakdown.cacheReadRatePer1M)}/1M</span>
                            <span>
                              Write: {formatCurrency(activeBreakdown.cacheWriteRatePer1M)}/1M
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">Cache Write Share of Uncached</span>
                            <span className="font-mono text-emerald-300">
                              {cacheWriteSharePct}%
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label="Cache Write Share of Uncached Tokens percentage"
                            min={0}
                            max={100}
                            step={5}
                            disabled={!activeBreakdown.cacheWriteSupported}
                            value={!activeBreakdown.cacheWriteSupported ? 0 : cacheWriteSharePct}
                            onChange={(e) => setCacheWriteSharePct(Number(e.target.value))}
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="text-[11px] text-slate-300">
                            {activeBreakdown.cacheWriteSupported
                              ? 'Uses model-specific cache write rate where recorded.'
                              : 'Cache write rate not recorded; uncached non-read input uses base rate.'}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">
                              Batch Share ({batchPctLabel})
                            </span>
                            <span className="font-mono text-emerald-300">
                              {activeBreakdown.batchSupported ? `${inputs.batchPercent}%` : '0%'}
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label="Batch API Share percentage"
                            min={0}
                            max={100}
                            step={5}
                            disabled={!activeBreakdown.batchSupported}
                            value={activeBreakdown.batchSupported ? inputs.batchPercent : 0}
                            onChange={(e) =>
                              setInputs({ ...inputs, batchPercent: Number(e.target.value) })
                            }
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="text-[11px] font-mono text-slate-300">
                            Eff. Rates: {formatCurrency(activeBreakdown.effectiveInputRatePer1M)} In /{' '}
                            {formatCurrency(activeBreakdown.effectiveOutputRatePer1M)} Out
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <label
                            htmlFor="calc-reasoning-tokens"
                            className="block text-xs text-slate-200"
                          >
                            Reasoning / Thinking Tokens / Call
                          </label>
                          <input
                            id="calc-reasoning-tokens"
                            type="number"
                            min={0}
                            step={100}
                            value={inputs.reasoningTokensPerCall ?? 0}
                            onChange={(e) => {
                              const parsed = Number(e.target.value);
                              setInputs({
                                ...inputs,
                                reasoningTokensPerCall:
                                  Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
                              });
                            }}
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                          <div className="flex justify-between text-xs pt-1">
                            <span className="text-slate-300">Retry Buffer</span>
                            <span className="font-mono text-amber-300">
                              +{inputs.retriesPercent ?? 0}%
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label="Retry and Failure Buffer percentage"
                            min={0}
                            max={30}
                            step={1}
                            value={inputs.retriesPercent ?? 0}
                            onChange={(e) =>
                              setInputs({ ...inputs, retriesPercent: Number(e.target.value) })
                            }
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
                          <Server className="w-4 h-4 text-emerald-300" />
                          Endpoint Comparison — {selectedModel.name}
                        </div>
                        <span className="text-xs font-mono text-emerald-300">
                          Lowest 30-day estimate: {hostingComparisons[0]?.endpoint.host ?? 'N/A'}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#111827]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-[#0b1019] text-slate-300">
                              <th scope="col" className="py-2.5 px-3">Host / Endpoint</th>
                              <th scope="col" className="py-2.5 px-3">In / Out ($/1M)</th>
                              <th scope="col" className="py-2.5 px-3">Cache R/W</th>
                              <th scope="col" className="py-2.5 px-3 text-right">30-Day Bill</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 font-mono">
                            {hostingComparisons.map(({ endpoint, calc }, idx) => (
                              <tr
                                key={endpoint.host}
                                className={idx === 0 ? 'bg-emerald-950/20' : ''}
                              >
                                <th
                                  scope="row"
                                  className="py-2.5 px-3 font-sans text-left text-white font-medium"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{endpoint.host}</span>
                                    {endpoint.providerType && (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        ({endpoint.providerType})
                                      </span>
                                    )}
                                  </div>
                                  {endpoint.notes && (
                                    <div className="text-[11px] text-slate-300 font-normal mt-0.5">
                                      {endpoint.notes}
                                    </div>
                                  )}
                                </th>
                                <td className="py-2.5 px-3 text-slate-200">
                                  {fmtRate(endpoint.inputPer1M)} / {fmtRate(endpoint.outputPer1M)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">
                                  {fmtRate(endpoint.cachedInputPer1M)} /{' '}
                                  {fmtRate(endpoint.cacheWritePer1M)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                                  {formatCurrency(calc.monthlyTotalCost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          30-Day Cost Breakdown
                        </span>
                        <span className="font-mono text-xs text-slate-300 tabular-nums">
                          {activeBreakdown.monthlyCalls.toLocaleString()} calls/mo
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className="font-mono text-4xl font-bold text-white tabular-nums">
                          {formatCurrency(activeBreakdown.monthlyTotalCost)}
                        </div>
                        <div className="font-mono text-xs text-slate-300 tabular-nums">
                          {formatCurrency(activeBreakdown.costPerRequest)} / req
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-slate-800 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Input Tokens</span>
                          <span className="font-mono text-white tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyInputCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Output Tokens</span>
                          <span className="font-mono text-white tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyOutputCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Reasoning / Thinking Tokens</span>
                          <span className="font-mono text-white tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyReasoningCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Retry Buffer Overhead</span>
                          <span className="font-mono text-amber-300 tabular-nums">
                            +{formatCurrency(activeBreakdown.monthlyRetryOverheadCost)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-white font-medium">Blended Cost per 1,000 Calls</span>
                          <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                            {formatCurrency(activeBreakdown.costPer1KCalls)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-300" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                          Budget &amp; Margin Estimate
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="saas-active-users"
                            className="block text-xs text-slate-300 mb-1.5"
                          >
                            Active Users
                          </label>
                          <input
                            id="saas-active-users"
                            type="number"
                            min={1}
                            value={monthlyActiveUsers}
                            onChange={(e) =>
                              setMonthlyActiveUsers(Math.max(1, Number(e.target.value) || 1))
                            }
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="saas-price-per-user"
                            className="block text-xs text-slate-300 mb-1.5"
                          >
                            Price / User ($/mo)
                          </label>
                          <input
                            id="saas-price-per-user"
                            type="number"
                            min={1}
                            value={pricePerUserUsd}
                            onChange={(e) =>
                              setPricePerUserUsd(Math.max(1, Number(e.target.value) || 1))
                            }
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#0b1019] border border-slate-800 p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-300">Est. API Share of Revenue</div>
                          <div className="font-mono text-lg font-bold text-white tabular-nums">
                            {aiCostShareOfRevenue !== null
                              ? `${aiCostShareOfRevenue.toFixed(1)}%`
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300">Gross Margin After API Spend</div>
                          <div className="font-mono text-lg font-bold text-emerald-300 tabular-nums">
                            {estimatedGrossMarginPct !== null
                              ? `${estimatedGrossMarginPct.toFixed(1)}%`
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tokenizer' && (
              <LivePromptTokenizer
                models={models}
                selectedModel={selectedModel}
                onApplyInputTokens={handleApplyPromptTokens}
              />
            )}

            {activeTab === 'matrix' && (
              <ComparisonMatrix
                models={models}
                inputs={inputs}
                selectedModelId={selectedModelId}
                onSelectModel={handleSelectModelFromMatrix}
              />
            )}

            {activeTab === 'routing' && (
              <RoutingSimulator models={models} baseInputs={inputs} />
            )}
          </div>
        </section>

        <FeatureGuideAndFaq onJumpToTab={jumpToTab} />

        <section
          id="pro-license"
          className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#0e1826] via-[#0d121d] to-[#091512] p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
                <Zap className="w-3.5 h-3.5" />
                PromptBill Pro - One-Time License
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Export Cost Scenarios &amp; Routing Plans for $9
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                Built for developers and teams comparing multi-model API costs, caching, batch options, and routing splits.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Multi-model cost comparisons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Caching, batch &amp; retry modeling
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Hybrid model routing estimates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  One-time license checkout
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-700/80 bg-[#0b1019] p-6 text-center space-y-4">
              <div className="text-xs uppercase tracking-wider text-slate-300">Lifetime Pro Pass</div>
              <div className="font-mono text-4xl font-bold text-white">$9</div>
              <div className="text-xs text-slate-300">One-time payment - No subscription</div>
              <a
                href={process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || '#workspace'}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 transition-colors"
              >
                Get PromptBill Pro <ArrowUpRight className="w-4 h-4" />
              </a>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>promptbill.online</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070a10] py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <BrandMark className="h-5 w-5" />
            <span className="font-semibold text-white">PromptBill</span>
            <span>- promptbill.online</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => jumpToTab('calculator')}
              className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white"
            >
              Calculator
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('tokenizer')}
              className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white"
            >
              Tokenizer
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('matrix')}
              className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white"
            >
              Matrix
            </button>
            <button
              type="button"
              onClick={() => jumpToTab('routing')}
              className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white"
            >
              Routing
            </button>
            <a
              href="/sitemap.xml"
              className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white"
            >
              Sitemap
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>PromptBill Catalog</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
