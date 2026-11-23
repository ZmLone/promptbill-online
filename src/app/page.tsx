'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Copy,
  ArrowUp,
  Plus,
} from 'lucide-react';

const pricingModels = modelsJson as LLMModel[];

export default function LeaderboardPage() {
  const globalSearchRef = useRef<HTMLInputElement | null>(null);
  const calculatorTopRef = useRef<HTMLElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Mobile toggle state
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // Desktop inline expandable row drawer in the 14-column grid
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null);

  // Combobox + Quick-Compare models (up to 3 side-by-side)
  const [selectedCalcModelId, setSelectedCalcModelId] = useState<string>('claude-sonnet-5-5');
  const [compareModelIds, setCompareModelIds] = useState<string[]>([
    'claude-sonnet-5-5',
    'deepseek-v4-1-flash',
  ]);
  const [comboboxOpen, setComboboxOpen] = useState<boolean>(false);
  const [comboboxQuery, setComboboxQuery] = useState<string>('');
  const [activeComboIndex, setActiveComboIndex] = useState<number>(0);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(true);

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

  // Sync from URL query params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const m = params.get('model') || params.get('m');
    if (m && pricingModels.some((item) => item.id === m)) {
      setSelectedCalcModelId(m);
    }
    const inTok = params.get('in');
    const calls = params.get('calls') || params.get('cpd');
    const cache = params.get('cache');
    const batch = params.get('batch');
    const q = params.get('q');

    if (inTok || calls || cache || batch) {
      setCalcInputs((prev) => ({
        ...prev,
        inputTokensPerCall: inTok ? Math.max(0, Number(inTok)) : prev.inputTokensPerCall,
        callsPerDay: calls ? Math.max(0, Number(calls)) : prev.callsPerDay,
        cacheHitPercent: cache ? Math.min(95, Math.max(0, Number(cache))) : prev.cacheHitPercent,
        batchPercent: batch ? Math.min(100, Math.max(0, Number(batch))) : prev.batchPercent,
      }));
    }
    if (q) {
      setSearchQuery(q);
    }
  }, []);

  // Push calculator & filter state to URL query string for easy Slack/Notion sharing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('model', selectedCalcModelId);
    params.set('in', String(calcInputs.inputTokensPerCall));
    params.set('calls', String(calcInputs.callsPerDay));
    params.set('cache', String(calcInputs.cacheHitPercent));
    if (calcInputs.batchPercent > 0) {
      params.set('batch', String(calcInputs.batchPercent));
    } else {
      params.delete('batch');
    }
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [selectedCalcModelId, calcInputs.inputTokensPerCall, calcInputs.callsPerDay, calcInputs.cacheHitPercent, calcInputs.batchPercent, searchQuery]);

  // Global keyboard shortcuts: '/' or Cmd/Ctrl+K focuses global model search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        globalSearchRef.current?.focus();
      } else if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        globalSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const providers = useMemo(() => getAllProviderSlugs(), []);

  const comboboxMatches = useMemo(() => {
    const q = comboboxQuery.trim().toLowerCase();
    if (!q) return pricingModels;
    return pricingModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [comboboxQuery]);

  const selectedCalcModel = useMemo(
    () => pricingModels.find((m) => m.id === selectedCalcModelId) || pricingModels[0],
    [selectedCalcModelId]
  );

  const calcBreakdown = useMemo(
    () => calculateModelCost(selectedCalcModel, calcInputs),
    [selectedCalcModel, calcInputs]
  );

  const quickCompareRows = useMemo(() => {
    return compareModelIds
      .map((id) => pricingModels.find((m) => m.id === id))
      .filter((m): m is LLMModel => Boolean(m))
      .map((m) => ({
        model: m,
        calc: calculateModelCost(m, calcInputs),
      }));
  }, [compareModelIds, calcInputs]);

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

  const maxScore = useMemo(() => Math.max(100, ...ALL_MODELS.map((m) => m.score)), []);
  const maxValue = useMemo(
    () =>
      Math.max(
        10,
        ...ALL_MODELS.map((m) => (m.outputPer1M > 0 ? m.score / m.outputPer1M : m.score))
      ),
    []
  );
  const maxSpeed = useMemo(() => Math.max(250, ...ALL_MODELS.map((m) => m.tokPerSec)), []);

  const toggleSort = (col: 'score' | 'value' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(col === 'price'); }
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectModelFromCombo = (modelId: string) => {
    setSelectedCalcModelId(modelId);
    setComboboxOpen(false);
    setComboboxQuery('');
    setCompareModelIds((prev) => {
      if (prev.includes(modelId)) return prev;
      return [modelId, ...prev].slice(0, 3);
    });
  };

  const toggleQuickCompareModel = (modelId: string) => {
    setCompareModelIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.length > 1 ? prev.filter((id) => id !== modelId) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), modelId];
      }
      return [...prev, modelId];
    });
  };

  const loadModelIntoCalculatorFromRow = (modelId: string) => {
    const matchedPricing = pricingModels.find((pm) => pm.id === modelId);
    if (matchedPricing) {
      setSelectedCalcModelId(matchedPricing.id);
      setCompareModelIds((prev) =>
        prev.includes(matchedPricing.id) ? prev : [matchedPricing.id, ...prev].slice(0, 3)
      );
    }
    calculatorTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyApiModelId = (id: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(id);
    setCopiedModelId(id);
    setTimeout(() => setCopiedModelId(null), 1800);
  };

  const handleComboKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!comboboxOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setComboboxOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveComboIndex((prev) => (prev + 1) % Math.max(1, comboboxMatches.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveComboIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, comboboxMatches.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = comboboxMatches[activeComboIndex];
      if (chosen) selectModelFromCombo(chosen.id);
    } else if (e.key === 'Escape') {
      setComboboxOpen(false);
    }
  };

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Billing Calculator"
      subtitle="promptbill.online / · Prompt Caching, Batch API, Context Tiers & Pareto Frontier"
    >
      {/* 1. API Cost Calculator: Split-Screen Dashboard on Desktop (60% Left / 40% Right Sticky Summary) */}
      <section
        ref={calculatorTopRef}
        aria-labelledby="billing-calculator-heading"
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-800" />
              <h2 id="billing-calculator-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                API Cost &amp; Billing Calculator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Configure tokens, caching, and batch API on the left; compare live 30-day estimates, multi-model side-by-side bills, and host rates on the right.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-right shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
              Active 30-Day Bill
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-900 tabular-nums">
              {formatCurrency(calcBreakdown.monthlyTotalCost)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (~60% -> 7 of 12 cols on lg): Combobox, Tokens, Caching, Batch */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Keyboard-Navigable Combobox */}
              <div className="relative space-y-1.5 sm:col-span-2">
                <span id="combo-model-label" className="font-semibold text-slate-800 block">
                  Model Combobox (↑/↓ + Enter)
                </span>
                <button
                  type="button"
                  aria-labelledby="combo-model-label"
                  aria-expanded={comboboxOpen}
                  onClick={() => {
                    setComboboxOpen((prev) => !prev);
                    setActiveComboIndex(0);
                  }}
                  className="min-h-[44px] w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-left text-sm text-slate-900 hover:border-emerald-700"
                >
                  <div className="truncate">
                    <span className="font-bold">{selectedCalcModel.name}</span>{' '}
                    <span className="text-slate-600">
                      (${selectedCalcModel.inputPer1M.toFixed(2)}/${selectedCalcModel.outputPer1M.toFixed(2)})
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${comboboxOpen ? 'rotate-180' : ''}`} />
                </button>

                {comboboxOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-slate-900/40 sm:hidden"
                      onClick={() => setComboboxOpen(false)}
                    />
                    <div
                      role="listbox"
                      aria-label="Searchable models"
                      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:mt-1.5 sm:rounded-xl sm:p-3"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            autoFocus
                            value={comboboxQuery}
                            onChange={(e) => {
                              setComboboxQuery(e.target.value);
                              setActiveComboIndex(0);
                            }}
                            onKeyDown={handleComboKeyDown}
                            placeholder="Type model or provider, use ↑/↓ + Enter..."
                            aria-label="Filter models with keyboard"
                            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          aria-label="Close combobox"
                          onClick={() => setComboboxOpen(false)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {comboboxMatches.map((m, idx) => {
                          const isHighlighted = idx === activeComboIndex;
                          const isSelected = m.id === selectedCalcModelId;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onMouseEnter={() => setActiveComboIndex(idx)}
                              onClick={() => selectModelFromCombo(m.id)}
                              className={`min-h-[44px] w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                isHighlighted
                                  ? 'bg-emerald-50 text-emerald-950 font-semibold'
                                  : 'hover:bg-slate-50 text-slate-900'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-sm">{m.name}</div>
                                <div className="text-slate-600">{m.provider} · {m.contextWindow}</div>
                              </div>
                              <div className="flex items-center gap-2 font-mono shrink-0">
                                <span>${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}</span>
                                {isSelected && <Check className="w-4 h-4 text-emerald-800" />}
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

            {/* Side-by-Side Multi-Model Quick-Compare Selector (Up to 3 Models) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wider text-slate-800">
                  Quick-Compare Up to 3 Models Side-by-Side
                </span>
                <span className="text-slate-600">
                  {compareModelIds.length}/3 selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pricingModels.slice(0, 8).map((m) => {
                  const active = compareModelIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleQuickCompareModel(m.id)}
                      className={`min-h-[36px] inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-semibold transition-colors ${
                        active
                          ? 'border-emerald-800 bg-emerald-800 text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {active ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Advanced Cost Settings Drawer (Collapsed by default on mobile, expanded on desktop) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50">
              <button
                type="button"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((prev) => !prev)}
                className="min-h-[44px] w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-100/70 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Caching, Batch API &amp; Context-Tier Controls</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-700 shrink-0 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </button>

              {advancedOpen && (
                <div className="border-t border-slate-200 p-4 bg-white rounded-b-xl space-y-4">
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
              )}
            </div>
          </div>

          {/* Right Column (~40% -> 5 of 12 cols on lg): Sticky Summary Card + Multi-Model Bills + Hosting & Router Rates */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Est. 30-Day Bill · {selectedCalcModel.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {calcBreakdown.monthlyCalls.toLocaleString()} calls/mo · {formatCurrency(calcBreakdown.costPerRequest)}/req
                  </div>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold text-slate-950 tabular-nums">
                  {formatCurrency(calcBreakdown.monthlyTotalCost)}
                </div>
              </div>

              {/* Simultaneous Side-by-Side 30-Day Bills for Selected Models */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Simultaneous Model Comparison ({quickCompareRows.length} Models)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {quickCompareRows.map(({ model: cm, calc: cc }) => (
                    <div
                      key={cm.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                        cm.id === selectedCalcModelId
                          ? 'border-emerald-700 bg-emerald-50/80'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCalcModelId(cm.id)}
                        className="font-semibold text-slate-900 hover:text-emerald-800 text-left truncate"
                      >
                        {cm.name}
                      </button>
                      <span className="font-mono font-bold text-slate-900 shrink-0 tabular-nums">
                        {formatCurrency(cc.monthlyTotalCost)}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hosting & Router Side-by-Side Table (Reorders Live as Sliders Change) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-800">
                    <Server className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Hosting &amp; Router Rates</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-800">
                    Cheapest: {hostingRows[0]?.endpoint.host}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
        </div>
      </section>

      {/* 2. Leaderboard: Unified Desktop Data Grid + Mobile Cards/Table */}
      <section aria-labelledby="leaderboard-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={globalSearchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider (/ or Cmd+K)..."
              aria-label="Search models or providers"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-14 py-2 text-sm text-slate-900"
            />
            <span className="hidden sm:inline-block pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
              /
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-600">
            <span className="hidden md:inline">Click any row to expand API ID &amp; Load into Calculator</span>
            {/* Mobile View Toggle Switch: [ Cards | Table ] */}
            <div className="md:hidden inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1 gap-2 text-xs">
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
        </div>

        {/* Single Horizontally Scrollable Filter & Sort Carousel */}
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

        {/* MOBILE CARD LAYOUT (< md when mobileViewMode === 'cards') */}
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
                      <button
                        type="button"
                        onClick={() => loadModelIntoCalculatorFromRow(m.id)}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Load {m.name} into Calculator</span>
                      </button>
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

        {/* UNIFIED DESKTOP 14-COLUMN DATA GRID (Sticky Header, Frozen Rank & Model Column, Visual Bars, Inline Expandable Drawer) */}
        <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden'} md:block max-h-[680px] overflow-auto rounded-lg border border-slate-200`}>
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              November 2026 LLM Leaderboard comparing composite benchmark scores, Score per dollar value ratio, context window size, API token pricing per 1 million tokens, Elo ratings, category scores, and output generation speed in tokens per second.
            </caption>
            <thead className="sticky top-0 z-20 bg-slate-100">
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-800">
                <th scope="col" className="sticky left-0 z-30 bg-slate-100 py-3 px-3.5 border-r border-slate-200">
                  Rank &amp; Model
                </th>
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
              {rows.map(({ model: m, scorePerDollar }, idx) => {
                const isRowExpanded = expandedRowId === m.id;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
                const scoreBarPct = Math.min(100, Math.max(8, Math.round((m.score / maxScore) * 100)));
                const valueBarPct = Math.min(100, Math.max(8, Math.round((scorePerDollar / maxValue) * 100)));
                const speedBarPct = Math.min(100, Math.max(8, Math.round((m.tokPerSec / maxSpeed) * 100)));

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      onClick={() => setExpandedRowId((prev) => (prev === m.id ? null : m.id))}
                      className={`${rowBg} hover:bg-emerald-50/40 cursor-pointer transition-colors`}
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 ${rowBg} border-r border-slate-200 py-3 px-3.5 font-normal text-left`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-700">#{m.rank}</span>
                          <Link
                            href={`/models/${m.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[36px] items-center font-semibold text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline"
                          >
                            {m.name}
                          </Link>
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-900">
                            {m.evidence}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2">
                          <Link
                            href={`/providers/${m.providerSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[32px] items-center hover:text-slate-950 underline-offset-2 hover:underline"
                          >
                            {m.provider}
                          </Link>
                          <span>· {m.bestFor}</span>
                        </div>
                      </th>

                      {/* Visual Bar for Score */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <div>{m.score.toFixed(1)}</div>
                        <div className="mt-1 h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-slate-800 rounded-full" style={{ width: `${scoreBarPct}%` }} />
                        </div>
                      </td>

                      {/* Visual Bar for Value (Score/$) */}
                      <td className="py-3 px-3 font-mono font-semibold text-emerald-800">
                        <div>{scorePerDollar.toFixed(1)}</div>
                        <div className="mt-1 h-1.5 w-16 rounded-full bg-emerald-100 overflow-hidden">
                          <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${valueBarPct}%` }} />
                        </div>
                      </td>

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

                      {/* Visual Bar for Speed (Tok/s) */}
                      <td className="py-3 px-3.5 text-right font-mono text-xs font-semibold text-emerald-800">
                        <div>{m.tokPerSec} tok/s</div>
                        <div className="mt-1 h-1.5 w-16 ml-auto rounded-full bg-emerald-100 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${speedBarPct}%` }} />
                        </div>
                      </td>
                    </tr>

                    {/* Inline Row Drawer */}
                    {isRowExpanded && (
                      <tr className="bg-emerald-50/40">
                        <td colSpan={15} className="p-4 border-t border-b border-emerald-200/70">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                            <div className="space-y-1 max-w-2xl">
                              <div className="font-bold text-sm text-slate-900">
                                {m.name} ({m.provider}) — {m.bestFor}
                              </div>
                              <p className="text-slate-700 leading-relaxed">
                                {m.license} license · {m.contextWindow} context window · Cached input ${m.cachedInputPer1M.toFixed(2)}/1M · Speed {m.tokPerSec} tok/s.
                              </p>
                              <div className="flex items-center gap-2 pt-1 font-mono">
                                <span className="text-slate-600">API Model ID:</span>
                                <code className="rounded bg-white border border-slate-300 px-2 py-1 text-slate-900 font-semibold">
                                  {m.id}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyApiModelId(m.id)}
                                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-sans font-semibold text-slate-800 hover:bg-slate-100"
                                >
                                  {copiedModelId === m.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-800" />
                                      <span>Copied ID</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy API ID</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => loadModelIntoCalculatorFromRow(m.id)}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                              >
                                <ArrowUp className="w-4 h-4" />
                                <span>Load into Calculator</span>
                              </button>
                              <Link
                                href={`/models/${m.slug}`}
                                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                              >
                                Model Page -&gt;
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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

      {/* 3. Pareto Frontier Master-Detail Section */}
      <ParetoFrontierChart models={ALL_MODELS} />

      {/* Sticky Bottom Result Bar (Mobile & Tablet) */}
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
