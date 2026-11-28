'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import { formatCurrency } from '../lib/pricingEngine';
import {
  evaluateModelEndpoints,
  getEndpointKey,
  type EndpointSelectionMode,
} from '../lib/endpointPricing';
import { EndpointModeSwitcher } from './EndpointModeSwitcher';
import { ProviderLogo } from './ProviderLogo';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  Info,
  Server,
  Gauge,
  Zap,
  AlertTriangle,
  Search,
  X,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface WorkloadPreset {
  id: string;
  label: string;
  spec: string;
  inputTokens: number;
  outputTokens: number;
  callsPerDay: number;
  cachePct: number;
  batchPct: number;
}

const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'chat',
    label: 'Support Chat',
    spec: '2K in · 400 out · 3K/d',
    inputTokens: 2000,
    outputTokens: 400,
    callsPerDay: 3000,
    cachePct: 20,
    batchPct: 0,
  },
  {
    id: 'rag',
    label: 'RAG / Doc Q&A',
    spec: '8K in · 600 out · 2K/d',
    inputTokens: 8000,
    outputTokens: 600,
    callsPerDay: 2000,
    cachePct: 50,
    batchPct: 0,
  },
  {
    id: 'coding',
    label: 'Code Agent',
    spec: '24K in · 1.5K out · 800/d',
    inputTokens: 24000,
    outputTokens: 1500,
    callsPerDay: 800,
    cachePct: 60,
    batchPct: 0,
  },
  {
    id: 'batch',
    label: 'Batch Classify',
    spec: '1.2K in · 80 out · 25K/d',
    inputTokens: 1200,
    outputTokens: 80,
    callsPerDay: 25000,
    cachePct: 0,
    batchPct: 100,
  },
];

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  const quote = String.fromCharCode(34);
  const doubleQuote = String.fromCharCode(34, 34);
  const needsQuote =
    str.indexOf(quote) !== -1 ||
    str.indexOf(',') !== -1 ||
    str.indexOf('\n') !== -1 ||
    str.indexOf('\r') !== -1;
  return needsQuote ? quote + str.split(quote).join(doubleQuote) + quote : str;
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HomeInteractiveWorkbench({
  models,
  externalSelectedSlug,
}: {
  models: CatalogModel[];
  externalSelectedSlug?: string | null;
}) {
  const defaultSlug = useMemo(() => {
    const preferred = models.find(
      (m) => m.slug === 'claude-sonnet-5-5' || m.slug === 'gemini-4-carbon'
    );
    return preferred?.slug ?? models[0]?.slug ?? '';
  }, [models]);

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultSlug);
  const [modelQuery, setModelQuery] = useState<string>('');
  const [presetId, setPresetId] = useState<string>('rag');
  const [callsPerDay, setCallsPerDay] = useState<number>(2000);
  const [inputTokens, setInputTokens] = useState<number>(8000);
  const [outputTokens, setOutputTokens] = useState<number>(600);
  const [cachePct, setCachePct] = useState<number>(50);
  const [useBatch, setUseBatch] = useState<boolean>(false);
  const [endpointMode, setEndpointMode] = useState<EndpointSelectionMode>('cheapest');
  const [customHostKey, setCustomHostKey] = useState<string>('');
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const exportDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [exportMenuOpen]);

  useEffect(() => {
    if (externalSelectedSlug && models.some((m) => m.slug === externalSelectedSlug)) {
      setSelectedSlug(externalSelectedSlug);
      setModelQuery('');
    }
  }, [externalSelectedSlug, models]);

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return models;
    const matched = models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
    );
    return matched.length > 0 ? matched : models;
  }, [models, modelQuery]);

  const selectedModel = useMemo(
    () =>
      filteredModels.find((m) => m.slug === selectedSlug) ??
      models.find((m) => m.slug === selectedSlug) ??
      filteredModels[0] ??
      models[0],
    [filteredModels, models, selectedSlug]
  );

  useEffect(() => {
    setCustomHostKey('');
  }, [selectedSlug]);

  const endpointEval = useMemo(() => {
    if (!selectedModel) return null;
    return evaluateModelEndpoints(selectedModel, {
      inputTokensPerCall: Math.max(0, inputTokens),
      outputTokensPerCall: Math.max(0, outputTokens),
      reasoningTokensPerCall: 0,
      callsPerDay: Math.max(0, callsPerDay),
      cacheHitPercent: cachePct,
      cacheWriteSharePercent: 0,
      batchPercent: useBatch ? 100 : 0,
      retriesPercent: 0,
    });
  }, [selectedModel, inputTokens, outputTokens, callsPerDay, cachePct, useBatch]);

  const activeQuote = useMemo(() => {
    if (!endpointEval) return null;
    if (customHostKey) {
      const matched = endpointEval.quotes.find(
        (q) => getEndpointKey(q.endpoint, q.index) === customHostKey
      );
      if (matched) return matched;
    }
    return endpointMode === 'first-party' || endpointMode === 'official'
      ? endpointEval.firstPartyQuote
      : endpointEval.cheapestQuote;
  }, [endpointEval, endpointMode, customHostKey]);

  const dropdownOptions = useMemo(() => {
    return filteredModels.map((m) => {
      const evalPreview = evaluateModelEndpoints(m, {
        inputTokensPerCall: inputTokens,
        outputTokensPerCall: outputTokens,
        callsPerDay,
        cacheHitPercent: cachePct,
        batchPercent: useBatch ? 100 : 0,
      });
      const chosen =
        endpointMode === 'first-party'
          ? evalPreview.firstPartyQuote
          : evalPreview.cheapestQuote;
      return { model: m, chosen };
    });
  }, [filteredModels, inputTokens, outputTokens, callsPerDay, cachePct, useBatch, endpointMode]);

  if (!selectedModel || !endpointEval || !activeQuote) return null;

  const breakdown = activeQuote.breakdown;
  const activeRates = activeQuote.modelView;
  const hasMultipleHosts = endpointEval.quotes.length > 1;
  const effectiveCachePct = activeRates.cachedInputPer1M === null ? 0 : cachePct;
  const effectiveBatchPct = useBatch ? 100 : 0;

  const applyPreset = (p: WorkloadPreset) => {
    setPresetId(p.id);
    setInputTokens(p.inputTokens);
    setOutputTokens(p.outputTokens);
    setCallsPerDay(p.callsPerDay);
    setCachePct(p.cachePct);
    setUseBatch(p.batchPct > 0);
  };

  const handleModeSwitch = (nextMode: EndpointSelectionMode) => {
    setEndpointMode(nextMode);
    setCustomHostKey('');
  };

  const handleSearchChange = (value: string) => {
    setModelQuery(value);
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    const match = models.find(
      (m) =>
        m.name.toLowerCase().includes(trimmed) ||
        m.provider.toLowerCase().includes(trimmed) ||
        m.slug.toLowerCase().includes(trimmed)
    );
    if (match) {
      setSelectedSlug(match.slug);
    }
  };

  const activeEvidence =
    activeQuote.endpoint.evidenceStatus ?? selectedModel.pricingProvenance.status;
  const isVerified = activeEvidence === 'Verified';

  const firstCost = endpointEval.firstPartyQuote.breakdown.monthlyTotalCost;
  const activeCost = breakdown.monthlyTotalCost;
  const monthlySavings =
    typeof firstCost === 'number' &&
    typeof activeCost === 'number' &&
    activeQuote.index !== endpointEval.firstPartyQuote.index &&
    firstCost - activeCost > 0.005
      ? firstCost - activeCost
      : 0;
  const savingsPct =
    monthlySavings > 0 && typeof firstCost === 'number' && firstCost > 0
      ? Math.round((monthlySavings / firstCost) * 100)
      : 0;

  const buildSummaryText = () =>
    [
      `PromptBill 30-Day Estimate — ${selectedModel.name} (${selectedModel.provider})`,
      `Endpoint: ${activeQuote.endpoint.host} (${activeQuote.endpoint.providerType}) · ${activeEvidence}`,
      `Workload: ${callsPerDay.toLocaleString()} req/day · ${inputTokens.toLocaleString()} in · ${outputTokens.toLocaleString()} out · ${effectiveCachePct}% cached · ${effectiveBatchPct}% batch`,
      `Rates (/1M): Input ${fmtRate(activeRates.inputPer1M)} | Cached ${fmtRate(activeRates.cachedInputPer1M)} | Output ${fmtRate(activeRates.outputPer1M)}`,
      `Cost per 1K Calls: ${formatCurrency(breakdown.costPer1KCalls)}`,
      `Estimated 30-Day Spend: ${formatCurrency(breakdown.monthlyTotalCost)}`,
    ].join('\n');

  const handleExportCsv = () => {
    const headers = [
      'Model',
      'Provider',
      'Endpoint Host',
      'Endpoint Type',
      'Provenance',
      'Requests / Day',
      'Input Tokens / Req',
      'Output Tokens / Req',
      'Cache Hit %',
      'Batch %',
      'Input / 1M (USD)',
      'Cached Input / 1M (USD)',
      'Output / 1M (USD)',
      'Cost per 1K Calls (USD)',
      'Estimated 30-Day Spend (USD)',
      'Latency (ms)',
      'Throughput (tok/s)',
    ];
    const row = [
      selectedModel.name,
      selectedModel.provider,
      activeQuote.endpoint.host,
      activeQuote.endpoint.providerType,
      activeEvidence,
      callsPerDay,
      inputTokens,
      outputTokens,
      effectiveCachePct,
      effectiveBatchPct,
      activeRates.inputPer1M ?? 'N/A',
      activeRates.cachedInputPer1M ?? 'N/A',
      activeRates.outputPer1M ?? 'N/A',
      typeof breakdown.costPer1KCalls === 'number' ? breakdown.costPer1KCalls.toFixed(4) : 'N/A',
      typeof breakdown.monthlyTotalCost === 'number' ? breakdown.monthlyTotalCost.toFixed(2) : 'N/A',
      typeof activeQuote.latencyMs === 'number' ? activeQuote.latencyMs : 'N/A',
      typeof activeQuote.tokPerSec === 'number' ? activeQuote.tokPerSec : 'N/A',
    ];
    const csv = `${headers.map(escapeCsvCell).join(',')}\n${row.map(escapeCsvCell).join(',')}\n`;
    triggerFileDownload(
      `promptbill-${selectedModel.slug}-30d-estimate.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
    setExportMenuOpen(false);
  };

  const handleExportJson = () => {
    const payload = {
      generatedBy: 'PromptBill (https://promptbill.online)',
      model: {
        slug: selectedModel.slug,
        name: selectedModel.name,
        provider: selectedModel.provider,
        contextWindow: selectedModel.contextWindow ?? null,
      },
      endpoint: {
        host: activeQuote.endpoint.host,
        providerType: activeQuote.endpoint.providerType,
        evidenceStatus: activeEvidence,
        latencyMs: activeQuote.latencyMs ?? null,
        tokPerSec: activeQuote.tokPerSec ?? null,
      },
      workload: {
        callsPerDay,
        inputTokensPerCall: inputTokens,
        outputTokensPerCall: outputTokens,
        cacheHitPercent: effectiveCachePct,
        batchPercent: effectiveBatchPct,
      },
      ratesPer1M: {
        input: activeRates.inputPer1M ?? null,
        cachedInput: activeRates.cachedInputPer1M ?? null,
        output: activeRates.outputPer1M ?? null,
      },
      estimate30Day: {
        costPer1KCalls: breakdown.costPer1KCalls ?? null,
        monthlyTotalCost: breakdown.monthlyTotalCost ?? null,
        currency: 'USD',
      },
    };
    triggerFileDownload(
      `promptbill-${selectedModel.slug}-30d-estimate.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8;'
    );
    setExportMenuOpen(false);
  };

  const handleExportTxt = () => {
    triggerFileDownload(
      `promptbill-${selectedModel.slug}-30d-estimate.txt`,
      `${buildSummaryText()}\n`,
      'text/plain;charset=utf-8;'
    );
    setExportMenuOpen(false);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
    setExportMenuOpen(false);
  };

  const noMatchInSearch =
    modelQuery.trim().length > 0 &&
    !models.some(
      (m) =>
        m.name.toLowerCase().includes(modelQuery.trim().toLowerCase()) ||
        m.provider.toLowerCase().includes(modelQuery.trim().toLowerCase()) ||
        m.slug.toLowerCase().includes(modelQuery.trim().toLowerCase())
    );

  return (
    <section
      id="estimator"
      aria-labelledby="quick-estimator-heading"
      className="pb-calculator-shell relative rounded-[28px] bg-white p-5 sm:p-8 space-y-6"
    >
      {/* Vivid Diagonal Corner-to-Corner Colorful Wave */}
      <div
        aria-hidden="true"
        className="pb-diagonal-wave pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] opacity-75"
      >
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/40 via-cyan-400/30 to-transparent blur-2xl" />
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="pbVividDiag1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.34" />
              <stop offset="32%" stopColor="#06B6D4" stopOpacity="0.28" />
              <stop offset="66%" stopColor="#8B5CF6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.34" />
            </linearGradient>
            <linearGradient id="pbVividDiag2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.22" />
              <stop offset="78%" stopColor="#EC4899" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.32" />
            </linearGradient>
          </defs>
          <path
            d="M-60,-30 C230,50 310,330 640,355 C940,375 1040,520 1260,630 L1260,420 C1020,330 890,190 610,170 C310,150 200,-20 -60,-130 Z"
            fill="url(#pbVividDiag1)"
          />
          <path
            d="M-80,90 C220,180 390,430 720,455 C980,475 1090,565 1260,660 L1260,515 C1060,420 920,295 660,270 C350,245 180,45 -80,-35 Z"
            fill="url(#pbVividDiag2)"
          />
        </svg>
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-tl from-rose-500/32 via-violet-500/28 to-amber-400/28 blur-2xl" />
      </div>

      {/* Top Row: Title + Endpoint Switcher + Export Dropdown */}
      <div className="relative z-40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400 shadow-sm">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="quick-estimator-heading"
                className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                30-Day API Spend Calculator
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                Live Math
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
              Estimate monthly API spend with prompt caching, batch discounts, and endpoint routing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <EndpointModeSwitcher mode={endpointMode} onChange={handleModeSwitch} />

          {/* Export Dropdown Menu with Multiple Formats */}
          <div ref={exportDropdownRef} className="relative">
            <button
              type="button"
              aria-expanded={exportMenuOpen}
              aria-haspopup="menu"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-300 transition-transform ${
                  exportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {exportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-300 bg-white p-2 shadow-2xl z-[100] space-y-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportCsv}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-950">Spreadsheet (.CSV)</div>
                    <div className="text-[11px] font-medium text-slate-600">
                      All inputs, rates &amp; 30-day total
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportJson}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileJson className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-950">Structured Data (.JSON)</div>
                    <div className="text-[11px] font-medium text-slate-600">
                      Machine-readable quote object
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportTxt}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-950">Report Note (.TXT)</div>
                    <div className="text-[11px] font-medium text-slate-600">
                      Clean text summary download
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopySummary}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-950">
                      {copiedSummary ? 'Copied to Clipboard' : 'Copy Summary'}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600">
                      Paste into Slack, Notion, or docs
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refined 4-Card Preset Strip + Aligned Endpoint Selector */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {WORKLOAD_PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={active}
                className={`rounded-2xl px-3.5 py-2.5 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-slate-950 text-white shadow-sm ring-1 ring-slate-950'
                    : 'bg-white/90 text-slate-900 ring-1 ring-slate-200/90 hover:bg-white hover:ring-slate-300'
                }`}
              >
                <span className="text-xs font-bold tracking-tight truncate">{p.label}</span>
                <span
                  className={`mt-1 font-mono text-[10px] truncate ${
                    active ? 'text-emerald-300' : 'text-slate-700 font-semibold'
                  }`}
                >
                  {p.spec}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-4 flex items-center">
          {hasMultipleHosts ? (
            <div className="w-full rounded-2xl bg-white/90 ring-1 ring-slate-200/90 px-3.5 py-2.5 flex flex-col justify-between">
              <label
                htmlFor="home-host-select"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1"
              >
                <Server className="h-3 w-3 text-emerald-700" />
                <span>Active Endpoint</span>
              </label>
              <select
                id="home-host-select"
                value={getEndpointKey(activeQuote.endpoint, activeQuote.index)}
                onChange={(e) => {
                  setCustomHostKey(e.target.value);
                  if (
                    e.target.value ===
                    getEndpointKey(
                      endpointEval.firstPartyQuote.endpoint,
                      endpointEval.firstPartyQuote.index
                    )
                  ) {
                    setEndpointMode('first-party');
                  } else {
                    setEndpointMode('cheapest');
                  }
                }}
                className="w-full bg-transparent text-xs font-bold text-slate-950 focus:outline-none truncate"
              >
                {endpointEval.quotes.map((q) => (
                  <option
                    key={getEndpointKey(q.endpoint, q.index)}
                    value={getEndpointKey(q.endpoint, q.index)}
                  >
                    {q.endpoint.host} ({q.endpoint.providerType}) —{' '}
                    {formatCurrency(q.breakdown.monthlyTotalCost)}/mo
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-white/80 ring-1 ring-slate-200/80 px-3.5 py-2.5 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Server className="h-3 w-3 text-emerald-700" />
                <span>Single Host</span>
              </span>
              <span className="mt-1 text-xs font-bold text-slate-900 truncate">
                {activeQuote.endpoint.host}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Symmetrical Inputs (7 cols) + Dark Summary Card (5 cols) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Model + Select Model */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="home-model-search"
                  className="text-xs font-bold text-slate-800"
                >
                  Search &amp; Select Model
                </label>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <ProviderLogo
                    provider={selectedModel.provider}
                    modelName={selectedModel.name}
                    modelSlug={selectedModel.slug}
                    size="sm"
                  />
                  <span>{selectedModel.provider}</span>
                </span>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="home-model-search"
                  type="text"
                  value={modelQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Type model name or provider (e.g. GPT-6.2, Claude, DeepSeek, Gemini)..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 pl-10 pr-9 text-sm text-slate-950 placeholder:text-slate-600 focus:border-slate-900 focus:outline-none"
                />
                {modelQuery && (
                  <button
                    type="button"
                    aria-label="Clear model search"
                    onClick={() => setModelQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-2.5">
                <label htmlFor="home-model-select" className="sr-only">
                  Select Model
                </label>
                <select
                  id="home-model-select"
                  value={selectedModel.slug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 text-sm font-semibold text-slate-950 shadow-2xs focus:border-slate-900 focus:outline-none"
                >
                  {dropdownOptions.map(({ model: m, chosen }) => (
                    <option key={m.id} value={m.slug}>
                      {m.name} ({m.provider}) — {fmtRate(chosen.modelView.inputPer1M)} /{' '}
                      {fmtRate(chosen.modelView.outputPer1M)} per 1M via {chosen.endpoint.host}
                    </option>
                  ))}
                </select>
              </div>

              {noMatchInSearch && (
                <p className="mt-1.5 text-xs text-amber-800">
                  No exact match for &ldquo;{modelQuery}&rdquo; — showing {selectedModel.name}.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="home-calls-day"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Requests / Day
              </label>
              <input
                id="home-calls-day"
                type="number"
                min={0}
                step={100}
                value={callsPerDay}
                onChange={(e) => {
                  setPresetId('custom');
                  setCallsPerDay(Math.max(0, Number(e.target.value) || 0));
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="home-cache-pct"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Prompt Cache Hit Share
              </label>
              <select
                id="home-cache-pct"
                disabled={activeRates.cachedInputPer1M === null}
                value={effectiveCachePct}
                onChange={(e) => {
                  setPresetId('custom');
                  setCachePct(Number(e.target.value));
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 font-mono text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-900 focus:outline-none"
              >
                <option value={0}>0% (No cache hits)</option>
                <option value={20}>20% Cached reads</option>
                <option value={50}>50% Cached reads</option>
                <option value={80}>80% Cached reads</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="home-input-tok"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Input Tokens / Request
              </label>
              <input
                id="home-input-tok"
                type="number"
                min={0}
                step={250}
                value={inputTokens}
                onChange={(e) => {
                  setPresetId('custom');
                  setInputTokens(Math.max(0, Number(e.target.value) || 0));
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="home-output-tok"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Output Tokens / Request
              </label>
              <input
                id="home-output-tok"
                type="number"
                min={0}
                step={50}
                value={outputTokens}
                onChange={(e) => {
                  setPresetId('custom');
                  setOutputTokens(Math.max(0, Number(e.target.value) || 0));
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 font-mono text-sm text-slate-950 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/75 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              {isVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              ) : (
                <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              )}
              <span>
                Source:{' '}
                <strong className="text-slate-900">
                  {activeQuote.endpoint.host} · {activeEvidence}
                </strong>
              </span>
            </span>

            {breakdown.batchSupported ? (
              <button
                type="button"
                onClick={() => setUseBatch((v) => !v)}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  useBatch
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {useBatch
                  ? `Batch API On (${Math.round(breakdown.batchDiscountRate * 100)}% off)`
                  : `Enable Batch (${Math.round(breakdown.batchDiscountRate * 100)}% off)`}
              </button>
            ) : (
              <span className="text-slate-500">Batch discount: N/A</span>
            )}
          </div>
        </div>

        {/* Right Summary Card — Crisp Light Surface with Prism Wave Graphic */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-emerald-50/55 to-indigo-50/60 text-slate-950 p-6 flex flex-col justify-between gap-5 shadow-md">
          {/* Subtle Prism Wave & Telemetry Lattice Graphic */}
          <svg
            aria-hidden="true"
            viewBox="0 0 420 320"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-75"
          >
            <defs>
              <linearGradient id="pbSummaryWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
                <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.16" />
              </linearGradient>
              <pattern
                id="pbSummaryDots"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.15" fill="#0F172A" fillOpacity="0.08" />
              </pattern>
            </defs>
            <rect width="420" height="320" fill="url(#pbSummaryDots)" />
            <path
              d="M0,220 C110,165 220,275 420,185 L420,320 L0,320 Z"
              fill="url(#pbSummaryWaveGrad)"
            />
            <path
              d="M0,255 C135,205 250,300 420,225"
              fill="none"
              stroke="#10B981"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
          </svg>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-500/12 px-2.5 py-1 font-bold text-emerald-900">
                <Server className="h-3 w-3 text-emerald-700" />
                {activeQuote.endpoint.host}
              </span>
              <span className="font-mono font-semibold text-slate-700">
                {selectedModel.contextWindow ?? 'N/A'} ctx
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ProviderLogo
                  provider={selectedModel.provider}
                  modelName={selectedModel.name}
                  modelSlug={selectedModel.slug}
                  size="sm"
                />
                <span>30-Day Spend · {selectedModel.name}</span>
              </div>
              <div className="mt-1.5 font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 tabular-nums">
                {formatCurrency(breakdown.monthlyTotalCost)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs font-semibold text-slate-700 tabular-nums">
                <span>{formatCurrency(breakdown.costPer1KCalls)} / 1K calls</span>
                {typeof activeQuote.latencyMs === 'number' && (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                    <Gauge className="h-3 w-3" />
                    &lt;{activeQuote.latencyMs}ms
                  </span>
                )}
                {typeof activeQuote.tokPerSec === 'number' && (
                  <span className="inline-flex items-center gap-1 text-indigo-800 font-bold">
                    <Zap className="h-3 w-3" />~{activeQuote.tokPerSec} tok/s
                  </span>
                )}
              </div>

              {monthlySavings > 0 && (
                <div className="mt-2.5 inline-flex items-center rounded-lg bg-emerald-600/12 border border-emerald-700/25 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
                  Saves {formatCurrency(monthlySavings)}/mo ({savingsPct}%) vs.{' '}
                  {endpointEval.firstPartyQuote.endpoint.host}
                </div>
              )}

              {breakdown.triggersLongContextMultiplier && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-600/25 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{breakdown.activeContextTierLabel}</span>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-slate-200/90 pt-4 text-xs">
              <div>
                <dt className="font-medium text-slate-600">Input / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-slate-950">
                  {fmtRate(activeRates.inputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Cached / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-emerald-800">
                  {fmtRate(activeRates.cachedInputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Output / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-slate-950">
                  {fmtRate(activeRates.outputPer1M)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href={`/models/${selectedModel.slug}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <span>Inspect Endpoints</span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white/90 px-4 text-xs sm:text-sm font-bold text-slate-900 hover:bg-white transition-colors"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
