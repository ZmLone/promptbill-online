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

  const monthlyVal =
    typeof breakdown.monthlyTotalCost === 'number' && Number.isFinite(breakdown.monthlyTotalCost)
      ? breakdown.monthlyTotalCost
      : null;
  const dailyVal = monthlyVal !== null ? monthlyVal / 30 : null;
  const annualVal = monthlyVal !== null ? monthlyVal * 12 : null;
  const monthlyTokensM =
    ((Math.max(0, callsPerDay) * (Math.max(0, inputTokens) + Math.max(0, outputTokens)) * 30) /
      1_000_000);

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
      `PromptBill 30-Day API Cost Estimate — ${selectedModel.name} (${selectedModel.provider})`,
      `Endpoint: ${activeQuote.endpoint.host} (${activeQuote.endpoint.providerType}) · ${activeEvidence}`,
      `Workload: ${callsPerDay.toLocaleString()} req/day · ${inputTokens.toLocaleString()} in · ${outputTokens.toLocaleString()} out · ${effectiveCachePct}% cached · ${effectiveBatchPct}% batch`,
      `Rates (/1M): Input ${fmtRate(activeRates.inputPer1M)} | Cached ${fmtRate(activeRates.cachedInputPer1M)} | Output ${fmtRate(activeRates.outputPer1M)}`,
      `Cost per 1K Calls: ${formatCurrency(breakdown.costPer1KCalls)}`,
      `Daily / 30-Day / Annual Spend: ${dailyVal !== null ? formatCurrency(dailyVal) : 'N/A'}/d · ${formatCurrency(breakdown.monthlyTotalCost)}/30d · ${annualVal !== null ? formatCurrency(annualVal) : 'N/A'}/yr`,
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
      'Daily Spend (USD)',
      'Estimated 30-Day Spend (USD)',
      'Estimated Annual Spend (USD)',
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
      dailyVal !== null ? dailyVal.toFixed(2) : 'N/A',
      typeof breakdown.monthlyTotalCost === 'number' ? breakdown.monthlyTotalCost.toFixed(2) : 'N/A',
      annualVal !== null ? annualVal.toFixed(2) : 'N/A',
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
        monthlyTokensMillions: Number(monthlyTokensM.toFixed(2)),
      },
      ratesPer1M: {
        input: activeRates.inputPer1M ?? null,
        cachedInput: activeRates.cachedInputPer1M ?? null,
        output: activeRates.outputPer1M ?? null,
      },
      spendEstimate: {
        costPer1KCalls: breakdown.costPer1KCalls ?? null,
        dailyCost: dailyVal !== null ? Number(dailyVal.toFixed(2)) : null,
        monthlyTotalCost30Day: breakdown.monthlyTotalCost ?? null,
        annualizedCost: annualVal !== null ? Number(annualVal.toFixed(2)) : null,
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

  const calculatorJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PromptBill 30-Day LLM API Spend Calculator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: 'https://promptbill.online/#estimator',
    description:
      'Interactive LLM token cost estimator calculating daily, 30-day, and annualized API spend across official endpoints and third-party inference hosts with prompt caching and batch discounts.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <section
      id="estimator"
      aria-labelledby="quick-estimator-heading"
      className="pb-calculator-shell relative rounded-[28px] bg-white p-5 sm:p-8 space-y-6"
    >
      {/* Structured Data for Search Engines & AI/GEO Answer Systems */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorJsonLd) }}
      />

      {/* Top Row: Title + Endpoint Switcher + Export Dropdown */}
      <header className="relative z-40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700/10 text-emerald-900 ring-1 ring-inset ring-emerald-700/25">
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
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950">
                30-Day &amp; Annual Math
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
              Calculate LLM API token costs from daily requests, input/output tokens, prompt cache hit share, and batch discounts.
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
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Export</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-emerald-100 transition-transform ${
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
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-800 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-950">Spreadsheet (.CSV)</div>
                    <div className="text-[11px] font-medium text-slate-700">
                      Inputs, per-1M rates &amp; spend
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportJson}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileJson className="h-4 w-4 text-indigo-800 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-950">Structured Data (.JSON)</div>
                    <div className="text-[11px] font-medium text-slate-700">
                      Machine-readable quote object
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportTxt}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-sky-800 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-950">Report Note (.TXT)</div>
                    <div className="text-[11px] font-medium text-slate-700">
                      Plain-text cost breakdown
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-200" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopySummary}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <Check className="h-4 w-4 text-emerald-800 shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-700 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-950">
                      {copiedSummary ? 'Copied to Clipboard' : 'Copy Summary'}
                    </div>
                    <div className="text-[11px] font-medium text-slate-700">
                      Paste into docs, tickets, or notes
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Workload Presets + Active Endpoint Selector */}
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
                    ? 'bg-emerald-50 text-slate-950 shadow-xs ring-2 ring-emerald-700'
                    : 'bg-slate-50/80 text-slate-900 ring-1 ring-slate-300 hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold tracking-tight truncate">{p.label}</span>
                <span
                  className={`mt-1 font-mono text-[11px] truncate ${
                    active ? 'text-emerald-900 font-bold' : 'text-slate-700 font-semibold'
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
            <div className="w-full rounded-2xl bg-slate-50/80 ring-1 ring-slate-300 px-3.5 py-2.5 flex flex-col justify-between">
              <label
                htmlFor="home-host-select"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1"
              >
                <Server className="h-3.5 w-3.5 text-emerald-800" />
                <span>Hosting Endpoint</span>
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
            <div className="w-full rounded-2xl bg-slate-50/80 ring-1 ring-slate-300 px-3.5 py-2.5 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Server className="h-3.5 w-3.5 text-emerald-800" />
                <span>Single Endpoint</span>
              </span>
              <span className="mt-1 text-xs font-bold text-slate-950 truncate">
                {activeQuote.endpoint.host}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Workload Inputs (7 cols) + Cost Breakdown Card (5 cols) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search & Select Model */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="home-model-search"
                  className="text-xs font-bold text-slate-800"
                >
                  Search &amp; Select Model
                </label>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
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
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  id="home-model-search"
                  type="text"
                  value={modelQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Filter by model or provider (e.g. Claude, GPT-6.2, DeepSeek, Gemini)..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 text-sm font-medium text-slate-950 placeholder:text-slate-600 focus:border-emerald-700 focus:outline-none"
                />
                {modelQuery && (
                  <button
                    type="button"
                    aria-label="Clear model search"
                    onClick={() => setModelQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
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
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-950 shadow-2xs focus:border-emerald-700 focus:outline-none"
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
                <p className="mt-1.5 text-xs font-semibold text-amber-950">
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
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-semibold text-slate-950 focus:border-emerald-700 focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-semibold text-slate-950 disabled:bg-slate-100 disabled:text-slate-600 focus:border-emerald-700 focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-semibold text-slate-950 focus:border-emerald-700 focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-semibold text-slate-950 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs font-medium text-slate-800">
            <span className="inline-flex items-center gap-1.5">
              {isVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
              ) : (
                <Info className="h-3.5 w-3.5 text-amber-800 shrink-0" />
              )}
              <span>
                Rate Provenance:{' '}
                <strong className="font-bold text-slate-950">
                  {activeQuote.endpoint.host} · {activeEvidence}
                </strong>
              </span>
            </span>

            {breakdown.batchSupported ? (
              <button
                type="button"
                onClick={() => setUseBatch((v) => !v)}
                className={`inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                  useBatch
                    ? 'border-emerald-700 bg-emerald-100 text-emerald-950'
                    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                {useBatch
                  ? `Batch Discount Active (${Math.round(breakdown.batchDiscountRate * 100)}% off)`
                  : `Apply Batch (${Math.round(breakdown.batchDiscountRate * 100)}% off)`}
              </button>
            ) : (
              <span className="font-semibold text-slate-700">Batch discount: N/A</span>
            )}
          </footer>
        </div>

        {/* Right Cost Summary Card — Clean, High-Contrast Architectural Surface */}
        <aside
          aria-label="Estimated API Cost Breakdown"
          className="lg:col-span-5 rounded-2xl border border-slate-300 bg-slate-50/75 text-slate-950 p-6 flex flex-col justify-between gap-5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-100/80 px-2.5 py-1 font-bold text-emerald-950">
                <Server className="h-3 w-3 text-emerald-800" />
                {activeQuote.endpoint.host}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {selectedModel.contextWindow ?? 'N/A'} ctx · ~{monthlyTokensM.toFixed(1)}M tok/mo
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ProviderLogo
                  provider={selectedModel.provider}
                  modelName={selectedModel.name}
                  modelSlug={selectedModel.slug}
                  size="sm"
                />
                <span>Estimated 30-Day Spend · {selectedModel.name}</span>
              </div>
              <div className="mt-1.5 font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 tabular-nums">
                {formatCurrency(breakdown.monthlyTotalCost)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs font-bold text-slate-800 tabular-nums">
                <span>
                  {dailyVal !== null ? `${formatCurrency(dailyVal)}/day` : 'N/A/day'}
                </span>
                <span>·</span>
                <span>
                  {annualVal !== null ? `${formatCurrency(annualVal)}/yr` : 'N/A/yr'}
                </span>
                <span>·</span>
                <span>{formatCurrency(breakdown.costPer1KCalls)} / 1K calls</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs font-bold tabular-nums">
                {typeof activeQuote.latencyMs === 'number' && (
                  <span className="inline-flex items-center gap-1 text-emerald-900">
                    <Gauge className="h-3.5 w-3.5" />
                    &lt;{activeQuote.latencyMs}ms latency
                  </span>
                )}
                {typeof activeQuote.tokPerSec === 'number' && (
                  <span className="inline-flex items-center gap-1 text-indigo-900">
                    <Zap className="h-3.5 w-3.5" />~{activeQuote.tokPerSec} tok/s
                  </span>
                )}
              </div>

              {monthlySavings > 0 && (
                <div className="mt-2.5 inline-flex items-center rounded-lg bg-emerald-100 border border-emerald-700/25 px-2.5 py-1 text-xs font-bold text-emerald-950">
                  Saves {formatCurrency(monthlySavings)}/mo ({savingsPct}%) vs.{' '}
                  {endpointEval.firstPartyQuote.endpoint.host}
                </div>
              )}

              {breakdown.triggersLongContextMultiplier && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-700/25 px-2.5 py-1 text-xs font-bold text-amber-950">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <span>{breakdown.activeContextTierLabel}</span>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 text-xs">
              <div>
                <dt className="font-semibold text-slate-700">Input / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-slate-950">
                  {fmtRate(activeRates.inputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Cached / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-emerald-900">
                  {fmtRate(activeRates.cachedInputPer1M)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Output / 1M</dt>
                <dd className="mt-0.5 font-mono font-bold text-slate-950">
                  {fmtRate(activeRates.outputPer1M)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href={`/models/${selectedModel.slug}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <span>Inspect Endpoints</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs sm:text-sm font-bold text-slate-950 hover:bg-slate-100 transition-colors"
            >
              Compare
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
