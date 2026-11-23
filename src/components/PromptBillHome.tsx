'use client';

import { logEvent, posthogLog } from '../lib/posthogLog';

import React, { useState, useMemo, useEffect } from 'react';
import modelsJson from '../data/models.json';
import presetsJson from '../data/presets.json';
import {
  LLMModel,
  CostInputs,
  InputUnitMode,
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
import { FeatureGuideAndFaq, WorkspaceTab } from './FeatureGuideAndFaq';
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

const models = modelsJson as LLMModel[];

export default function PromptBillHome() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('calculator');
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-sonnet-5-5');
  const [activePresetId, setActivePresetId] = useState<string>('rag-assistant');
  const [unitMode, setUnitMode] = useState<InputUnitMode>('tokens');
  const [cacheWriteSharePct, setCacheWriteSharePct] = useState<number>(25);

  const [inputs, setInputs] = useState<CostInputs>({
    inputTokensPerCall: 6500,
    outputTokensPerCall: 650,
    reasoningTokensPerCall: 150,
    callsPerDay: 2500,
    cacheHitPercent: 60,
    batchPercent: 0,
    retriesPercent: 4,
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
        inputTokensPerCall: inTok ? Math.max(0, Number(inTok)) : prev.inputTokensPerCall,
        outputTokensPerCall: outTok ? Math.max(0, Number(outTok)) : prev.outputTokensPerCall,
        reasoningTokensPerCall: rsnTok ? Math.max(0, Number(rsnTok)) : prev.reasoningTokensPerCall,
        callsPerDay: cpd ? Math.max(0, Number(cpd)) : prev.callsPerDay,
        cacheHitPercent: cache ? Math.min(95, Math.max(0, Number(cache))) : prev.cacheHitPercent,
        batchPercent: batch ? Math.min(100, Math.max(0, Number(batch))) : prev.batchPercent,
        retriesPercent: retry ? Math.min(50, Math.max(0, Number(retry))) : prev.retriesPercent,
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
    () => calculateModelCost(selectedModel, effectiveCostInputs),
    [selectedModel, effectiveCostInputs]
  );

  const cheapestModelRow = useMemo(() => {
    return models
      .map((m) => ({ model: m, calc: calculateModelCost(m, effectiveCostInputs) }))
      .sort((a, b) => a.calc.monthlyTotalCost - b.calc.monthlyTotalCost)[0];
  }, [effectiveCostInputs]);

  const hostingComparisons = useMemo(() => {
    const endpoints =
      selectedModel.hostingEndpoints && selectedModel.hostingEndpoints.length > 0
        ? selectedModel.hostingEndpoints
        : [
            {
              host: `${selectedModel.provider} Primary`,
              providerType: 'Official API' as const,
              inputPer1M: selectedModel.inputPer1M,
              cachedInputPer1M: selectedModel.cachedInputPer1M,
              cacheWritePer1M: selectedModel.cacheWritePer1M ?? selectedModel.inputPer1M,
              outputPer1M: selectedModel.outputPer1M,
              batchDiscount: selectedModel.batchDiscount,
              notes: selectedModel.notes,
            },
          ];

    return endpoints
      .map((ep) => {
        const variantModel: LLMModel = {
          ...selectedModel,
          provider: ep.host,
          inputPer1M: ep.inputPer1M,
          cachedInputPer1M: ep.cachedInputPer1M,
          cacheWritePer1M: ep.cacheWritePer1M,
          outputPer1M: ep.outputPer1M,
          batchDiscount: ep.batchDiscount,
        };
        return {
          endpoint: ep,
          calc: calculateModelCost(variantModel, effectiveCostInputs),
        };
      })
      .sort((a, b) => a.calc.monthlyTotalCost - b.calc.monthlyTotalCost);
  }, [selectedModel, effectiveCostInputs]);

  const applyPreset = (preset: (typeof presetsJson)[number]) => {
    logEvent('workload_preset_applied', { preset_id: preset.id });
    posthogLog.info('workload preset applied', {
      log_source: 'posthog_instrumentation',
      preset_id: preset.id,
      calls_per_day: preset.callsPerDay,
    });
    setActivePresetId(preset.id);
    setInputs({
      inputTokensPerCall: preset.inputTokensPerCall,
      outputTokensPerCall: preset.outputTokensPerCall,
      reasoningTokensPerCall: preset.reasoningTokensPerCall,
      callsPerDay: preset.callsPerDay,
      cacheHitPercent: preset.cacheHitPercent,
      batchPercent: preset.batchPercent,
      retriesPercent: preset.retriesPercent,
    });
  };

  const jumpToTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApplyPromptTokens = (tokens: number) => {
    logEvent('tokenizer_tokens_applied', { model_id: selectedModelId });
    posthogLog.info('tokenizer result applied to calculator', {
      log_source: 'posthog_instrumentation',
      model_id: selectedModelId,
      token_count: tokens,
    });
    setActivePresetId('custom');
    setUnitMode('tokens');
    setInputs((prev) => ({ ...prev, inputTokensPerCall: tokens }));
    setActiveTab('calculator');
  };

  const selectCalculatorModel = (id: string, selection_source: 'calculator' | 'matrix') => {
    logEvent('calculator_model_selected', { model_id: id, selection_source });
    setSelectedModelId(id);
  };

  const handleSelectModelFromMatrix = (id: string) => {
    selectCalculatorModel(id, 'matrix');
    setActiveTab('calculator');
  };

  const projectedMonthlyRevenue = monthlyActiveUsers * pricePerUserUsd;
  const aiCostShareOfRevenue =
    projectedMonthlyRevenue > 0
      ? (activeBreakdown.monthlyTotalCost / projectedMonthlyRevenue) * 100
      : 0;
  const estimatedGrossMarginPct = Math.max(0, 100 - aiCostShareOfRevenue);

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
    { id: 'matrix', label: '3. Compare 18 Models', badge: 'CSV', icon: Table2 },
    { id: 'routing', label: '4. Routing Simulator', icon: GitBranch },
  ];

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
            <button type="button" onClick={() => jumpToTab('calculator')} className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors">
              Calculator
            </button>
            <button type="button" onClick={() => jumpToTab('tokenizer')} className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors">
              Tokenizer
            </button>
            <button type="button" onClick={() => jumpToTab('matrix')} className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors">
              18-Model Matrix
            </button>
            <button type="button" onClick={() => jumpToTab('routing')} className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors">
              Routing
            </button>
            <a href="#feature-guide" className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 hover:bg-slate-800/70 hover:text-white transition-colors">
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
              LLM API Cost Intelligence - Cache Write/Read - Context Tiers - Hosting Comparison
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Calculate, Compare &amp; Optimize Your AI API Bill.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Model <span className="text-white font-medium">prompt cache write vs. read discounts</span>,{' '}
              <span className="text-white font-medium">50% batch API pricing</span>,{' '}
              <span className="text-white font-medium">long-context pricing tiers</span>, and{' '}
              <span className="text-white font-medium">multi-provider hosting &amp; router rates</span>.
            </p>
          </div>

          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-slate-800 bg-[#0d121d] p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Active Model ({selectedModel.contextWindow})</span>
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
              <span>Lowest cost option</span>
              <span className="font-mono text-white tabular-nums">
                {cheapestModelRow.model.name} ({formatCurrency(cheapestModelRow.calc.monthlyTotalCost)})
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
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Quick-Start Workload Presets
                    </span>
                    <span className="text-xs text-slate-300">Click to load realistic assumptions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {presetsJson.map((preset) => {
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
                          <p className="mt-1.5 text-xs text-slate-300 line-clamp-2">{preset.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                        <label htmlFor="calc-model-select" className="block text-xs font-medium text-slate-200 mb-1.5">
                          Model Selection
                        </label>
                        <select
                          id="calc-model-select"
                          value={selectedModelId}
                          onChange={(e) => selectCalculatorModel(e.target.value, 'calculator')}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.provider} (${m.inputPer1M}/${m.outputPer1M})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="calc-calls-per-day" className="block text-xs font-medium text-slate-200 mb-1.5">
                          API Calls / Requests per Day
                        </label>
                        <input
                          id="calc-calls-per-day"
                          type="number"
                          min={1}
                          value={inputs.callsPerDay}
                          onChange={(e) => {
                            setActivePresetId('custom');
                            setInputs({ ...inputs, callsPerDay: Math.max(0, Number(e.target.value)) });
                          }}
                          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="calc-input-units" className="block text-xs font-medium text-slate-200 mb-1.5">
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
                        <label htmlFor="calc-output-units" className="block text-xs font-medium text-slate-200 mb-1.5">
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
                          <strong>Context Pricing Tier:</strong> {activeBreakdown.activeContextTierLabel}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-300">
                        Threshold: {formatTokenThreshold(selectedModel.longContextThresholdTokens)} / Max {selectedModel.contextWindow}
                      </span>
                    </div>

                    {activeBreakdown.exceedsContextWindow && (
                      <div className="rounded-xl border border-rose-400/50 bg-rose-950/40 p-3.5 text-xs text-rose-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                        <span>
                          Combined input + output tokens ({(inputs.inputTokensPerCall + inputs.outputTokensPerCall).toLocaleString()}) exceed {selectedModel.name}&apos;s {selectedModel.contextWindow} context window.
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                          <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                          Prompt Caching (Read vs. Write), Batch API &amp; Retries
                        </div>
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
                            ? `Batch Mode Active (${inputs.batchPercent}% · ${Math.round(selectedModel.batchDiscount * 100)}% Off)`
                            : `Enable ${Math.round(selectedModel.batchDiscount * 100)}% Batch API Discount`}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">Cache Read Hit Rate</span>
                            <span className="font-mono text-emerald-300">{inputs.cacheHitPercent}%</span>
                          </div>
                          <input
                            type="range"
                            aria-label="Prompt Cache Read Hit Rate percentage"
                            min={0}
                            max={95}
                            step={5}
                            value={inputs.cacheHitPercent}
                            onChange={(e) =>
                              setInputs({ ...inputs, cacheHitPercent: Number(e.target.value) })
                            }
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="flex justify-between text-[11px] font-mono text-slate-300">
                            <span>Read: ${activeBreakdown.cacheReadRatePer1M}/1M</span>
                            <span>Write: ${activeBreakdown.cacheWriteRatePer1M}/1M</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">Fresh Write Share of Uncached</span>
                            <span className="font-mono text-emerald-300">{cacheWriteSharePct}%</span>
                          </div>
                          <input
                            type="range"
                            aria-label="Cache Write Share of Uncached Tokens percentage"
                            min={0}
                            max={100}
                            step={5}
                            value={cacheWriteSharePct}
                            onChange={(e) => setCacheWriteSharePct(Number(e.target.value))}
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="text-[11px] text-slate-300">
                            Models cache writes at standard or 1.25x input rate (e.g. Claude).
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-200">Batch API Share ({Math.round(selectedModel.batchDiscount * 100)}% Off)</span>
                            <span className="font-mono text-emerald-300">{inputs.batchPercent}%</span>
                          </div>
                          <input
                            type="range"
                            aria-label="Batch API Share percentage"
                            min={0}
                            max={100}
                            step={5}
                            value={inputs.batchPercent}
                            onChange={(e) =>
                              setInputs({ ...inputs, batchPercent: Number(e.target.value) })
                            }
                            className="h-6 w-full cursor-pointer accent-emerald-400"
                          />
                          <div className="text-[11px] font-mono text-slate-300">
                            Eff. Rates: ${activeBreakdown.effectiveInputRatePer1M.toFixed(2)} In / ${activeBreakdown.effectiveOutputRatePer1M.toFixed(2)} Out
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
                          <label htmlFor="calc-reasoning-tokens" className="block text-xs text-slate-200">
                            Reasoning / Thinking Tokens / Call
                          </label>
                          <input
                            id="calc-reasoning-tokens"
                            type="number"
                            min={0}
                            step={100}
                            value={inputs.reasoningTokensPerCall}
                            onChange={(e) =>
                              setInputs({
                                ...inputs,
                                reasoningTokensPerCall: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                          <div className="flex justify-between text-xs pt-1">
                            <span className="text-slate-300">Retry Buffer</span>
                            <span className="font-mono text-amber-300">+{inputs.retriesPercent}%</span>
                          </div>
                          <input
                            type="range"
                            aria-label="Retry and Failure Buffer percentage"
                            min={0}
                            max={30}
                            step={1}
                            value={inputs.retriesPercent}
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
                          Hosting &amp; Router Comparison — {selectedModel.name}
                        </div>
                        <span className="text-xs font-mono text-emerald-300">
                          Cheapest: {hostingComparisons[0]?.endpoint.host}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#111827]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-[#0b1019] text-slate-300">
                              <th scope="col" className="py-2.5 px-3">Host / Router</th>
                              <th scope="col" className="py-2.5 px-3">In / Out ($/1M)</th>
                              <th scope="col" className="py-2.5 px-3">Cache R/W</th>
                              <th scope="col" className="py-2.5 px-3 text-right">30-Day Bill</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 font-mono">
                            {hostingComparisons.map(({ endpoint, calc }, idx) => (
                              <tr key={endpoint.host} className={idx === 0 ? 'bg-emerald-950/20' : ''}>
                                <th scope="row" className="py-2.5 px-3 font-sans text-left text-white font-medium">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{endpoint.host}</span>
                                    {idx === 0 && (
                                      <span className="rounded bg-emerald-500/20 border border-emerald-400/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                                        Lowest Cost
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
                                  ${endpoint.inputPer1M.toFixed(2)} / ${endpoint.outputPer1M.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">
                                  ${endpoint.cachedInputPer1M.toFixed(2)} / ${endpoint.cacheWritePer1M.toFixed(2)}
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
                          <span className="text-slate-300">Input Tokens (cache + tier adjusted)</span>
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
                          <span className="text-slate-300">Retry &amp; Error Overhead</span>
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
                          AI SaaS Gross Margin Check
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="saas-active-users" className="block text-xs text-slate-300 mb-1.5">Active Paying Users</label>
                          <input
                            id="saas-active-users"
                            type="number"
                            min={1}
                            value={monthlyActiveUsers}
                            onChange={(e) => setMonthlyActiveUsers(Math.max(1, Number(e.target.value)))}
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="saas-price-per-user" className="block text-xs text-slate-300 mb-1.5">Price / User ($/mo)</label>
                          <input
                            id="saas-price-per-user"
                            type="number"
                            min={1}
                            value={pricePerUserUsd}
                            onChange={(e) => setPricePerUserUsd(Math.max(1, Number(e.target.value)))}
                            className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-2 font-mono text-sm text-white"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#0b1019] border border-slate-800 p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-300">Est. AI COGS % of Revenue</div>
                          <div className="font-mono text-lg font-bold text-white tabular-nums">
                            {aiCostShareOfRevenue.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300">Gross Margin After LLM Spend</div>
                          <div className="font-mono text-lg font-bold text-emerald-300 tabular-nums">
                            {estimatedGrossMarginPct.toFixed(1)}%
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
                Export Client Budgets, Model Scenarios &amp; Routing Plans for $9
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                Built for indie builders, AI agencies, and engineering leads who need clean cost sheets, scenario comparisons, and routing math without recurring monthly SaaS bloat.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Unlimited multi-model cost comparisons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Prompt caching, batch &amp; retry modeling
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Hybrid economy-to-flagship routing math
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  Instant license key delivery via Dodo Payments
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-700/80 bg-[#0b1019] p-6 text-center space-y-4">
              <div className="text-xs uppercase tracking-wider text-slate-300">Lifetime Pro Pass</div>
              <div className="font-mono text-4xl font-bold text-white">$9</div>
              <div className="text-xs text-slate-300">One-time payment - No subscription</div>
              <a
                href={process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || '#workspace'}
                onClick={() => {
                  if (process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL) {
                    logEvent('pro_checkout_started', { plan: 'lifetime_pro' });
                    posthogLog.info('pro checkout navigation started', {
                      log_source: 'posthog_instrumentation',
                      plan: 'lifetime_pro',
                    });
                  }
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 transition-colors"
              >
                Get PromptBill Pro <ArrowUpRight className="w-4 h-4" />
              </a>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Verified at promptbill.online</span>
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
            <button type="button" onClick={() => jumpToTab('calculator')} className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white">
              Calculator
            </button>
            <button type="button" onClick={() => jumpToTab('tokenizer')} className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white">
              Tokenizer
            </button>
            <button type="button" onClick={() => jumpToTab('matrix')} className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white">
              Matrix
            </button>
            <button type="button" onClick={() => jumpToTab('routing')} className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white">
              Routing
            </button>
            <a href="/sitemap.xml" className="inline-flex min-h-[36px] items-center px-2.5 py-1.5 hover:text-white">Sitemap</a>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>Model rate card snapshot: November 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
