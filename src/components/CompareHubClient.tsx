'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_MODELS, getAutoComparisonPairs } from '../lib/catalog';
import { ArrowRight, Flame, Code2, Sparkles, Filter } from 'lucide-react';

export type CatalogModelItem = (typeof ALL_MODELS)[number];
export type ComparisonPairItem = ReturnType<typeof getAutoComparisonPairs>[number];

interface CompareHubClientProps {
  models: readonly CatalogModelItem[];
  pairs: readonly ComparisonPairItem[];
}

function buildCanonicalPairSlug(slugA: string, slugB: string, models: readonly CatalogModelItem[]): string {
  const rankMap = new Map<string, number>();
  models.forEach((m) => rankMap.set(m.slug, m.rank));

  const rankA = rankMap.get(slugA) ?? 999;
  const rankB = rankMap.get(slugB) ?? 999;

  if (rankA !== rankB) {
    return rankA < rankB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`;
  }
  return [slugA, slugB].sort()[0] === slugA ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`;
}

export const CompareHubClient: React.FC<CompareHubClientProps> = ({ models, pairs }) => {
  const router = useRouter();

  const defaultA =
    models.find((m) => m.slug === 'claude-sonnet-5-5')?.slug || models[0]?.slug || '';
  const defaultB =
    models.find((m) => m.slug === 'deepseek-v4-1-flash')?.slug || models[1]?.slug || '';

  const [modelASlug, setModelASlug] = useState<string>(defaultA);
  const [modelBSlug, setModelBSlug] = useState<string>(defaultB);
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [directorySearch, setDirectorySearch] = useState<string>('');

  const handleCompareNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelASlug || !modelBSlug || modelASlug === modelBSlug) return;
    const canonicalSlug = buildCanonicalPairSlug(modelASlug, modelBSlug, models);
    router.push(`/compare/${canonicalSlug}`);
  };

  // Curated intent-grouped matchups
  const curatedGroups = useMemo(() => {
    const findPair = (a: string, b: string) => {
      const targetCanonical = buildCanonicalPairSlug(a, b, models);
      return (
        pairs.find((p) => p.slug === targetCanonical) ||
        pairs.find((p) => (p.modelA.slug === a && p.modelB.slug === b) || (p.modelA.slug === b && p.modelB.slug === a))
      );
    };

    const flagshipRaw = [
      findPair('claude-fable-5-2', 'gemini-4-neon'),
      findPair('gpt-6-2-astra', 'claude-fable-5-2'),
      findPair('gpt-6-2-astra', 'gemini-4-neon'),
      findPair('claude-opus-5-5', 'gpt-6-2-sol'),
    ].filter((x): x is ComparisonPairItem => Boolean(x));

    const budgetCodingRaw = [
      findPair('deepseek-v4-1-flash', 'qwen-3-7-flash'),
      findPair('claude-sonnet-5-5', 'gemini-4-carbon'),
      findPair('deepseek-v4-1-flash', 'claude-sonnet-5-5'),
      findPair('kimi-k2-7-code', 'qwen-3-7-flash'),
    ].filter((x): x is ComparisonPairItem => Boolean(x));

    return {
      flagship: flagshipRaw.slice(0, 4),
      budgetCoding: budgetCodingRaw.slice(0, 4),
    };
  }, [models, pairs]);

  const providerPills = ['All', 'Anthropic', 'Google', 'OpenAI', 'DeepSeek', 'Qwen'];

  // Group all 190 pairs by primary model (modelA) while keeping every <a> in initial HTML
  const groupedByPrimaryModel = useMemo(() => {
    const map = new Map<string, { primaryModel: CatalogModelItem; items: ComparisonPairItem[] }>();
    for (const pair of pairs) {
      const key = pair.modelA.slug;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(pair);
      } else {
        map.set(key, { primaryModel: pair.modelA, items: [pair] });
      }
    }
    return Array.from(map.values());
  }, [pairs]);

  const isPairVisibleByFilter = (pair: ComparisonPairItem): boolean => {
    const q = directorySearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      pair.modelA.name.toLowerCase().includes(q) ||
      pair.modelB.name.toLowerCase().includes(q) ||
      pair.modelA.provider.toLowerCase().includes(q) ||
      pair.modelB.provider.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (providerFilter === 'All') return true;

    const pLower = providerFilter.toLowerCase();
    return (
      pair.modelA.provider.toLowerCase().includes(pLower) ||
      pair.modelB.provider.toLowerCase().includes(pLower) ||
      pair.modelA.name.toLowerCase().includes(pLower) ||
      pair.modelB.name.toLowerCase().includes(pLower)
    );
  };

  const renderMatchupCard = (pair: ComparisonPairItem) => {
    const canonicalSlug = buildCanonicalPairSlug(pair.modelA.slug, pair.modelB.slug, models);
    return (
      <Link
        key={pair.slug}
        href={`/compare/${canonicalSlug}`}
        className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors flex flex-col justify-between gap-2.5"
      >
        <div className="space-y-1">
          <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-900">
            {pair.modelA.name} vs. {pair.modelB.name}
          </div>
          <div className="font-mono text-xs font-semibold text-emerald-800">
            Score {pair.modelA.score.toFixed(1)} vs {pair.modelB.score.toFixed(1)}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-700">
          <span>
            ${pair.modelA.inputPer1M}/${pair.modelA.outputPer1M} ({pair.modelA.tokPerSec} tok/s)
          </span>
          <span>
            ${pair.modelB.inputPer1M}/${pair.modelB.outputPer1M} ({pair.modelB.tokPerSec} tok/s)
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Sticky Instant Matchup Picker Right Under the Editorial Intro */}
      <div className="sticky top-16 z-20 rounded-xl border border-slate-300 bg-white/95 backdrop-blur p-4 shadow-sm">
        <form onSubmit={handleCompareNow} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <label className="md:col-span-5 space-y-1 text-xs">
            <span className="font-semibold text-slate-800 block">Select Model A</span>
            <select
              value={modelASlug}
              onChange={(e) => setModelASlug(e.target.value)}
              aria-label="Select Model A"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {models.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name} ({m.provider} · Score {m.score.toFixed(1)})
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-5 space-y-1 text-xs">
            <span className="font-semibold text-slate-800 block">Select Model B</span>
            <select
              value={modelBSlug}
              onChange={(e) => setModelBSlug(e.target.value)}
              aria-label="Select Model B"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {models.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name} ({m.provider} · Score {m.score.toFixed(1)})
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={modelASlug === modelBSlug}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              <span>Compare Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 2. Curated "Popular & Trending Matchups" Grouped by Intent */}
      <section aria-labelledby="curated-matchups-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-800" />
          <h2 id="curated-matchups-heading" className="text-lg font-bold text-slate-900">
            Popular &amp; Trending Matchups
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Flame className="w-4 h-4 text-emerald-800" />
            <span>Flagship Showdowns</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {curatedGroups.flagship.map(renderMatchupCard)}
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Code2 className="w-4 h-4 text-emerald-800" />
            <span>Best Budget Coding</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {curatedGroups.budgetCoding.map(renderMatchupCard)}
          </div>
        </div>
      </section>

      {/* 3. Full Directory (190 Matchups) — All Links Rendered in Initial HTML, Grouped by Model & Filterable */}
      <section aria-labelledby="all-matchups-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="all-matchups-heading" className="text-lg font-bold text-slate-900">
              All Head-to-Head Model Matchups ({pairs.length})
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Grouped by primary model with composite scores, pricing, and speed on every card.
            </p>
          </div>

          <input
            type="text"
            value={directorySearch}
            onChange={(e) => setDirectorySearch(e.target.value)}
            placeholder="Filter matchups by model name..."
            aria-label="Filter matchups by model name"
            className="min-h-[42px] w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
          />
        </div>

        {/* Provider Quick-Filter Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Provider:
          </span>
          {providerPills.map((pill) => {
            const active = providerFilter === pill;
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setProviderFilter(pill)}
                className={`min-h-[40px] shrink-0 rounded-lg border px-3.5 py-2 font-semibold transition-colors ${
                  active
                    ? 'border-emerald-800 bg-emerald-800 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Collapsible <details> Groups by Primary Model: all 190 <a> tags remain in initial SSR/HTML */}
        <div className="space-y-3">
          {groupedByPrimaryModel.map(({ primaryModel, items }, groupIndex) => {
            const hasMatchingItems = items.some(isPairVisibleByFilter);
            const shouldForceOpen =
              providerFilter !== 'All' || directorySearch.trim().length > 0 || groupIndex < 2;

            return (
              <details
                key={primaryModel.slug}
                open={shouldForceOpen ? true : undefined}
                className={`${hasMatchingItems ? 'block' : 'hidden'} rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 sm:p-4`}
              >
                <summary className="cursor-pointer min-h-[36px] flex items-center justify-between gap-2 text-sm sm:text-base font-bold text-slate-900">
                  <span>
                    All {primaryModel.name} Comparisons ({items.length})
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    Score {primaryModel.score.toFixed(1)} · ${primaryModel.inputPer1M}/${primaryModel.outputPer1M}
                  </span>
                </summary>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((pair) => {
                    const visible = isPairVisibleByFilter(pair);
                    return (
                      <div key={pair.slug} className={visible ? 'block' : 'hidden'}>
                        {renderMatchupCard(pair)}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
};
