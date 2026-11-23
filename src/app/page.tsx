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
import {
  Search,
  ArrowUpDown,
  Calculator,
  Layers,
  Server,
  AlertTriangle,
} from 'lucide-react';

const pricingModels = modelsJson as LLMModel[];

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Interactive billing & cost calculator state
  const [selectedCalcModelId, setSelectedCalcModelId] = useState<string>('claude-sonnet-5-5');
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

  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Billing Calculator"
      subtitle="promptbill.online / · Prompt Caching, Batch API, Context Tiers & Multi-Host Comparison"
    >
      {/* Interactive Cost & Billing Nuances Section (above the fold on /) */}
      <section aria-labelledby="billing-calculator-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-800" />
              <h2 id="billing-calculator-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                API Cost, Prompt Caching, Batch &amp; Hosting Calculator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Estimate real-world API spend with cache read vs. write rates, 50% Batch API pricing, long-context thresholds, and side-by-side hosting/router rates.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-right shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
              Est. 30-Day Bill
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-900 tabular-nums">
              {formatCurrency(calcBreakdown.monthlyTotalCost)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label htmlFor="home-calc-model" className="space-y-1.5 sm:col-span-2">
                <span className="font-semibold text-slate-800 block">Model</span>
                <select
                  id="home-calc-model"
                  value={selectedCalcModelId}
                  onChange={(e) => setSelectedCalcModelId(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {pricingModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider}) — ${m.inputPer1M.toFixed(2)}/${m.outputPer1M.toFixed(2)} per 1M
                    </option>
                  ))}
                </select>
              </label>

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
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
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
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
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
                  className="w-full accent-emerald-800 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-slate-700">
                  Read ${calcBreakdown.cacheReadRatePer1M}/1M · Write ${calcBreakdown.cacheWriteRatePer1M}/1M
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
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
                  className="w-full accent-emerald-800 cursor-pointer"
                />
                <div className="text-[11px] text-slate-700">
                  Share of non-hit input populating prompt cache.
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
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
                  className="w-full accent-emerald-800 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCalcInputs((prev) => ({ ...prev, batchPercent: prev.batchPercent === 100 ? 0 : 100 }))
                  }
                  className="min-h-[32px] w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {calcInputs.batchPercent === 100 ? 'Clear 100% Batch Mode' : 'Apply 100% Batch API (50% Off)'}
                </button>
              </div>
            </div>

            {/* Context-Tier Pricing Indicator */}
            <div
              className={`rounded-lg border px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 ${
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

          {/* Hosting & Router Side-by-Side Comparison */}
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
      </section>

      {/* Searchable & Sortable LLM Leaderboard */}
      <section aria-labelledby="leaderboard-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider..."
              aria-label="Search models"
              className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              aria-label="Filter by evidence"
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
            >
              <option value="All">All Evidence</option>
              <option value="Supported">Supported</option>
              <option value="Estimated">Estimated</option>
            </select>
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              aria-label="Filter by license"
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
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
              className="md:hidden min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 font-medium"
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
                    <span className="font-mono text-xs font-bold text-slate-700">#{m.rank}</span>
                    <Link href={`/models/${m.slug}`} className="inline-flex min-h-[36px] items-center text-base font-bold text-slate-900 underline-offset-2 hover:underline">
                      {m.name}
                    </Link>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                      {m.evidence}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                    <Link href={`/providers/${m.providerSlug}`} className="inline-flex min-h-[32px] items-center underline">
                      {m.provider}
                    </Link>
                    <span>· {m.license} · {m.contextWindow} context</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-lg font-bold text-slate-900">{m.score.toFixed(1)}</div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-700">Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-center font-mono text-xs">
                <div>
                  <div className="text-[11px] font-sans text-slate-700">In / Out ($/1M)</div>
                  <div className="font-bold text-slate-900 mt-0.5">${m.inputPer1M.toFixed(2)}/${m.outputPer1M.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-700">Speed</div>
                  <div className="font-bold text-emerald-800 mt-0.5">{m.tokPerSec} tok/s</div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-700">Value (Score/$)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{scorePerDollar.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 font-mono text-xs text-slate-800">
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">AG {m.ag}</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">CO {m.co}</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">RE {m.re}</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">MM {m.mm}</span>
                <span className="rounded bg-white border border-slate-200 px-2 py-0.5">Elo {m.elo.toFixed(0)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-slate-700 line-clamp-1">{m.bestFor}</span>
                <Link href={`/models/${m.slug}`} className="inline-flex min-h-[36px] shrink-0 items-center font-semibold text-emerald-800 hover:underline ml-2">
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
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-3.5">Rank &amp; Model</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('score')} className="inline-flex min-h-[36px] items-center gap-1 px-1 hover:text-slate-950">
                    Score <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('value')} className="inline-flex min-h-[36px] items-center gap-1 px-1 hover:text-slate-950">
                    Score/$ <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">Context</th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('price')} className="inline-flex min-h-[36px] items-center gap-1 px-1 hover:text-slate-950">
                    API Price (In / Out) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button type="button" onClick={() => toggleSort('elo')} className="inline-flex min-h-[36px] items-center gap-1 px-1 hover:text-slate-950">
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
                  <button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex min-h-[36px] items-center gap-1 ml-auto px-1 hover:text-slate-950">
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
                      <Link href={`/models/${m.slug}`} className="inline-flex min-h-[36px] items-center font-semibold text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-900">
                        {m.evidence}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-1.5">
                      <Link href={`/providers/${m.providerSlug}`} className="inline-flex min-h-[32px] items-center hover:text-slate-950 underline-offset-2 hover:underline">
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
              <Link key={p.providerSlug} href={`/providers/${p.providerSlug}`} className="inline-flex min-h-[36px] items-center rounded bg-slate-100 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-200">
                {p.providerName}
              </Link>
            ))}
          </div>
          <Link href="/compare" className="inline-flex min-h-[36px] items-center font-semibold text-emerald-800 hover:underline">
            Explore all 190 Head-to-Head Comparisons →
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
