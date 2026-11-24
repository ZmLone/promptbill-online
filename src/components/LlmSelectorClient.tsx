'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_MODELS } from '../lib/catalog';
import { calculateModelCost, formatCurrency } from '../lib/pricingEngine';
import {
  Award,
  TrendingUp,
  Zap,
  SlidersHorizontal,
  ArrowRight,
  CheckSquare,
  Square,
  Scale,
  DollarSign,
} from 'lucide-react';

export type SelectorModel = (typeof ALL_MODELS)[number];
type TaskGoal = 'all' | 'coding' | 'reasoning' | 'classification' | 'fast';
type SortMode = 'best' | 'value' | 'price' | 'speed';
type BudgetPreset = 0 | 10_000 | 50_000 | 250_000;

interface LlmSelectorClientProps {
  models: readonly SelectorModel[];
}

function buildCanonicalCompareSlug(
  slugA: string,
  slugB: string,
  models: readonly SelectorModel[]
): string {
  const rankMap = new Map<string, number>();
  models.forEach((m) => {
    if (typeof m.rank === 'number' && Number.isFinite(m.rank)) {
      rankMap.set(m.slug, m.rank);
    }
  });
  const rankA = rankMap.get(slugA) ?? 999999;
  const rankB = rankMap.get(slugB) ?? 999999;
  if (rankA !== rankB) {
    return rankA < rankB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`;
  }
  return [slugA, slugB].sort()[0] === slugA
    ? `${slugA}-vs-${slugB}`
    : `${slugB}-vs-${slugA}`;
}

function compareNullableNum(a: number | null, b: number | null, desc = true): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return desc ? b - a : a - b;
}

export const LlmSelectorClient: React.FC<LlmSelectorClientProps> = ({ models }) => {
  const router = useRouter();
  const hasUserInteracted = useRef<boolean>(false);

  const [goal, setGoal] = useState<TaskGoal>('all');
  const [maxOutputPrice, setMaxOutputPrice] = useState<number>(40);
  const [minScore, setMinScore] = useState<number>(68);
  const [openWeightOnly, setOpenWeightOnly] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<SortMode>('best');
  const [monthlyCallsPreset, setMonthlyCallsPreset] = useState<BudgetPreset>(50_000);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const task = params.get('task') as TaskGoal | null;
    const maxPrice = params.get('maxPrice');
    const score = params.get('minScore');
    const openWeight = params.get('openWeight');
    const sort = params.get('sort') as SortMode | null;
    const budget = params.get('budget');

    let found = false;
    if (task && ['all', 'coding', 'reasoning', 'classification', 'fast'].includes(task)) {
      setGoal(task);
      found = true;
    }
    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      setMaxOutputPrice(Math.min(40, Math.max(1, Number(maxPrice))));
      found = true;
    }
    if (score && !Number.isNaN(Number(score))) {
      setMinScore(Math.min(92, Math.max(0, Number(score))));
      found = true;
    }
    if (openWeight === 'true') {
      setOpenWeightOnly(true);
      found = true;
    }
    if (sort && ['best', 'value', 'price', 'speed'].includes(sort)) {
      setSortMode(sort);
      found = true;
    }
    if (budget && [0, 10000, 50000, 250000].includes(Number(budget))) {
      setMonthlyCallsPreset(Number(budget) as BudgetPreset);
      found = true;
    }
    if (found) {
      hasUserInteracted.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasUserInteracted.current) return;

    const params = new URLSearchParams();
    if (goal !== 'all') params.set('task', goal);
    if (maxOutputPrice !== 40) params.set('maxPrice', String(maxOutputPrice));
    if (minScore !== 68) params.set('minScore', String(minScore));
    if (openWeightOnly) params.set('openWeight', 'true');
    if (sortMode !== 'best') params.set('sort', sortMode);
    if (monthlyCallsPreset !== 50_000) params.set('budget', String(monthlyCallsPreset));

    const qs = params.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [goal, maxOutputPrice, minScore, openWeightOnly, sortMode, monthlyCallsPreset]);

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (maxOutputPrice < 40) count += 1;
    if (minScore > 68) count += 1;
    if (openWeightOnly) count += 1;
    return count;
  }, [maxOutputPrice, minScore, openWeightOnly]);

  const enrichedModels = useMemo(() => {
    const callsPerDay = monthlyCallsPreset > 0 ? monthlyCallsPreset / 30 : 0;
    return models
      .filter((m) => {
        if (m.outputPer1M !== null && m.outputPer1M > maxOutputPrice) return false;
        if (m.score !== null && m.score < minScore) return false;
        if (openWeightOnly && m.license !== 'Open') return false;
        if (goal === 'coding') {
          return (
            (typeof m.co === 'number' && m.co >= 76) ||
            (m.bestFor ?? '').toLowerCase().includes('cod')
          );
        }
        if (goal === 'reasoning') {
          return (
            (typeof m.re === 'number' && m.re >= 78) ||
            (typeof m.ag === 'number' && m.ag >= 78)
          );
        }
        if (goal === 'classification') {
          return (
            (typeof m.outputPer1M === 'number' && m.outputPer1M <= 4.0) ||
            (m.bestFor ?? '').toLowerCase().includes('class')
          );
        }
        if (goal === 'fast') {
          return typeof m.tokPerSec === 'number' && m.tokPerSec >= 150;
        }
        return true;
      })
      .map((m) => {
        const calc = calculateModelCost(m, {
          inputTokensPerCall: 3500,
          outputTokensPerCall: 500,
          reasoningTokensPerCall: 0,
          callsPerDay,
          cacheHitPercent: 0,
          cacheWriteSharePercent: 0,
          batchPercent: 0,
          retriesPercent: 0,
        });
        return {
          model: m,
          scorePerDollar: calc.valueScore,
          estMonthlyCost: calc.hasPricingData ? calc.monthlyTotalCost : null,
        };
      });
  }, [models, goal, maxOutputPrice, minScore, openWeightOnly, monthlyCallsPreset]);

  const sortedResults = useMemo(() => {
    const arr = [...enrichedModels];
    arr.sort((a, b) => {
      if (sortMode === 'value') return compareNullableNum(a.scorePerDollar, b.scorePerDollar, true);
      if (sortMode === 'price') return compareNullableNum(a.model.outputPer1M, b.model.outputPer1M, false);
      if (sortMode === 'speed') return compareNullableNum(a.model.tokPerSec, b.model.tokPerSec, true);
      if (goal === 'coding') {
        const cmpCo = compareNullableNum(a.model.co, b.model.co, true);
        return cmpCo !== 0 ? cmpCo : compareNullableNum(a.model.score, b.model.score, true);
      }
      if (goal === 'reasoning') {
        const cmpRe = compareNullableNum(a.model.re, b.model.re, true);
        return cmpRe !== 0 ? cmpRe : compareNullableNum(a.model.score, b.model.score, true);
      }
      if (goal === 'classification') return compareNullableNum(a.scorePerDollar, b.scorePerDollar, true);
      if (goal === 'fast') return compareNullableNum(a.model.tokPerSec, b.model.tokPerSec, true);
      return compareNullableNum(a.model.score, b.model.score, true);
    });
    return arr;
  }, [enrichedModels, sortMode, goal]);

  const top3Spotlight = useMemo(() => {
    if (enrichedModels.length === 0) return [];
    const byQuality = [...enrichedModels].sort((a, b) =>
      compareNullableNum(a.model.score, b.model.score, true)
    )[0];
    const byValue = [...enrichedModels].sort((a, b) =>
      compareNullableNum(a.scorePerDollar, b.scorePerDollar, true)
    )[0];
    const bySpeed = [...enrichedModels].sort((a, b) =>
      compareNullableNum(a.model.tokPerSec, b.model.tokPerSec, true)
    )[0];

    return [
      {
        badge: 'Highest Listed Score',
        icon: Award,
        accent: 'border-emerald-300 bg-emerald-50/70 text-emerald-950',
        badgeClass: 'bg-emerald-800 text-white',
        item: byQuality,
        metricNote:
          byQuality.model.score !== null
            ? `Score ${byQuality.model.score.toFixed(1)} (${byQuality.model.benchmarkProvenance.status})`
            : 'Score: N/A',
      },
      {
        badge: 'Highest Score/$ Ratio',
        icon: TrendingUp,
        accent: 'border-slate-300 bg-slate-50/80 text-slate-900',
        badgeClass: 'bg-slate-900 text-white',
        item: byValue,
        metricNote:
          byValue.scorePerDollar !== null
            ? `${byValue.scorePerDollar.toFixed(1)} Score/$`
            : 'Score/$: N/A',
      },
      {
        badge: 'Fastest Listed Speed',
        icon: Zap,
        accent: 'border-sky-200 bg-sky-50/60 text-slate-900',
        badgeClass: 'bg-sky-800 text-white',
        item: bySpeed,
        metricNote:
          bySpeed.model.tokPerSec !== null
            ? `${bySpeed.model.tokPerSec} tok/s (${bySpeed.model.speedProvenance.status})`
            : 'Speed: N/A',
      },
    ];
  }, [enrichedModels]);

  const toggleCompareSelection = (slug: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 2) return [prev[1], slug];
      return [...prev, slug];
    });
  };

  const handleJumpToCompare = () => {
    if (selectedForCompare.length !== 2) return;
    const canonicalSlug = buildCanonicalCompareSlug(
      selectedForCompare[0],
      selectedForCompare[1],
      models
    );
    router.push(`/compare/${canonicalSlug}`);
  };

  const WORKLOAD_TABS: { id: TaskGoal; label: string }[] = [
    { id: 'all', label: 'All Models' },
    { id: 'coding', label: 'Coding' },
    { id: 'reasoning', label: 'Reasoning & Agents' },
    { id: 'classification', label: 'Classification & RAG' },
    { id: 'fast', label: 'Fast Speed (150+ Tok/s)' },
  ];

  return (
    <section
      aria-label="Interactive LLM Filter and Budget Tool"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5"
    >
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs">
        {WORKLOAD_TABS.map((tab) => {
          const active = goal === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                hasUserInteracted.current = true;
                setGoal(tab.id);
              }}
              className={`shrink-0 min-h-[44px] rounded-lg px-3.5 py-2 font-semibold transition-colors ${
                active
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={mobileFiltersOpen}
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="md:hidden inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 font-semibold text-slate-900"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
            <span>Filters ({activeAdvancedFilterCount})</span>
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <span className="hidden sm:inline-flex items-center gap-1 pl-2 pr-1 font-semibold text-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-emerald-800" />
              Est. Monthly:
            </span>
            {(
              [
                { val: 0, label: 'Off' },
                { val: 10_000, label: '10k calls' },
                { val: 50_000, label: '50k calls' },
                { val: 250_000, label: '250k calls' },
              ] as { val: BudgetPreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => {
                  hasUserInteracted.current = true;
                  setMonthlyCallsPreset(preset.val);
                }}
                className={`min-h-[36px] rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  monthlyCallsPreset === preset.val
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <label
          htmlFor="selector-sort-by"
          className="inline-flex items-center gap-2 font-semibold text-slate-800"
        >
          <span>Sort by:</span>
          <select
            id="selector-sort-by"
            value={sortMode}
            onChange={(e) => {
              hasUserInteracted.current = true;
              setSortMode(e.target.value as SortMode);
            }}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
          >
            <option value="best">Best Match</option>
            <option value="value">Score/$ Value</option>
            <option value="price">Lowest Price</option>
            <option value="speed">Fastest Tok/s</option>
          </select>
        </label>
      </div>

      <div
        className={`${
          mobileFiltersOpen ? 'grid' : 'hidden'
        } md:grid grid-cols-1 md:grid-cols-3 gap-4 text-xs`}
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
          <div className="flex justify-between font-medium text-slate-800">
            <span>Max Output Price</span>
            <span className="font-mono font-bold text-slate-900">
              ${maxOutputPrice.toFixed(2)} / 1M
            </span>
          </div>
          <input
            type="range"
            aria-label="Maximum output price per 1M tokens"
            min={1}
            max={40}
            step={0.5}
            value={maxOutputPrice}
            onChange={(e) => {
              hasUserInteracted.current = true;
              setMaxOutputPrice(Number(e.target.value));
            }}
            className="h-6 w-full accent-emerald-800 cursor-pointer"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
          <div className="flex justify-between font-medium text-slate-800">
            <span>Min Benchmark Score</span>
            <span className="font-mono font-bold text-slate-900">{minScore}+</span>
          </div>
          <input
            type="range"
            aria-label="Minimum benchmark score"
            min={65}
            max={92}
            step={1}
            value={minScore}
            onChange={(e) => {
              hasUserInteracted.current = true;
              setMinScore(Number(e.target.value));
            }}
            className="h-6 w-full accent-emerald-800 cursor-pointer"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">Open-Weight Only</div>
            <div className="text-[11px] text-slate-700">Filter to open-weight licenses</div>
          </div>
          <button
            type="button"
            aria-pressed={openWeightOnly}
            onClick={() => {
              hasUserInteracted.current = true;
              setOpenWeightOnly((prev) => !prev);
            }}
            className={`min-h-[44px] min-w-[60px] rounded-lg px-3.5 py-2 font-semibold ${
              openWeightOnly
                ? 'bg-emerald-800 text-white'
                : 'border border-slate-300 bg-white text-slate-800'
            }`}
          >
            {openWeightOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {top3Spotlight.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Top Picks for Current Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3Spotlight.map((spot) => {
              const Icon = spot.icon;
              const m = spot.item.model;
              return (
                <div
                  key={spot.badge}
                  className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${spot.accent}`}
                >
                  <div className="space-y-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${spot.badgeClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{spot.badge}</span>
                    </span>
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-bold text-base text-slate-950 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {m.provider}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-slate-800">
                      {spot.metricNote}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                    {monthlyCallsPreset > 0 && spot.item.estMonthlyCost !== null ? (
                      <span className="font-mono font-bold text-emerald-900">
                        ~{formatCurrency(spot.item.estMonthlyCost)}/mo (
                        {(monthlyCallsPreset / 1000).toFixed(0)}k calls)
                      </span>
                    ) : m.inputPer1M !== null && m.outputPer1M !== null ? (
                      <span className="font-mono text-slate-700">
                        ${m.inputPer1M.toFixed(2)}/${m.outputPer1M.toFixed(2)} per 1M
                      </span>
                    ) : (
                      <span className="font-mono text-slate-700">Price: N/A</span>
                    )}
                    <Link
                      href={`/models/${m.slug}`}
                      className="font-semibold text-emerald-900 hover:underline"
                    >
                      Details -&gt;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
        <span className="font-medium text-slate-700">
          Showing <strong>{sortedResults.length}</strong> models · Select any 2 models to compare
        </span>

        <div className="flex items-center gap-2">
          {selectedForCompare.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear ({selectedForCompare.length})
            </button>
          )}
          <button
            type="button"
            disabled={selectedForCompare.length !== 2}
            onClick={handleJumpToCompare}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 font-semibold text-white hover:bg-emerald-900 disabled:opacity-45"
          >
            <Scale className="w-4 h-4" />
            <span>
              {selectedForCompare.length === 2
                ? 'Compare Selected (2/2)'
                : `Select ${2 - selectedForCompare.length} More to Compare`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {sortedResults.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700 space-y-3">
          <p>No models matched those exact filter thresholds.</p>
          <button
            type="button"
            onClick={() => {
              setGoal('all');
              setMaxOutputPrice(40);
              setMinScore(68);
              setOpenWeightOnly(false);
            }}
            className="min-h-[44px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResults.map(({ model: m, scorePerDollar, estMonthlyCost }) => {
            const isChecked = selectedForCompare.includes(m.slug);
            return (
              <article
                key={m.id}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                  isChecked
                    ? 'border-emerald-700 bg-emerald-50/35'
                    : 'border-slate-200 bg-white hover:border-emerald-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-bold text-base text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <div className="text-xs text-slate-700 mt-0.5">
                        {m.provider} · License: {m.license ?? 'N/A'} · Context:{' '}
                        {m.contextWindow ?? 'N/A'} · Speed:{' '}
                        {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'N/A'}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-pressed={isChecked}
                      aria-label={`Select ${m.name} for comparison`}
                      onClick={() => toggleCompareSelection(m.slug)}
                      className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-800" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-900">
                      {m.score !== null ? `Score ${m.score.toFixed(1)}` : 'Score N/A'}
                    </span>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-semibold text-emerald-900">
                      {scorePerDollar !== null
                        ? `${scorePerDollar.toFixed(1)} Score/$`
                        : 'Score/$ N/A'}
                    </span>
                  </div>

                  {m.bestFor && <p className="text-xs text-slate-700">{m.bestFor}</p>}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="font-mono">
                    <div className="font-semibold text-slate-900">
                      {m.inputPer1M !== null && m.outputPer1M !== null
                        ? `$${m.inputPer1M.toFixed(2)} / $${m.outputPer1M.toFixed(2)} per 1M`
                        : 'Price: N/A'}
                    </div>
                    {monthlyCallsPreset > 0 && estMonthlyCost !== null && (
                      <div className="text-[11px] font-bold text-emerald-800">
                        Est. {formatCurrency(estMonthlyCost)}/mo (
                        {(monthlyCallsPreset / 1000).toFixed(0)}k calls)
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/models/${m.slug}`}
                    className="inline-flex min-h-[38px] items-center font-semibold text-emerald-800 hover:underline shrink-0"
                  >
                    Calculator -&gt;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
