'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function fmtPrice(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v) ? `$${v.toFixed(2)}` : 'N/A';
}

function fmtScore(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : 'N/A';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DynamicCompareClient({
  models,
  initialSlugs,
  initialA,
  initialB,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models: any[];
  initialSlugs: string[];
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();

  const sortedCatalog = useMemo(() => {
    return [...models].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [models]);

  const [modelASlug, setModelASlug] = useState<string>(() => {
    if (initialA && models.some((m) => String(m.slug) === initialA)) return initialA;
    if (initialSlugs[0] && models.some((m) => String(m.slug) === initialSlugs[0])) return initialSlugs[0];
    return String(sortedCatalog[0]?.slug || models[0]?.slug || '');
  });

  const [modelBSlug, setModelBSlug] = useState<string>(() => {
    if (initialB && models.some((m) => String(m.slug) === initialB)) return initialB;
    if (initialSlugs[1] && models.some((m) => String(m.slug) === initialSlugs[1])) return initialSlugs[1];
    const second = sortedCatalog.find((m) => String(m.slug) !== (initialA || initialSlugs[0] || sortedCatalog[0]?.slug));
    return String(second?.slug || sortedCatalog[1]?.slug || models[1]?.slug || models[0]?.slug || '');
  });

  const [extraSlugs, setExtraSlugs] = useState<string[]>(() => {
    return initialSlugs.slice(2, 6);
  });

  const [pickerSlug, setPickerSlug] = useState<string>(() => {
    const unused = sortedCatalog.find(
      (m) => String(m.slug) !== modelASlug && String(m.slug) !== modelBSlug
    );
    return String(unused?.slug || sortedCatalog[0]?.slug || '');
  });

  const [providerTab, setProviderTab] = useState<string>('ALL');

  useEffect(() => {
    if (initialA && models.some((m) => String(m.slug) === initialA)) {
      setModelASlug(initialA);
    } else if (initialSlugs[0] && models.some((m) => String(m.slug) === initialSlugs[0])) {
      setModelASlug(initialSlugs[0]);
    }

    if (initialB && models.some((m) => String(m.slug) === initialB)) {
      setModelBSlug(initialB);
    } else if (initialSlugs[1] && models.some((m) => String(m.slug) === initialSlugs[1])) {
      setModelBSlug(initialSlugs[1]);
    }

    if (initialSlugs.length > 2) {
      setExtraSlugs(initialSlugs.slice(2, 6));
    }
  }, [initialA, initialB, initialSlugs, models]);

  const activeSlugs = useMemo(() => {
    return Array.from(new Set([modelASlug, modelBSlug, ...extraSlugs].filter(Boolean)));
  }, [modelASlug, modelBSlug, extraSlugs]);

  const comparedModels = useMemo(() => {
    return activeSlugs
      .map((slug) => models.find((m) => String(m.slug) === slug))
      .filter(Boolean);
  }, [activeSlugs, models]);

  const modelA = useMemo(
    () => models.find((m) => String(m.slug) === modelASlug) || comparedModels[0],
    [models, modelASlug, comparedModels]
  );

  const modelB = useMemo(
    () => models.find((m) => String(m.slug) === modelBSlug) || comparedModels[1],
    [models, modelBSlug, comparedModels]
  );

  function handleCompareNow(e: React.FormEvent) {
    e.preventDefault();
    const list = Array.from(new Set([modelASlug, modelBSlug, ...extraSlugs].filter(Boolean)));
    const params = new URLSearchParams();
    params.set('models', list.join(','));
    if (modelASlug) params.set('a', modelASlug);
    if (modelBSlug) params.set('b', modelBSlug);
    router.push(`/compare?${params.toString()}`);
  }

  function addExtraModel(slug: string) {
    if (!slug || slug === modelASlug || slug === modelBSlug) return;
    setExtraSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev.slice(-3), slug];
    });
  }

  function removeExtraModel(slug: string) {
    setExtraSlugs((prev) => prev.filter((s) => s !== slug));
  }

  // Popular & Trending Matchups (pairs of top models)
  const popularMatchups = useMemo(() => {
    const top = sortedCatalog.slice(0, 8);
    const pairs: Array<{ a: typeof top[number]; b: typeof top[number] }> = [];
    for (let i = 0; i < top.length && pairs.length < 6; i++) {
      for (let j = i + 1; j < top.length && pairs.length < 6; j++) {
        pairs.push({ a: top[i], b: top[j] });
      }
    }
    return pairs;
  }, [sortedCatalog]);

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of sortedCatalog) {
      if (m.provider) set.add(String(m.provider));
    }
    return Array.from(set);
  }, [sortedCatalog]);

  // Head-to-Head matchup links grouped by provider
  const groupedMatchups = useMemo(() => {
    const filteredModels =
      providerTab === 'ALL'
        ? sortedCatalog
        : sortedCatalog.filter((m) => String(m.provider) === providerTab);

    return filteredModels.slice(0, 12).map((primary) => {
      const opponents = sortedCatalog
        .filter((other) => String(other.slug) !== String(primary.slug))
        .slice(0, 4);
      return {
        primary,
        opponents,
      };
    });
  }, [sortedCatalog, providerTab]);

  const bestScoreVal = useMemo(() => {
    const nums = comparedModels
      .map((m) => (typeof m.score === 'number' ? m.score : -Infinity))
      .filter((n) => Number.isFinite(n));
    return nums.length > 0 ? Math.max(...nums) : null;
  }, [comparedModels]);

  const bestValueVal = useMemo(() => {
    const nums = comparedModels
      .map((m) =>
        typeof m.score === 'number' && typeof m.outputPer1M === 'number' && m.outputPer1M > 0
          ? m.score / m.outputPer1M
          : -Infinity
      )
      .filter((n) => Number.isFinite(n));
    return nums.length > 0 ? Math.max(...nums) : null;
  }, [comparedModels]);

  const bestSpeedVal = useMemo(() => {
    const nums = comparedModels
      .map((m) => (typeof m.tokPerSec === 'number' ? m.tokPerSec : -Infinity))
      .filter((n) => Number.isFinite(n));
    return nums.length > 0 ? Math.max(...nums) : null;
  }, [comparedModels]);

  const lowestOutputPrice = useMemo(() => {
    const nums = comparedModels
      .map((m) => (typeof m.outputPer1M === 'number' ? m.outputPer1M : Infinity))
      .filter((n) => Number.isFinite(n));
    return nums.length > 0 ? Math.min(...nums) : null;
  }, [comparedModels]);

  return (
    <section className="space-y-10 pb-16" aria-label="Head-to-Head and Multi-Model LLM Comparison">
      {/* 1. Classic Model A vs Model B Selector + Compare Now */}
      <form
        onSubmit={handleCompareNow}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Select Model A &amp; Model B
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare any two models head-to-head—or add extra models for a multi-column breakdown.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="text-xs font-semibold text-emerald-800 hover:underline w-fit"
          >
            ← Back to Leaderboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="pb-select-model-a" className="block text-xs font-bold text-slate-700">
              Select Model A
            </label>
            <select
              id="pb-select-model-a"
              value={modelASlug}
              onChange={(e) => setModelASlug(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900"
            >
              {sortedCatalog.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} ({m.provider} · Score {fmtScore(m.score)})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="pb-select-model-b" className="block text-xs font-bold text-slate-700">
              Select Model B
            </label>
            <select
              id="pb-select-model-b"
              value={modelBSlug}
              onChange={(e) => setModelBSlug(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900"
            >
              {sortedCatalog.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} ({m.provider} · Score {fmtScore(m.score)})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Compare Now
            </button>
          </div>
        </div>

        {/* Optional Extra Models Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500">Additional models:</span>
            {extraSlugs.map((slug) => {
              const found = models.find((m) => String(m.slug) === slug);
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-950 ring-1 ring-emerald-200"
                >
                  <span>{found?.name || slug}</span>
                  <button
                    type="button"
                    onClick={() => removeExtraModel(slug)}
                    aria-label={`Remove ${found?.name || slug}`}
                    className="text-emerald-700 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {extraSlugs.length === 0 ? (
              <span className="text-slate-400">None added (2-model A vs B view)</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pickerSlug}
              onChange={(e) => setPickerSlug(e.target.value)}
              aria-label="Add another model to compare"
              className="min-h-[36px] rounded-xl border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-800"
            >
              {sortedCatalog.map((m) => (
                <option key={m.slug} value={m.slug}>
                  + {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addExtraModel(pickerSlug)}
              className="min-h-[36px] rounded-xl bg-slate-900 px-3.5 py-1 font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </form>

      {/* 2. Side-by-Side Comparison Table */}
      {comparedModels.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-5 px-6 w-48">Metric</th>
                {comparedModels.map((m, idx) => (
                  <th key={m.slug} className="py-5 px-6 min-w-[210px]">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                        {idx === 0 ? 'A' : idx === 1 ? 'B' : `#${idx + 1}`}
                      </span>
                      <Link
                        href={`/models/${m.slug}`}
                        className="text-sm font-extrabold normal-case tracking-normal text-slate-900 hover:text-emerald-800"
                      >
                        {m.name}
                      </Link>
                    </div>
                    <div className="text-[11px] font-semibold normal-case text-slate-500 mt-0.5">
                      {m.provider}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm">
              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">Benchmark Score</td>
                {comparedModels.map((m) => {
                  const isBest =
                    bestScoreVal !== null &&
                    typeof m.score === 'number' &&
                    m.score === bestScoreVal;
                  return (
                    <td
                      key={m.slug}
                      className={`py-5 px-6 font-mono font-extrabold ${
                        isBest ? 'bg-emerald-50/70 text-emerald-900' : 'text-slate-900'
                      }`}
                    >
                      {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}{' '}
                      {isBest ? (
                        <span className="ml-2 rounded-full bg-emerald-800 px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                          Top Score
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">Value (Score/$)</td>
                {comparedModels.map((m) => {
                  const val =
                    typeof m.score === 'number' && typeof m.outputPer1M === 'number' && m.outputPer1M > 0
                      ? Number((m.score / m.outputPer1M).toFixed(1))
                      : null;
                  const isBest =
                    bestValueVal !== null &&
                    val !== null &&
                    Math.abs(val - bestValueVal) < 0.05;
                  return (
                    <td
                      key={m.slug}
                      className={`py-5 px-6 font-mono font-bold ${
                        isBest ? 'bg-teal-50/70 text-teal-900' : 'text-slate-800'
                      }`}
                    >
                      {val !== null ? `${val.toFixed(1)} pts/$` : '—'}{' '}
                      {isBest ? (
                        <span className="ml-2 rounded-full bg-teal-700 px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                          Best Value
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">API Price (In / Out / 1M)</td>
                {comparedModels.map((m) => {
                  const isCheapestOut =
                    lowestOutputPrice !== null &&
                    typeof m.outputPer1M === 'number' &&
                    m.outputPer1M === lowestOutputPrice;
                  return (
                    <td
                      key={m.slug}
                      className={`py-5 px-6 font-mono font-bold ${
                        isCheapestOut ? 'bg-emerald-50/50 text-emerald-900' : 'text-slate-900'
                      }`}
                    >
                      {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">Throughput Speed</td>
                {comparedModels.map((m) => {
                  const isFastest =
                    bestSpeedVal !== null &&
                    typeof m.tokPerSec === 'number' &&
                    m.tokPerSec === bestSpeedVal;
                  return (
                    <td
                      key={m.slug}
                      className={`py-5 px-6 font-mono font-bold ${
                        isFastest ? 'bg-sky-50/70 text-sky-900' : 'text-teal-700'
                      }`}
                    >
                      {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}{' '}
                      {isFastest ? (
                        <span className="ml-2 rounded-full bg-sky-700 px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                          Fastest
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">Context Window</td>
                {comparedModels.map((m) => (
                  <td key={m.slug} className="py-5 px-6 font-mono text-xs font-semibold text-slate-800">
                    {m.contextWindow || '—'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-5 px-6 font-bold text-slate-700">Best For</td>
                {comparedModels.map((m) => (
                  <td key={m.slug} className="py-5 px-6 text-xs text-slate-600 leading-relaxed">
                    {m.bestFor || m.notes || 'General production workloads'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 3. Popular & Trending Matchups */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Popular &amp; Trending Matchups</h2>
          {modelA && modelB ? (
            <Link
              href={`/compare/${modelA.slug}-vs-${modelB.slug}`}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Open dedicated page: {modelA.name} vs {modelB.name} →
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularMatchups.map(({ a, b }) => (
            <div
              key={`${a.slug}-${b.slug}`}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <Link
                  href={`/compare/${a.slug}-vs-${b.slug}`}
                  className="text-sm font-bold text-slate-900 hover:text-emerald-800"
                >
                  {a.name} vs. {b.name}
                </Link>
                <div className="text-[11px] font-mono text-slate-600">
                  Score {fmtScore(a.score)} vs {fmtScore(b.score)} · {fmtPrice(a.inputPer1M)}/{fmtPrice(a.outputPer1M)} vs {fmtPrice(b.inputPer1M)}/{fmtPrice(b.outputPer1M)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModelASlug(String(a.slug));
                  setModelBSlug(String(b.slug));
                }}
                className="text-left text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Load into comparator above ↑
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. All Head-to-Head Model Matchups Directory */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              All Head-to-Head Model Matchups
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Grouped by primary model with scores, official API pricing, and throughput.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setProviderTab('ALL')}
              className={`rounded-full px-3 py-1 font-semibold cursor-pointer ${
                providerTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {providers.map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => setProviderTab(prov)}
                className={`rounded-full px-3 py-1 font-semibold cursor-pointer ${
                  providerTab === prov
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groupedMatchups.map(({ primary, opponents }) => (
            <div
              key={primary.slug}
              className="rounded-2xl border border-slate-200/80 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900">
                  {primary.name} Comparisons
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Score {fmtScore(primary.score)} · {fmtPrice(primary.inputPer1M)}/{fmtPrice(primary.outputPer1M)}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {opponents.map((opp) => (
                  <li key={opp.slug} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/compare/${primary.slug}-vs-${opp.slug}`}
                      className="font-semibold text-slate-700 hover:text-emerald-800"
                    >
                      {primary.name} vs. {opp.name}
                    </Link>
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">
                      {fmtScore(primary.score)} vs {fmtScore(opp.score)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
