'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DynamicCompareClient({
  models,
  initialSlugs,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models: any[];
  initialSlugs: string[];
}) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialSlugs.length >= 2) return initialSlugs.slice(0, 6);
    if (initialSlugs.length === 1) {
      const fallback = models.find((m) => m.slug !== initialSlugs[0])?.slug;
      return fallback ? [initialSlugs[0], fallback] : [initialSlugs[0]];
    }
    try {
      const saved =
        window.sessionStorage.getItem('promptbill_compare_slugs') ||
        window.localStorage.getItem('promptbill_compare_slugs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed.map(String).slice(0, 6);
        }
      }
    } catch {
      // ignore storage read errors
    }
    return models.slice(0, 2).map((m) => String(m.slug));
  });

  const [pickerSlug, setPickerSlug] = useState<string>(() => {
    const unused = models.find((m) => !selectedSlugs.includes(String(m.slug)));
    return unused ? String(unused.slug) : String(models[0]?.slug || '');
  });

  useEffect(() => {
    if (initialSlugs.length >= 2) {
      setSelectedSlugs(initialSlugs.slice(0, 6));
    } else if (initialSlugs.length === 1) {
      const fallback = models.find((m) => m.slug !== initialSlugs[0])?.slug;
      setSelectedSlugs(fallback ? [initialSlugs[0], String(fallback)] : [initialSlugs[0]]);
    }
  }, [initialSlugs, models]);

  useEffect(() => {
    if (selectedSlugs.length === 0) return;
    try {
      window.localStorage.setItem('promptbill_compare_slugs', JSON.stringify(selectedSlugs));
      window.sessionStorage.setItem('promptbill_compare_slugs', JSON.stringify(selectedSlugs));
    } catch {
      // ignore storage errors
    }
    const params = new URLSearchParams();
    params.set('models', selectedSlugs.join(','));
    if (selectedSlugs[0]) params.set('a', selectedSlugs[0]);
    if (selectedSlugs[1]) params.set('b', selectedSlugs[1]);
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  }, [selectedSlugs, router]);

  const comparedModels = useMemo(() => {
    return selectedSlugs
      .map((slug) => models.find((m) => String(m.slug) === slug))
      .filter(Boolean);
  }, [selectedSlugs, models]);

  function addModelToComparison(slug: string) {
    if (!slug) return;
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      if (prev.length >= 6) return [...prev.slice(1), slug];
      return [...prev, slug];
    });
  }

  function removeModelFromComparison(slug: string) {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  }

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
    <section className="space-y-8 pb-14" aria-label="Dynamic Multi-Model Comparison">
      {/* Selector & Quick Add Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Comparing {comparedModels.length} {comparedModels.length === 1 ? 'Model' : 'Models'} Dynamically
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add or swap any current or future model in the catalog—winners per metric highlight automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={pickerSlug}
              onChange={(e) => setPickerSlug(e.target.value)}
              aria-label="Choose another model to compare"
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800"
            >
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addModelToComparison(pickerSlug)}
              className="min-h-[42px] rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              + Add Model
            </button>
            <Link
              href="/leaderboard"
              className="min-h-[42px] inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              ← Back to Leaderboard
            </Link>
          </div>
        </div>

        {/* Active Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {comparedModels.map((m) => (
            <span
              key={m.slug}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-900 ring-1 ring-slate-200"
            >
              <span>{m.name}</span>
              <span className="text-slate-500 font-normal">· {m.provider}</span>
              {comparedModels.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeModelFromComparison(String(m.slug))}
                  aria-label={`Remove ${m.name}`}
                  className="ml-1 text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      {comparedModels.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-5 px-6 w-48">Metric</th>
                {comparedModels.map((m) => (
                  <th key={m.slug} className="py-5 px-6 min-w-[210px]">
                    <div className="text-sm font-extrabold normal-case tracking-normal text-slate-900">
                      <Link href={`/models/${m.slug}`} className="hover:text-emerald-800">
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
                      {typeof m.inputPer1M === 'number' ? `$${m.inputPer1M.toFixed(2)}` : 'N/A'} /{' '}
                      {typeof m.outputPer1M === 'number' ? `$${m.outputPer1M.toFixed(2)}` : 'N/A'}
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
    </section>
  );
}
