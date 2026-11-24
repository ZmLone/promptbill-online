'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';
import { SiteShell } from './SiteShell';
import { Search, ArrowUpDown, Calculator, Share2, Check, Sparkles } from 'lucide-react';

export function LeaderboardClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // 30-Day API Cost Calculator state (driven by live catalog model pricing)
  const defaultModelId = ALL_MODELS[0]?.id ?? '';
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [dailyRequests, setDailyRequests] = useState<number>(5000);
  const [inputTokensPerReq, setInputTokensPerReq] = useState<number>(1500);
  const [outputTokensPerReq, setOutputTokensPerReq] = useState<number>(600);
  const [cacheHitPercent, setCacheHitPercent] = useState<number>(20);
  const [batchDiscount, setBatchDiscount] = useState<boolean>(false);
  const [monthlyPricePerSeatOrPlan, setMonthlyPricePerSeatOrPlan] = useState<number>(0);

  // Pareto / Shareable Graph state
  const [chartMode, setChartMode] = useState<'price' | 'speed'>('price');
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const providers = useMemo(() => getAllProviderSlugs(), []);

  const selectedModel = useMemo(
    () => ALL_MODELS.find((m) => m.id === selectedModelId) ?? ALL_MODELS[0],
    [selectedModelId]
  );

  const costBreakdown = useMemo(() => {
    if (!selectedModel) {
      return {
        monthlyInputTokens: 0,
        monthlyOutputTokens: 0,
        inputCost: 0,
        outputCost: 0,
        total30DayCost: 0,
        estimatedMargin: 0,
      };
    }
    const days = 30;
    const reqs = Math.max(0, dailyRequests);
    const inTok = Math.max(0, inputTokensPerReq);
    const outTok = Math.max(0, outputTokensPerReq);
    const cacheRatio = Math.min(100, Math.max(0, cacheHitPercent)) / 100;
    const batchMultiplier = batchDiscount ? 0.5 : 1;

    const monthlyInputTokens = reqs * inTok * days;
    const monthlyOutputTokens = reqs * outTok * days;

    // Cache hits reduce effective input cost (typically ~0.25x of standard input rate when cached)
    const effectiveInputFactor = (1 - cacheRatio) + cacheRatio * 0.25;
    const inputCost =
      (monthlyInputTokens / 1_000_000) *
      selectedModel.inputPer1M *
      effectiveInputFactor *
      batchMultiplier;
    const outputCost =
      (monthlyOutputTokens / 1_000_000) *
      selectedModel.outputPer1M *
      batchMultiplier;
    const total30DayCost = inputCost + outputCost;
    const estimatedMargin = Math.max(0, monthlyPricePerSeatOrPlan) - total30DayCost;

    return {
      monthlyInputTokens,
      monthlyOutputTokens,
      inputCost,
      outputCost,
      total30DayCost,
      estimatedMargin,
    };
  }, [
    selectedModel,
    dailyRequests,
    inputTokensPerReq,
    outputTokensPerReq,
    cacheHitPercent,
    batchDiscount,
    monthlyPricePerSeatOrPlan,
  ]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_MODELS
      .filter((m) => {
        if (
          q &&
          !m.name.toLowerCase().includes(q) &&
          !m.provider.toLowerCase().includes(q) &&
          !m.bestFor.toLowerCase().includes(q)
        ) {
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

  const chartPoints = useMemo(() => {
    const source = ALL_MODELS.slice(0, 24);
    const xValues = source.map((m) =>
      chartMode === 'price'
        ? Math.max(0.01, (m.inputPer1M + m.outputPer1M) / 2)
        : Math.max(1, m.tokPerSec)
    );
    const yValues = source.map((m) => m.score);

    const minX = Math.min(...xValues, 0);
    const maxX = Math.max(...xValues, 1);
    const minY = Math.max(0, Math.min(...yValues) - 5);
    const maxY = Math.max(...yValues, 100);

    const width = 680;
    const height = 260;
    const padLeft = 48;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 38;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    return source.map((m, i) => {
      const rawX = xValues[i];
      const rawY = yValues[i];
      const normX = maxX > minX ? (rawX - minX) / (maxX - minX) : 0.5;
      const normY = maxY > minY ? (rawY - minY) / (maxY - minY) : 0.5;
      const cx = padLeft + normX * plotW;
      const cy = padTop + (1 - normY) * plotH;
      return {
        model: m,
        rawX,
        rawY,
        cx,
        cy,
      };
    });
  }, [chartMode]);

  const activePoint = useMemo(() => {
    if (hoveredModelId) {
      return chartPoints.find((p) => p.model.id === hoveredModelId) ?? chartPoints[0];
    }
    if (selectedModel) {
      return chartPoints.find((p) => p.model.id === selectedModel.id) ?? chartPoints[0];
    }
    return chartPoints[0];
  }, [hoveredModelId, selectedModel, chartPoints]);

  const handleShareGraph = async () => {
    const summary = selectedModel
      ? `PromptBill 30-Day API Estimate (${selectedModel.name}): $${costBreakdown.total30DayCost.toFixed(2)}/mo at ${dailyRequests.toLocaleString()} req/day — https://promptbill.online`
      : 'PromptBill LLM Leaderboard & 30-Day API Cost Calculator — https://promptbill.online';
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(false);
    }
  };

  const toggleSort = (col: 'score' | 'value' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(col === 'price'); }
  };

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Speed — Nov 2026"
      subtitle="promptbill.online / · 30-Day API Cost Calculator, Pareto Graph & Leaderboard"
    >
      <div className="space-y-6">
        {/* 1. 30-DAY API COST & MARGIN CALCULATOR */}
        <section
          aria-label="30-Day API Cost Calculator"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-700">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">30-Day API Token Cost Calculator</h2>
                <p className="text-xs text-slate-500">
                  Live catalog rates · Adjust daily volume, token lengths, cache hit rate, and batch mode
                </p>
              </div>
            </div>
            {selectedModel && (
              <Link
                href={`/models/${selectedModel.slug}`}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                View {selectedModel.name} specs →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700">Model</span>
              <select
                value={selectedModel?.id ?? ''}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700">Daily Requests</span>
              <input
                type="number"
                min={0}
                step={100}
                value={dailyRequests}
                onChange={(e) => setDailyRequests(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900"
              />
            </label>

            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700">Input / Output Tokens per Call</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  step={50}
                  aria-label="Input tokens per call"
                  value={inputTokensPerReq}
                  onChange={(e) => setInputTokensPerReq(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-mono text-slate-900"
                />
                <input
                  type="number"
                  min={0}
                  step={50}
                  aria-label="Output tokens per call"
                  value={outputTokensPerReq}
                  onChange={(e) => setOutputTokensPerReq(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-mono text-slate-900"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Prompt Cache Hit Rate</span>
                <span className="font-mono font-bold text-emerald-700">{cacheHitPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                step={5}
                value={cacheHitPercent}
                onChange={(e) => setCacheHitPercent(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </label>

            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700">Monthly Revenue / Budget ($)</span>
              <input
                type="number"
                min={0}
                step={10}
                value={monthlyPricePerSeatOrPlan}
                onChange={(e) => setMonthlyPricePerSeatOrPlan(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900"
              />
            </label>

            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 w-full">
                <input
                  type="checkbox"
                  checked={batchDiscount}
                  onChange={(e) => setBatchDiscount(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">Batch API Mode (50% Off)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono">
            <div>
              <div className="text-[11px] font-sans text-slate-500">Estimated 30-Day Bill</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                ${costBreakdown.total30DayCost.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                In: ${costBreakdown.inputCost.toFixed(2)} · Out: ${costBreakdown.outputCost.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-sans text-slate-500">30-Day Token Volume</div>
              <div className="text-base font-bold text-slate-800 mt-1">
                {(costBreakdown.monthlyInputTokens / 1_000_000).toFixed(1)}M in /{' '}
                {(costBreakdown.monthlyOutputTokens / 1_000_000).toFixed(1)}M out
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {selectedModel?.tokPerSec ?? 0} tok/s avg speed
              </div>
            </div>

            <div>
              <div className="text-[11px] font-sans text-slate-500">Net Margin vs. Budget</div>
              <div
                className={`text-xl font-bold mt-0.5 ${
                  costBreakdown.estimatedMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {monthlyPricePerSeatOrPlan > 0
                  ? `$${costBreakdown.estimatedMargin.toFixed(2)}`
                  : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {monthlyPricePerSeatOrPlan > 0
                  ? 'Revenue minus 30-day API cost'
                  : 'Enter a budget to calculate margin'}
              </div>
            </div>
          </div>
        </section>

        {/* 2. PARETO FRONTIER & SHAREABLE GRAPH */}
        <section
          aria-label="Pareto Frontier Benchmark Graph"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-2 text-slate-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Benchmark Score vs. {chartMode === 'price' ? 'Blended Token Cost ($/1M)' : 'Generation Speed (Tok/s)'}
                </h2>
                <p className="text-xs text-slate-500">
                  Click or hover any point to select a model in the cost calculator above
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setChartMode('price')}
                  className={`px-2.5 py-1.5 rounded-md font-medium ${
                    chartMode === 'price'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Score vs. Cost
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('speed')}
                  className={`px-2.5 py-1.5 rounded-md font-medium ${
                    chartMode === 'speed'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Score vs. Speed
                </button>
              </div>

              <button
                type="button"
                onClick={handleShareGraph}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
            <div className="lg:col-span-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2">
              <svg
                viewBox="0 0 680 260"
                className="w-full h-auto min-w-[460px]"
                role="img"
                aria-label="Scatter chart comparing LLM benchmark scores against cost or speed"
              >
                <line x1="48" y1="222" x2="656" y2="222" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="48" y1="20" x2="48" y2="222" stroke="#cbd5e1" strokeWidth="1" />

                <text x="352" y="250" textAnchor="middle" className="fill-slate-500 text-[11px]">
                  {chartMode === 'price'
                    ? 'Average Token Price ($ / 1M tokens)'
                    : 'Throughput Speed (Tokens / sec)'}
                </text>
                <text
                  x="15"
                  y="121"
                  textAnchor="middle"
                  transform="rotate(-90 15 121)"
                  className="fill-slate-500 text-[11px]"
                >
                  Benchmark Score
                </text>

                {chartPoints.map((pt) => {
                  const isSelected = selectedModel?.id === pt.model.id;
                  const isHovered = hoveredModelId === pt.model.id;
                  return (
                    <g
                      key={pt.model.id}
                      onMouseEnter={() => setHoveredModelId(pt.model.id)}
                      onMouseLeave={() => setHoveredModelId(null)}
                      onClick={() => setSelectedModelId(pt.model.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={isSelected || isHovered ? 7 : 5}
                        fill={isSelected ? '#059669' : isHovered ? '#0f172a' : '#10b981'}
                        fillOpacity={isSelected || isHovered ? 1 : 0.78}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Highlighted Model
              </div>
              {activePoint ? (
                <>
                  <div className="text-sm font-bold text-slate-900">{activePoint.model.name}</div>
                  <div className="text-slate-600">{activePoint.model.provider}</div>
                  <div className="pt-1 space-y-1 font-mono text-slate-800">
                    <div>Score: {activePoint.model.score.toFixed(1)}</div>
                    <div>
                      Price: ${activePoint.model.inputPer1M.toFixed(2)} / ${activePoint.model.outputPer1M.toFixed(2)}
                    </div>
                    <div>Speed: {activePoint.model.tokPerSec} tok/s</div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* 3. LEADERBOARD TABLE & MOBILE CARDS */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          {/* Search, Filters & Sort Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search model or provider..."
                aria-label="Search models"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={evidenceFilter}
                onChange={(e) => setEvidenceFilter(e.target.value)}
                aria-label="Filter by evidence"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
              >
                <option value="All">All Evidence</option>
                <option value="Supported">Supported</option>
                <option value="Estimated">Estimated</option>
              </select>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                aria-label="Filter by license"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800"
              >
                <option value="All">All Licenses</option>
                <option value="Closed">Closed</option>
                <option value="Open">Open Weight</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value as 'score' | 'value' | 'price' | 'elo' | 'tokPerSec';
                  setSortBy(val);
                  setSortAsc(val === 'price');
                }}
                aria-label="Sort models by"
                className="md:hidden rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 font-medium"
              >
                <option value="score">Sort: Benchmark Score</option>
                <option value="value">Sort: Best Score/$</option>
                <option value="price">Sort: Lowest Price</option>
                <option value="tokPerSec">Sort: Fastest Tok/s</option>
                <option value="elo">Sort: Highest Elo</option>
              </select>
            </div>
          </div>

          {/* MOBILE CARD LAYOUT (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map(({ model: m, scorePerDollar }) => (
              <article key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500">#{m.rank}</span>
                      <Link href={`/models/${m.slug}`} className="text-base font-bold text-slate-900 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {m.evidence}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      <Link href={`/providers/${m.providerSlug}`} className="underline">
                        {m.provider}
                      </Link>{' '}
                      · {m.license} · {m.contextWindow} context
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-lg font-bold text-slate-900">{m.score.toFixed(1)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-center font-mono text-xs">
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">In / Out ($/1M)</div>
                    <div className="font-bold text-slate-900 mt-0.5">${m.inputPer1M.toFixed(2)}/${m.outputPer1M.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">Speed</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{m.tokPerSec} tok/s</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">Value (Score/$)</div>
                    <div className="font-bold text-slate-900 mt-0.5">{scorePerDollar.toFixed(1)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-700">
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5">AG {m.ag}</span>
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5">CO {m.co}</span>
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5">RE {m.re}</span>
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5">MM {m.mm}</span>
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5">Elo {m.elo.toFixed(0)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 line-clamp-1">{m.bestFor}</span>
                  <Link href={`/models/${m.slug}`} className="shrink-0 font-semibold text-emerald-700 hover:underline ml-2">
                    Specs &amp; Cost →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* DESKTOP & TABLET SEMANTIC SEO TABLE (md+) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">
                November 2026 LLM Leaderboard comparing composite benchmark scores, Score per dollar value ratio, context window size, API token pricing per 1 million tokens, Elo ratings, category scores, and output generation speed in tokens per second.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
                  <th scope="col" className="py-3 px-3.5">Rank &amp; Model</th>
                  <th scope="col" className="py-3 px-3">
                    <button type="button" onClick={() => toggleSort('score')} className="inline-flex items-center gap-1 hover:text-slate-950">
                      Score <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th scope="col" className="py-3 px-3">
                    <button type="button" onClick={() => toggleSort('value')} className="inline-flex items-center gap-1 hover:text-slate-950">
                      Score/$ <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th scope="col" className="py-3 px-3">Context</th>
                  <th scope="col" className="py-3 px-3">
                    <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-1 hover:text-slate-950">
                      API Price (In / Out) <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th scope="col" className="py-3 px-3">
                    <button type="button" onClick={() => toggleSort('elo')} className="inline-flex items-center gap-1 hover:text-slate-950">
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
                    <button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex items-center gap-1 ml-auto hover:text-slate-950">
                      Speed (Tok/s) <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-sm">
                {rows.map(({ model: m, scorePerDollar }, idx) => (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-slate-50/50 hover:bg-emerald-50/40'}>
                    <th scope="row" className="py-3.5 px-3.5 font-normal text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-500">#{m.rank}</span>
                        <Link href={`/models/${m.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700 underline-offset-2 hover:underline">
                          {m.name}
                        </Link>
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                          {m.evidence}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        <Link href={`/providers/${m.providerSlug}`} className="hover:text-slate-900 underline-offset-2 hover:underline">
                          {m.provider}
                        </Link>{' '}
                        · {m.bestFor}
                      </div>
                    </th>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">{scorePerDollar.toFixed(1)}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-700">{m.contextWindow}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-900">
                      ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-700">{m.elo.toFixed(1)}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ag}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.co}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.re}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.mm}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.kn}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ml}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.if}</td>
                    <td className="py-3.5 px-2.5 font-mono text-xs text-slate-700">{m.ma}</td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-xs font-semibold text-emerald-700">
                      {m.tokPerSec} tok/s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {providers.map((p) => (
                <Link key={p.providerSlug} href={`/providers/${p.providerSlug}`} className="rounded bg-slate-100 px-2.5 py-1 font-medium text-slate-800 hover:bg-slate-200">
                  {p.providerName}
                </Link>
              ))}
            </div>
            <Link href="/compare" className="font-semibold text-emerald-700 hover:underline">
              Explore all 190 Head-to-Head Comparisons →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
