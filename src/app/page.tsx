'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import modelsJson from '../data/models.json';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';
import {
  LLMModel,
  CostInputs,
  calculateModelCost,
  formatCurrency,
  formatTokenThreshold,
} from '../lib/pricingEngine';
import { SiteShell } from '../components/SiteShell';
import { ParetoFrontierChart } from '../components/ParetoFrontierChart';
import {
  Search,
  ArrowUpDown,
  Calculator,
  Layers,
  Server,
  AlertTriangle,
  ChevronDown,
  X,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

const pricingModels = modelsJson as LLMModel[];

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Mobile Leaderboard View Mode & Progressive Card Disclosure
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // Calculator State + Accordion + Searchable Model Selector Sheet/Dropdown
  const [selectedCalcModelId, setSelectedCalcModelId] = useState<string>('claude-sonnet-5-5');
  const [modelPickerOpen, setModelPickerOpen] = useState<boolean>(false);
  const [modelPickerQuery, setModelPickerQuery] = useState<string>('');
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  const [calcInputs, setCalcInputs] = useState<CostInputs>({
    inputTokensPerCall: 6500,
    outputTokensPerCall: 650,
    reasoningTokensPerCall: 150,
    callsPerDay: 2500,
    cacheHitPercent: 60,
    cacheWriteSharePercent: 25,
    batchPercent: 0,
    retriesPercent: 4,
  });

  const providers = useMemo(() => getAllProviderSlugs(), []);

  const filteredPickerModels = useMemo(() => {
    const q = modelPickerQuery.trim().toLowerCase();
    if (!q) return pricingModels;
    return pricingModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q)
    );
  }, [modelPickerQuery]);

  const selectedCalcModel = useMemo(
    () => pricingModels.find((m) => m.id === selectedCalcModelId) || pricingModels[0],
    [selectedCalcModelId]
  );

  const calcBreakdown = useMemo(
    () => calculateModelCost(selectedCalcModel, calcInputs),
    [selectedCalcModel, calcInputs]
  );

  const hostingRows = useMemo(() => {
    const endpoints =
      selectedCalcModel.hostingEndpoints && selectedCalcModel.hostingEndpoints.length > 0
        ? selectedCalcModel.hostingEndpoints
        : [
            {
              host: `${selectedCalcModel.provider} Official API`,
              providerType: 'Official API' as const,
              inputPer1M: selectedCalcModel.inputPer1M,
              cachedInputPer1M: selectedCalcModel.cachedInputPer1M,
              cacheWritePer1M: selectedCalcModel.cacheWritePer1M ?? selectedCalcModel.inputPer1M,
              outputPer1M: selectedCalcModel.outputPer1M,
              batchDiscount: selectedCalcModel.batchDiscount,
              notes: selectedCalcModel.notes,
            },
          ];

    return endpoints
      .map((ep) => {
        const variant: LLMModel = {
          ...selectedCalcModel,
          provider: ep.host,
          inputPer1M: ep.inputPer1M,
          cachedInputPer1M: ep.cachedInputPer1M,
          cacheWritePer1M: ep.cacheWritePer1M,
          outputPer1M: ep.outputPer1M,
          batchDiscount: ep.batchDiscount,
        };
        return {
          endpoint: ep,
          calc: calculateModelCost(variant, calcInputs),
        };
      })
      .sort((a, b) => a.calc.monthlyTotalCost - b.calc.monthlyTotalCost);
  }, [selectedCalcModel, calcInputs]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_MODELS
      .filter((m) => {
        if (q && !m.name.toLowerCase().includes(q) && !m.provider.toLowerCase().includes(q) && !m.bestFor.toLowerCase().includes(q)) {
          return false;
        }
        if (licenseFilter !== 'All' && m.license !== licenseFilter) return false;
        if (evidenceFilter !== 'All' && m.evidence !== evidenceFilter) return false;
        return true;
      })
      .map((m) => ({
        model: m,
        scorePerDollar: m.outputPer1M > 0 ? Number((m.score / m.outputPer1M).toFixed(1)) : m.score,
      }))
      .sort((a, b) => {
        let va = 0;
        let vb = 0;
        if (sortBy === 'score') { va = a.model.score; vb = b.model.score; }
        else if (sortBy === 'value') { va = a.scorePerDollar; vb = b.scorePerDollar; }
        else if (sortBy === 'price') { va = (a.model.inputPer1M + a.model.outputPer1M) / 2; vb = (b.model.inputPer1M + b.model.outputPer1M) / 2; }
        else if (sortBy === 'elo') { va = a.model.elo; vb = b.model.elo; }
        else if (sortBy === 'tokPerSec') { va = a.model.tokPerSec; vb = b.model.tokPerSec; }
        return sortAsc ? va - vb : vb - va;
      });
  }, [searchQuery, licenseFilter, evidenceFilter, sortBy, sortAsc]);

  const toggleSort = (col: 'score' | 'value' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(col === 'price'); }
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Billing Calculator"
      subtitle="promptbill.online / · Prompt Caching, Batch API, Context Tiers & Pareto Frontier"
    >
      {/* 1. Compact Interactive Cost Calculator with Searchable Model Picker & Accordion */}
      <section aria-labelledby="billing-calculator-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-800" />
              <h2 id="billing-calculator-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                API Cost &amp; Billing Calculator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Select a model, input tokens, and daily volume—open Advanced Cost Settings for caching, batch, and host routing.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-right shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
              Est. 30-Day Bill
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-900 tabular-nums">
              {formatCurrency(calcBreakdown.monthlyTotalCost)}
            </div>
          </div>
        </div>

        {/* Core 3 Inputs Visible by Default */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Searchable Dropdown / Modal Trigger for Model Selection */}
          <div className="relative space-y-1.5 sm:col-span-2">
            <span id="calc-model-picker-label" className="font-semibold text-slate-800 block">
              Model (Searchable)
            </span>
            <button
              type="button"
              aria-labelledby="calc-model-picker-label"
              aria-expanded={modelPickerOpen}
              onClick={() => setModelPickerOpen((prev) => !prev)}
              className="min-h-[44px] w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-left text-sm text-slate-900 hover:border-emerald-700"
            >
              <div className="truncate">
                <span className="font-bold">{selectedCalcModel.name}</span>{' '}
                <span className="text-slate-600">
                  ({selectedCalcModel.provider} · ${selectedCalcModel.inputPer1M.toFixed(2)}/${selectedCalcModel.outputPer1M.toFixed(2)})
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${modelPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Searchable Dropdown on Desktop / Bottom-Sheet Modal on Mobile */}
            {modelPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/40 sm:hidden"
                  onClick={() => setModelPickerOpen(false)}
                />
                <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:mt-1.5 sm:rounded-xl sm:p-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={modelPickerQuery}
                        onChange={(e) => setModelPickerQuery(e.target.value)}
                        placeholder="Filter 18 models by name or provider..."
                        aria-label="Filter models in selector"
                        className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Close model selector"
                      onClick={() => setModelPickerOpen(false)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {filteredPickerModels.map((m) => {
                      const active = m.id === selectedCalcModelId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedCalcModelId(m.id);
                            setModelPickerOpen(false);
                            setModelPickerQuery('');
                          }}
                          className={`min-h-[44px] w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                            active ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-900'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className="text-slate-600">{m.provider} · {m.contextWindow}</div>
                          </div>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span>${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</span>
                            {active && <Check className="w-4 h-4 text-emerald-800" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <label htmlFor="home-calc-input-tokens" className="space-y-1.5">
            <span className="font-semibold text-slate-800 block">Input tokens / call</span>
            <input
              id="home-calc-input-tokens"
              type="number"
              min={0}
              step={500}
              value={calcInputs.inputTokensPerCall}
              onChange={(e) =>
                setCalcInputs({ ...calcInputs, inputTokensPerCall: Math.max(0, Number(e.target.value)) })
              }
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
            />
          </label>

          <label htmlFor="home-calc-calls-day" className="space-y-1.5">
            <span className="font-semibold text-slate-800 block">Calls / day</span>
            <input
              id="home-calc-calls-day"
              type="number"
              min={0}
              step={100}
              value={calcInputs.callsPerDay}
              onChange={(e) =>
                setCalcInputs({ ...calcInputs, callsPerDay: Math.max(0, Number(e.target.value)) })
              }
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
            />
          </label>
        </div>

        {/* Collapsible Accordion: Advanced Cost Settings (Caching, Batch API, Context Tiers & Hosting) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50">
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="min-h-[44px] w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-100/70 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Advanced Cost Settings</span>
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-mono text-slate-700">
                Cache {calcInputs.cacheHitPercent}% · Batch {calcInputs.batchPercent}% · {hostingRows[0]?.endpoint.host}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-700 shrink-0 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          {advancedOpen && (
            <div className="border-t border-slate-200 p-4 sm:p-5 bg-white rounded-b-xl space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex justify-between font-medium text-slate-800">
                        <span>Cache Read Hit %</span>
                        <span className="font-mono font-bold text-emerald-800">{calcInputs.cacheHitPercent}%</span>
                      </div>
                      <input
                        type="range"
                        aria-label="Cache Read Hit percentage"
                        min={0}
                        max={95}
                        step={5}
                        value={calcInputs.cacheHitPercent}
                        onChange={(e) => setCalcInputs({ ...calcInputs, cacheHitPercent: Number(e.target.value) })}
                        className="h-6 w-full accent-emerald-800 cursor-pointer"
                      />
                      <div className="text-[11px] font-mono text-slate-700">
                        Read ${calcBreakdown.cacheReadRatePer1M}/1M · Write ${calcBreakdown.cacheWriteRatePer1M}/1M
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex justify-between font-medium text-slate-800">
                        <span>Cache Write Share %</span>
                        <span className="font-mono font-bold text-emerald-800">{calcInputs.cacheWriteSharePercent ?? 25}%</span>
                      </div>
                      <input
                        type="range"
                        aria-label="Cache Write Share of uncached tokens"
                        min={0}
                        max={100}
                        step={5}
                        value={calcInputs.cacheWriteSharePercent ?? 25}
                        onChange={(e) =>
                          setCalcInputs({ ...calcInputs, cacheWriteSharePercent: Number(e.target.value) })
                        }
                        className="h-6 w-full accent-emerald-800 cursor-pointer"
                      />
                      <div className="text-[11px] text-slate-700">
                        Share of non-hit input populating cache.
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex justify-between font-medium text-slate-800">
                        <span>Batch API ({Math.round(selectedCalcModel.batchDiscount * 100)}% Off)</span>
                        <span className="font-mono font-bold text-emerald-800">{calcInputs.batchPercent}%</span>
                      </div>
                      <input
                        type="range"
                        aria-label="Batch API traffic percentage"
                        min={0}
                        max={100}
                        step={5}
                        value={calcInputs.batchPercent}
                        onChange={(e) => setCalcInputs({ ...calcInputs, batchPercent: Number(e.target.value) })}
                        className="h-6 w-full accent-emerald-800 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCalcInputs((prev) => ({ ...prev, batchPercent: prev.batchPercent === 100 ? 0 : 100 }))
                        }
                        className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        {calcInputs.batchPercent === 100 ? 'Clear 100% Batch Mode' : 'Apply 100% Batch API (50% Off)'}
                      </button>
                    </div>
                  </div>

                  {/* Context-Tier Pricing Indicator */}
                  <div
                    className={`rounded-lg border px-3.5 py-3 text-xs flex flex-wrap items-center justify-between gap-2 ${
                      calcBreakdown.exceedsContextWindow
                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                        : calcBreakdown.triggersLongContextMultiplier
                        ? 'border-amber-300 bg-amber-50 text-amber-950'
                        : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {calcBreakdown.exceedsContextWindow ? (
                        <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      ) : (
                        <Layers className="w-4 h-4 text-emerald-800 shrink-0" />
                      )}
                      <span>Context Tier: {calcBreakdown.activeContextTierLabel}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-700">
                      Threshold {formatTokenThreshold(selectedCalcModel.longContextThresholdTokens)} · Window {selectedCalcModel.contextWindow}
                    </span>
                  </div>
                </div>

                {/* Hosting & Router Comparison */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-800">
                      <Server className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Hosting &amp; Router Rates</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-800">
                      Best: {hostingRows[0]?.endpoint.host}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                          <th scope="col" className="py-2 px-2.5">Host / Router</th>
                          <th scope="col" className="py-2 px-2.5">In / Out</th>
                          <th scope="col" className="py-2 px-2.5 text-right">30-Day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 font-mono">
                        {hostingRows.map(({ endpoint, calc }, idx) => (
                          <tr key={endpoint.host} className={idx === 0 ? 'bg-emerald-50/60' : 'bg-white'}>
                            <th scope="row" className="py-2 px-2.5 font-sans text-left font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{endpoint.host}</span>
                                {idx === 0 && (
                                  <span className="rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    Cheapest
                                  </span>
                                )}
                              </div>
                            </th>
                            <td className="py-2 px-2.5 text-slate-700">
                              ${endpoint.inputPer1M.toFixed(2)}/${endpoint.outputPer1M.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                              {formatCurrency(calc.monthlyTotalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Leaderboard & Data Density (No Duplicate Mobile Views, Horizontal Filter Carousel, Progressive Disclosure) */}
      <section aria-labelledby="leaderboard-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider..."
              aria-label="Search models"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900"
            />
          </div>

          {/* Mobile View Toggle Switch: [ Cards | Table ] */}
          <div className="md:hidden inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1 gap-2 text-xs self-start">
            <button
              type="button"
              onClick={() => setMobileViewMode('cards')}
              className={`min-h-[44px] min-w-[72px] rounded-md px-3 py-2 font-semibold ${
                mobileViewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-800'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`min-h-[44px] min-w-[72px] rounded-md px-3 py-2 font-semibold ${
                mobileViewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-800'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Single Horizontally Scrollable Filter & Sort Carousel (No Multi-Line Wrapping) */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar text-xs">
          {(['All', 'Supported', 'Estimated'] as const).map((ev) => (
            <button
              key={ev}
              type="button"
              onClick={() => setEvidenceFilter(ev)}
              className={`shrink-0 min-h-[44px] rounded-lg border px-3.5 py-2 font-semibold transition-colors ${
                evidenceFilter === ev
                  ? 'border-emerald-800 bg-emerald-800 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              {ev === 'All' ? 'All Evidence' : ev}
            </button>
          ))}

          {(['All', 'Closed', 'Open'] as const).map((lic) => (
            <button
              key={lic}
              type="button"
              onClick={() => setLicenseFilter(lic)}
              className={`shrink-0 min-h-[44px] rounded-lg border px-3.5 py-2 font-semibold transition-colors ${
                licenseFilter === lic
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              {lic === 'All' ? 'All Licenses' : lic === 'Open' ? 'Open Weight' : 'Closed'}
            </button>
          ))}

          {[
            { id: 'score', label: 'Sort: Score' },
            { id: 'value', label: 'Sort: Score/$' },
            { id: 'price', label: 'Sort: Lowest Price' },
            { id: 'tokPerSec', label: 'Sort: Fastest Tok/s' },
          ].map((srt) => (
            <button
              key={srt.id}
              type="button"
              onClick={() => toggleSort(srt.id as 'score' | 'value' | 'price' | 'tokPerSec')}
              className={`shrink-0 min-h-[44px] rounded-lg border px-3.5 py-2 font-semibold transition-colors ${
                sortBy === srt.id
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                  : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {srt.label}
            </button>
          ))}
        </div>

        {/* MOBILE CARD LAYOUT (< md when mobileViewMode === 'cards') with Progressive Disclosure */}
        {mobileViewMode === 'cards' && (
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map(({ model: m, scorePerDollar }) => {
              const isExpanded = !!expandedCardIds[m.id];
              return (
                <article key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700">#{m.rank}</span>
                        <Link href={`/models/${m.slug}`} className="inline-flex min-h-[44px] items-center text-base font-bold text-slate-900 underline-offset-2 hover:underline">
                          {m.name}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-700">
                        {m.provider} · {m.contextWindow} context
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-lg font-bold text-slate-900">{m.score.toFixed(1)}</div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-700">Score</div>
                    </div>
                  </div>

                  {/* Focused Core Metrics: In/Out Price & Speed */}
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-center font-mono text-xs">
                    <div>
                      <div className="text-[11px] font-sans text-slate-700">In / Out ($/1M)</div>
                      <div className="font-bold text-slate-900 mt-0.5">${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-sans text-slate-700">Speed</div>
                      <div className="font-bold text-emerald-800 mt-0.5">{m.tokPerSec} tok/s</div>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Granular Sub-Benchmarks Revealed on Tap */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs text-slate-800">
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">Score/$ {scorePerDollar.toFixed(1)}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">AG {m.ag}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">CO {m.co}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">RE {m.re}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">MM {m.mm}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-1">Elo {m.elo.toFixed(0)}</span>
                      </div>
                      <p className="text-xs text-slate-700">{m.bestFor}</p>
                      <Link
                        href={`/models/${m.slug}`}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Open Full {m.name} Page -&gt;
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                      {m.evidence} · {m.license}
                    </span>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleCardExpand(m.id)}
                      className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-50"
                    >
                      {isExpanded ? 'Hide Specs' : 'Specs & Cost ->'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* TABLE VIEW (Hidden on <768px unless user toggles mobileViewMode === 'table') */}
        <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden'} md:block overflow-x-auto rounded-lg border border-slate-200`}>
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              November 2026 LLM Leaderboard comparing composite benchmark scores, Score per dollar value ratio, context window size, API token pricing per 1 million tokens, Elo ratings, category scores, and output generation speed in tokens per second.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-3.5">Rank &amp; Model</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('score')} className="inline-flex min-h-[44px] items-center gap-1 px-1 hover:text-slate-950">
                    Score <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('value')} className="inline-flex min-h-[44px] items-center gap-1 px-1 hover:text-slate-950">
                    Score/$ <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">Context</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('price')} className="inline-flex min-h-[44px] items-center gap-1 px-1 hover:text-slate-950">
                    API Price (In / Out) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('elo')} className="inline-flex min-h-[44px] items-center gap-1 px-1 hover:text-slate-950">
                    Elo <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" title="Agentic" className="py-3 px-2.5 font-mono">AG</th>
                <th scope="col" title="Coding" className="py-3 px-2.5 font-mono">CO</th>
                <th scope="col" title="Reasoning" className="py-3 px-2.5 font-mono">RE</th>
                <th scope="col" title="Multimodal" className="py-3 px-2.5 font-mono">MM</th>
                <th scope="col" title="Knowledge" className="py-3 px-2.5 font-mono">KN</th>
                <th scope="col" title="Multilingual" className="py-3 px-2.5 font-mono">ML</th>
                <th scope="col" title="Instruction Following" className="py-3 px-2.5 font-mono">IF</th>
                <th scope="col" title="Math" className="py-3 px-2.5 font-mono">MA</th>
                <th scope="col" className="py-3 px-3.5 text-right">
                  <button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex min-h-[44px] items-center gap-1 ml-auto px-1 hover:text-slate-950">
                    Speed (Tok/s) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm">
              {rows.map(({ model: m, scorePerDollar }, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-slate-50/50 hover:bg-emerald-50/40'}>
                  <th scope="row" className="py-3 px-3.5 font-normal text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-700">#{m.rank}</span>
                      <Link href={`/models/${m.slug}`} className="inline-flex min-h-[44px] items-center font-semibold text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-900">
                        {m.evidence}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2">
                      <Link href={`/providers/${m.providerSlug}`} className="inline-flex min-h-[36px] items-center hover:text-slate-950 underline-offset-2 hover:underline">
                        {m.provider}
                      </Link>
                      <span>· {m.bestFor}</span>
                    </div>
                  </th>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-emerald-800">{scorePerDollar.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-800">{m.contextWindow}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-900">
                    ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-800">{m.elo.toFixed(1)}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.ag}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.co}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.re}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.mm}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.kn}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.ml}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.if}</td>
                  <td className="py-3 px-2.5 font-mono text-xs text-slate-800">{m.ma}</td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs font-semibold text-emerald-800">
                    {m.tokPerSec} tok/s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <Link key={p.providerSlug} href={`/providers/${p.providerSlug}`} className="inline-flex min-h-[44px] items-center rounded-lg bg-slate-100 px-3.5 py-2 font-medium text-slate-800 hover:bg-slate-200">
                {p.providerName}
              </Link>
            ))}
          </div>
          <Link href="/compare" className="inline-flex min-h-[44px] items-center font-semibold text-emerald-800 hover:underline">
            Explore all 190 Head-to-Head Comparisons -&gt;
          </Link>
        </div>
      </section>

      {/* 3. Pareto Frontier Section */}
      <ParetoFrontierChart models={ALL_MODELS} />

      {/* Sticky Bottom Result Bar (Mobile & Tablet, pinned right above the 4-tab nav bar) */}
      <div
        role="region"
        aria-label="Live 30-day cost estimate"
        className="lg:hidden fixed bottom-[58px] inset-x-0 z-30 border-t border-emerald-200 bg-emerald-950 text-white px-4 py-2 shadow-md"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 text-xs">
          <div className="truncate">
            <span className="text-emerald-200 font-medium">{selectedCalcModel.name}</span>
            <span className="block text-[11px] text-slate-300 truncate">
              Best host: {hostingRows[0]?.endpoint.host}
            </span>
          </div>
          <div className="text-right shrink-0 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-sans">
              Est. 30-Day Bill
            </span>
            <span className="text-base font-bold text-emerald-300 tabular-nums">
              {formatCurrency(calcBreakdown.monthlyTotalCost)}
            </span>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
