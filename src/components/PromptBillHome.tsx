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
} from 'lucide-react';

const models = modelsJson as LLMModel[];

export default function PromptBillHome() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('calculator');
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-sonnet-5-5');
  const [activePresetId, setActivePresetId] = useState<string>('rag-assistant');
  const [unitMode, setUnitMode] = useState<InputUnitMode>('tokens');

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

  const activeBreakdown = useMemo(
    () => calculateModelCost(selectedModel, inputs),
    [selectedModel, inputs]
  );

  const cheapestModelRow = useMemo(() => {
    return models
      .map((m) => ({ model: m, calc: calculateModelCost(m, inputs) }))
      .sort((a, b) => a.calc.monthlyTotalCost - b.calc.monthlyTotalCost)[0];
  }, [inputs]);

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
      {/* Clean Minimal Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">PromptBill</span>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:inline-block">
                promptbill.online
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <button type="button" onClick={() => jumpToTab('calculator')} className="hover:text-white transition-colors">
              Calculator
            </button>
            <button type="button" onClick={() => jumpToTab('tokenizer')} className="hover:text-white transition-colors">
              Tokenizer
            </button>
            <button type="button" onClick={() => jumpToTab('matrix')} className="hover:text-white transition-colors">
              18-Model Matrix
            </button>
            <button type="button" onClick={() => jumpToTab('routing')} className="hover:text-white transition-colors">
              Routing
            </button>
            <a href="#feature-guide" className="hover:text-white transition-colors">
              Guide &amp; FAQ
            </a>
          </nav>

          <a
            href="#pro-license"
            className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Pro License ($9)
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Crisp Focused Hero */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-[#0e1422] px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              All-in-One LLM Cost Intelligence · 18 Models · Updated Nov 2026
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Calculate, Compare &amp; Optimize Your AI API Bill.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              One clean workspace combining a <span className="text-slate-200 font-medium">30-day cost &amp; margin calculator</span>, a{' '}
              <span className="text-slate-200 font-medium">live prompt tokenizer</span>, an{' '}
              <span className="text-slate-200 font-medium">18-model comparison matrix</span>, and a{' '}
              <span className="text-slate-200 font-medium">hybrid routing simulator</span>.
            </p>
          </div>

          {/* Live Summary Pill Card */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-slate-800 bg-[#0d121d] p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Model ({selectedModel.contextWindow})</span>
              <span className="font-mono text-emerald-400">
                {formatCurrency(activeBreakdown.costPerRequest)}/req
              </span>
            </div>
            <div className="text-lg font-bold text-white">{selectedModel.name}</div>
            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Est. 30-Day Bill</span>
              <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                {formatCurrency(activeBreakdown.monthlyTotalCost)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Lowest cost option</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {cheapestModelRow.model.name} ({formatCurrency(cheapestModelRow.calc.monthlyTotalCost)})
              </span>
            </div>
          </div>
        </section>

        {/* Interactive Tabbed Workspace (Eliminates vertical clutter) */}
        <section id="workspace" className="space-y-6">
          {/* Workspace Tab Bar */}
          <div
            role="tablist"
            aria-label="PromptBill Tools"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-[#0b1019] p-1.5"
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
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-emerald-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Workspace Panel */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d121d] p-5 sm:p-8">
            {activeTab === 'calculator' && (
              <div className="space-y-8">
                {/* 1-Click Workload Presets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Quick-Start Workload Presets
                    </span>
                    <span className="text-xs text-slate-500">Click to load realistic assumptions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {presetsJson.map((preset) => {
                      const isActive = activePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`text-left rounded-xl border p-3.5 transition-all ${
                            isActive
                              ? 'border-emerald-500/60 bg-emerald-950/20'
                              : 'border-slate-800 bg-[#111827] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-white">
                              {preset.title}
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculator Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Token &amp; Billing Parameters</h2>
                      </div>

                      <div className="inline-flex rounded-xl border border-slate-700 bg-[#131a29] p-1 text-xs">
                        {(['tokens', 'words', 'characters'] as InputUnitMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setUnitMode(mode)}
                            className={`rounded-lg px-2.5 py-1 capitalize font-medium transition-colors ${
                              unitMode === mode
                                ? 'bg-emerald-500 text-slate-950'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Model Selection
                        </label>
                        <select
                          value={selectedModelId}
                          onChange={(e) => selectCalculatorModel(e.target.value, 'calculator')}
                          className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.provider} (${m.inputPer1M}/${m.outputPer1M})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          API Calls / Requests per Day
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={inputs.callsPerDay}
                          onChange={(e) => {
                            setActivePresetId('custom');
                            setInputs({ ...inputs, callsPerDay: Math.max(0, Number(e.target.value)) });
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Input {unitLabel} per Call{' '}
                          {unitMode !== 'tokens' && (
                            <span className="text-emerald-400 font-mono">
                              ({inputs.inputTokensPerCall.toLocaleString()} tok)
                            </span>
                          )}
                        </label>
                        <input
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
                          className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Output {unitLabel} per Call{' '}
                          {unitMode !== 'tokens' && (
                            <span className="text-emerald-400 font-mono">
                              ({inputs.outputTokensPerCall.toLocaleString()} tok)
                            </span>
                          )}
                        </label>
                        <input
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
                          className="w-full rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        Production Multipliers (Caching, Batch, Reasoning &amp; Retries)
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-300">Prompt Cache Hit Rate</span>
                            <span className="font-mono text-emerald-400">{inputs.cacheHitPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={95}
                            step={5}
                            value={inputs.cacheHitPercent}
                            onChange={(e) =>
                              setInputs({ ...inputs, cacheHitPercent: Number(e.target.value) })
                            }
                            className="w-full accent-emerald-400"
                          />
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-300">Batch API Share (50% Off)</span>
                            <span className="font-mono text-emerald-400">{inputs.batchPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={inputs.batchPercent}
                            onChange={(e) =>
                              setInputs({ ...inputs, batchPercent: Number(e.target.value) })
                            }
                            className="w-full accent-emerald-400"
                          />
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
                          <label className="block text-xs text-slate-300 mb-1.5">
                            Reasoning / Thinking Tokens / Call
                          </label>
                          <input
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
                            className="w-full rounded-lg border border-slate-700 bg-[#0b1019] px-2.5 py-1.5 font-mono text-sm text-white"
                          />
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-300">Retry &amp; Failure Buffer</span>
                            <span className="font-mono text-amber-300">+{inputs.retriesPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            step={1}
                            value={inputs.retriesPercent}
                            onChange={(e) =>
                              setInputs({ ...inputs, retriesPercent: Number(e.target.value) })
                            }
                            className="w-full accent-emerald-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Breakdown & SaaS Margin */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          30-Day Cost Breakdown
                        </span>
                        <span className="font-mono text-xs text-slate-400 tabular-nums">
                          {activeBreakdown.monthlyCalls.toLocaleString()} calls/mo
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className="font-mono text-4xl font-bold text-white tabular-nums">
                          {formatCurrency(activeBreakdown.monthlyTotalCost)}
                        </div>
                        <div className="font-mono text-xs text-slate-400 tabular-nums">
                          {formatCurrency(activeBreakdown.costPerRequest)} / req
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-slate-800 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Input Tokens (cache-adjusted)</span>
                          <span className="font-mono text-slate-200 tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyInputCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Output Tokens</span>
                          <span className="font-mono text-slate-200 tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyOutputCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reasoning / Thinking Tokens</span>
                          <span className="font-mono text-slate-200 tabular-nums">
                            {formatCurrency(activeBreakdown.monthlyReasoningCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Retry &amp; Error Overhead</span>
                          <span className="font-mono text-amber-300 tabular-nums">
                            +{formatCurrency(activeBreakdown.monthlyRetryOverheadCost)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-slate-300 font-medium">Blended Cost per 1,000 Calls</span>
                          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                            {formatCurrency(activeBreakdown.costPer1KCalls)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                          AI SaaS Gross Margin Check
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Active Paying Users</label>
                          <input
                            type="number"
                            min={1}
                            value={monthlyActiveUsers}
                            onChange={(e) => setMonthlyActiveUsers(Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-1.5 font-mono text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Price / User ($/mo)</label>
                          <input
                            type="number"
                            min={1}
                            value={pricePerUserUsd}
                            onChange={(e) => setPricePerUserUsd(Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-lg border border-slate-700 bg-[#0b1019] px-3 py-1.5 font-mono text-sm text-white"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#0b1019] border border-slate-800 p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Est. AI COGS % of Revenue</div>
                          <div className="font-mono text-lg font-bold text-white tabular-nums">
                            {aiCostShareOfRevenue.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Gross Margin After LLM Spend</div>
                          <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
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

        {/* Clear Guide to All Features + Formula + FAQ */}
        <FeatureGuideAndFaq onJumpToTab={jumpToTab} />

        {/* Pro License */}
        <section
          id="pro-license"
          className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0e1826] via-[#0d121d] to-[#091512] p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Zap className="w-3.5 h-3.5" />
                PromptBill Pro · One-Time License
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Export Client Budgets, Model Scenarios &amp; Routing Plans for $9
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Built for indie builders, AI agencies, and engineering leads who need clean cost sheets, scenario comparisons, and routing math without recurring monthly SaaS bloat.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Unlimited multi-model cost comparisons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Prompt caching, batch &amp; retry modeling
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Hybrid economy-to-flagship routing math
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Instant license key delivery via Dodo Payments
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-700/80 bg-[#0b1019] p-6 text-center space-y-4">
              <div className="text-xs uppercase tracking-wider text-slate-400">Lifetime Pro Pass</div>
              <div className="font-mono text-4xl font-bold text-white">$9</div>
              <div className="text-xs text-slate-400">One-time payment · No subscription</div>
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Get PromptBill Pro <ArrowUpRight className="w-4 h-4" />
              </a>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified at promptbill.online</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070a10] py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <BrandMark className="h-5 w-5" />
            <span className="font-semibold text-slate-200">PromptBill</span>
            <span>· promptbill.online</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => jumpToTab('calculator')} className="hover:text-white">
              Calculator
            </button>
            <button type="button" onClick={() => jumpToTab('tokenizer')} className="hover:text-white">
              Tokenizer
            </button>
            <button type="button" onClick={() => jumpToTab('matrix')} className="hover:text-white">
              Matrix
            </button>
            <button type="button" onClick={() => jumpToTab('routing')} className="hover:text-white">
              Routing
            </button>
            <a href="/sitemap.xml" className="hover:text-white">Sitemap</a>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Cpu className="w-3.5 h-3.5" />
            <span>Model rate card snapshot: November 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
