'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { TrendingUp, Copy, Check, ArrowUpRight, Sparkles } from 'lucide-react';

export type CatalogModel = (typeof ALL_MODELS)[number];

interface ParetoFrontierChartProps {
  models: readonly CatalogModel[];
}

type ChartMode = 'price' | 'speed';

interface RankedModel {
  model: CatalogModel;
  blendedPrice: number;
  xRaw: number;
  yRaw: number;
  xPct: number;
  yPct: number;
  isPareto: boolean;
  valueEfficiency: number;
  frontierDeltaLabel: string;
}

export const ParetoFrontierChart: React.FC<ParetoFrontierChartProps> = ({ models }) => {
  const [mode, setMode] = useState<ChartMode>('price');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  const ranked = useMemo<RankedModel[]>(() => {
    if (!models || models.length === 0) return [];

    const items = models.map((m) => {
      const blendedPrice = Number(((m.inputPer1M + m.outputPer1M) / 2).toFixed(2));
      const xRaw = mode === 'price' ? Math.max(0.05, blendedPrice) : Math.max(1, m.tokPerSec);
      const yRaw = m.score;
      const valueEfficiency = blendedPrice > 0 ? Number((yRaw / blendedPrice).toFixed(1)) : yRaw;
      return { model: m, blendedPrice, xRaw, yRaw, valueEfficiency };
    });

    const paretoFlags = items.map((a, idxA) => {
      const dominated = items.some((b, idxB) => {
        if (idxA === idxB) return false;
        if (mode === 'price') {
          return b.xRaw <= a.xRaw && b.yRaw >= a.yRaw && (b.xRaw < a.xRaw || b.yRaw > a.yRaw);
        }
        return b.xRaw >= a.xRaw && b.yRaw >= a.yRaw && (b.xRaw > a.xRaw || b.yRaw > a.yRaw);
      });
      return !dominated;
    });

    const paretoCandidates = items.filter((_, idx) => paretoFlags[idx]);

    const yMin = Math.floor(Math.min(...items.map((i) => i.yRaw)) - 1.5);
    const yMax = Math.ceil(Math.max(...items.map((i) => i.yRaw)) + 1.5);
    const ySpan = Math.max(1, yMax - yMin);

    const computeDeltaLabel = (item: { xRaw: number; yRaw: number }, isPareto: boolean): string => {
      if (isPareto) {
        return mode === 'price' ? 'On cost frontier (optimal)' : 'On speed frontier (optimal)';
      }
      if (paretoCandidates.length === 0) return 'Tracked model';
      if (mode === 'price') {
        // Find nearest frontier model by score or price
        const nearest = paretoCandidates.reduce((best, cur) =>
          Math.abs(cur.yRaw - item.yRaw) < Math.abs(best.yRaw - item.yRaw) ? cur : best
        );
        const diff = item.xRaw - nearest.xRaw;
        if (Math.abs(diff) < 0.01) return `Same blended price as ${nearest.xRaw.toFixed(2)}/1M frontier`;
        return diff > 0
          ? `+$${diff.toFixed(2)}/1M higher blended cost vs nearest frontier`
          : `$${Math.abs(diff).toFixed(2)}/1M lower blended cost vs nearest frontier`;
      } else {
        const nearest = paretoCandidates.reduce((best, cur) =>
          Math.abs(cur.yRaw - item.yRaw) < Math.abs(best.yRaw - item.yRaw) ? cur : best
        );
        const diff = Math.round(item.xRaw - nearest.xRaw);
        if (diff === 0) return 'Matches nearest speed frontier';
        return diff > 0
          ? `+${diff} tok/s faster than nearest frontier`
          : `${Math.abs(diff)} tok/s slower than nearest frontier`;
      }
    };

    if (mode === 'price') {
      const logMin = Math.log10(Math.min(...items.map((i) => i.xRaw)));
      const logMax = Math.log10(Math.max(...items.map((i) => i.xRaw)));
      const logSpan = Math.max(0.1, logMax - logMin);

      return items.map((it, idx) => {
        const logVal = Math.log10(it.xRaw);
        const xPct = 12 + ((logVal - logMin) / logSpan) * 76;
        const yPct = 82 - ((it.yRaw - yMin) / ySpan) * 64;
        const isPareto = paretoFlags[idx];
        return {
          ...it,
          xPct: Math.min(89, Math.max(12, xPct)),
          yPct: Math.min(83, Math.max(16, yPct)),
          isPareto,
          frontierDeltaLabel: computeDeltaLabel(it, isPareto),
        };
      });
    } else {
      const xMin = Math.floor(Math.min(...items.map((i) => i.xRaw)) * 0.9);
      const xMax = Math.ceil(Math.max(...items.map((i) => i.xRaw)) * 1.05);
      const xSpan = Math.max(1, xMax - xMin);

      return items.map((it, idx) => {
        const xPct = 12 + ((it.xRaw - xMin) / xSpan) * 76;
        const yPct = 82 - ((it.yRaw - yMin) / ySpan) * 64;
        const isPareto = paretoFlags[idx];
        return {
          ...it,
          xPct: Math.min(89, Math.max(12, xPct)),
          yPct: Math.min(83, Math.max(16, yPct)),
          isPareto,
          frontierDeltaLabel: computeDeltaLabel(it, isPareto),
        };
      });
    }
  }, [models, mode]);

  const paretoModels = useMemo(() => {
    return ranked
      .filter((p) => p.isPareto)
      .sort((a, b) => (mode === 'price' ? a.xRaw - b.xRaw : b.xRaw - a.xRaw));
  }, [ranked, mode]);

  const sortedTableRows = useMemo(() => {
    return [...ranked].sort((a, b) => b.yRaw - a.yRaw);
  }, [ranked]);

  const hoveredRow = useMemo(() => {
    if (!hoveredId) return null;
    return ranked.find((r) => r.model.id === hoveredId) || null;
  }, [hoveredId, ranked]);

  const activeModelRow = useMemo(() => {
    const targetId = hoveredId || selectedId;
    if (targetId) {
      return ranked.find((r) => r.model.id === targetId) || paretoModels[0] || ranked[0] || null;
    }
    return paretoModels[paretoModels.length - 1] || ranked[0] || null;
  }, [hoveredId, selectedId, ranked, paretoModels]);

  const handleCopyAttribution = () => {
    if (typeof window === 'undefined') return;
    const summary =
      mode === 'price'
        ? `LLM Intelligence vs. API Cost Pareto Frontier (${paretoModels.map((p) => p.model.name).join(', ')}) - PromptBill https://promptbill.online`
        : `LLM Intelligence vs. Speed (Tok/s) Pareto Frontier (${paretoModels.map((p) => p.model.name).join(', ')}) - PromptBill https://promptbill.online`;
    navigator.clipboard?.writeText(summary);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name:
      mode === 'price'
        ? 'PromptBill LLM Intelligence vs. Blended API Token Cost Pareto Frontier'
        : 'PromptBill LLM Intelligence vs. Output Speed (Tokens/sec) Pareto Frontier',
    description:
      'Benchmark intelligence scores, blended API token prices ($/1M), output generation speeds (tok/s), and Pareto-optimal frontier models tracked by PromptBill.',
    url: 'https://promptbill.online/',
    creator: {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
  };

  return (
    <section
      aria-labelledby="pareto-frontier-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <TrendingUp className="w-4 h-4" />
            <span>Pareto Frontier · Master-Detail Benchmark Analysis</span>
          </div>
          <h2 id="pareto-frontier-heading" className="text-lg sm:text-xl font-bold text-slate-900">
            {mode === 'price'
              ? 'Intelligence vs. Blended API Token Cost ($/1M)'
              : 'Intelligence vs. Generation Speed (Tokens / Sec)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            {mode === 'price'
              ? 'Frontier models achieve the highest benchmark score at their price point—no rival beats them on both lower cost and higher score.'
              : 'Frontier models balance benchmark intelligence and output speed (tok/s) for interactive and high-throughput workloads.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('price')}
              className={`min-h-[44px] min-w-[44px] rounded-md px-3.5 py-2 font-semibold transition-colors ${
                mode === 'price'
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-800 hover:bg-white'
              }`}
            >
              Intelligence vs. Cost
            </button>
            <button
              type="button"
              onClick={() => setMode('speed')}
              className={`min-h-[44px] min-w-[44px] rounded-md px-3.5 py-2 font-semibold transition-colors ${
                mode === 'speed'
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-800 hover:bg-white'
              }`}
            >
              Intelligence vs. Speed
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAttribution}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            {copiedCitation ? (
              <>
                <Check className="w-4 h-4 text-emerald-800" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Citation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Master-Detail Layout: Chart Left (~66% / 8 cols), Inspector + Frontier Leaders Right (~33% / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="hidden lg:block lg:col-span-8 space-y-2">
          <div className="relative h-[380px] w-full rounded-xl border border-slate-200 bg-slate-50/80 overflow-visible">
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:56px_56px] opacity-60" />
            </div>

            <div className="absolute left-3 top-3 z-10 rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 pointer-events-none">
              ↑ Score (Intelligence)
            </div>

            <div className="absolute right-3 bottom-3 z-10 rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 pointer-events-none">
              {mode === 'price'
                ? 'Blended $/1M (log scale) →'
                : 'Output Speed (tok/s) →'}
            </div>

            {paretoModels.length > 1 && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full pointer-events-none rounded-xl overflow-hidden"
                aria-hidden="true"
              >
                <polyline
                  fill="none"
                  stroke="#065f46"
                  strokeWidth="0.7"
                  strokeDasharray="1.8 1.2"
                  points={[...paretoModels]
                    .sort((a, b) => a.xPct - b.xPct)
                    .map((p) => `${p.xPct},${p.yPct}`)
                    .join(' ')}
                />
              </svg>
            )}

            {ranked.map((pt) => {
              const isSelected = activeModelRow?.model.id === pt.model.id;
              const isHovered = hoveredId === pt.model.id;
              return (
                <button
                  key={pt.model.id}
                  type="button"
                  onClick={() => setSelectedId(pt.model.id)}
                  onMouseEnter={() => setHoveredId(pt.model.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(pt.model.id)}
                  style={{
                    left: `${pt.xPct}%`,
                    top: `${pt.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  aria-label={`${pt.model.name}: Score ${pt.yRaw}, ${
                    mode === 'price'
                      ? `Blended price $${pt.blendedPrice.toFixed(2)} per 1M`
                      : `Speed ${pt.model.tokPerSec} tokens per second`
                  }`}
                  className={`group absolute flex h-11 w-11 items-center justify-center focus:outline-none ${
                    isHovered ? 'z-40' : isSelected ? 'z-30' : 'z-10'
                  }`}
                >
                  <span
                    className={`block h-3.5 w-3.5 rounded-full border-2 transition-transform ${
                      pt.isPareto
                        ? 'border-emerald-950 bg-emerald-600'
                        : 'border-slate-600 bg-white'
                    } ${
                      isSelected || isHovered
                        ? 'scale-150 ring-4 ring-emerald-500/30 bg-emerald-700 border-emerald-950'
                        : ''
                    }`}
                  />

                  {/* Crisp Hover Tooltip with Pricing, Context Window & Frontier Delta */}
                  {isHovered && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 rounded-xl border border-slate-200 bg-slate-950 text-white p-3 text-left shadow-xl z-50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white truncate">{pt.model.name}</span>
                        <span className="font-mono text-xs font-bold text-emerald-300 shrink-0">
                          Score {pt.model.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-200 pt-1 border-t border-slate-800">
                        <div>In: ${pt.model.inputPer1M.toFixed(2)}/1M</div>
                        <div>Out: ${pt.model.outputPer1M.toFixed(2)}/1M</div>
                        <div>Ctx: {pt.model.contextWindow}</div>
                        <div>Speed: {pt.model.tokPerSec} tok/s</div>
                      </div>
                      <div className="text-[11px] text-emerald-200 leading-snug pt-0.5">
                        {pt.frontierDeltaLabel}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700 px-1">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-3 w-3 rounded-full bg-emerald-600 border border-emerald-950 inline-block" />
                Pareto Frontier ({paretoModels.length})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-white border border-slate-600 inline-block" />
                Other Models
              </span>
            </div>
            <span className="text-[11px] text-slate-600">
              {hoveredRow ? `Inspecting ${hoveredRow.model.name}` : 'Hover or click any dot to inspect · promptbill.online'}
            </span>
          </div>
        </div>

        {/* Right Column (35% / 4 cols on desktop): Selected Model Inspector + Frontier Leaders */}
        <div className="lg:col-span-4 space-y-4">
          {activeModelRow && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                      activeModelRow.isPareto
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {activeModelRow.isPareto ? 'Pareto Frontier Model' : 'Tracked Model'}
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                    {activeModelRow.model.name}
                  </h3>
                  <div className="text-xs text-slate-700">
                    {activeModelRow.model.provider} · {activeModelRow.model.contextWindow} context
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-bold text-slate-900">
                    {activeModelRow.model.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-600">Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs">
                <div>
                  <div className="text-[10px] font-sans text-slate-600">Blended $/1M</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    ${activeModelRow.blendedPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-600">In / Out</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    ${activeModelRow.model.inputPer1M.toFixed(2)}/${activeModelRow.model.outputPer1M.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-600">Speed</div>
                  <div className="font-bold text-emerald-800 mt-0.5">
                    {activeModelRow.model.tokPerSec} tok/s
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-950 font-medium">
                {activeModelRow.frontierDeltaLabel}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {activeModelRow.model.bestFor}
              </p>

              <Link
                href={`/models/${activeModelRow.model.slug}`}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <span>View {activeModelRow.model.name} Calculator &amp; Specs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Frontier Leaders List inside Right Column */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Frontier Leaders ({paretoModels.length})</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {paretoModels.map((p) => {
                const active = activeModelRow?.model.id === p.model.id;
                return (
                  <button
                    key={p.model.id}
                    type="button"
                    onClick={() => setSelectedId(p.model.id)}
                    className={`min-h-[40px] w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                      active
                        ? 'border-emerald-800 bg-emerald-800 text-white font-semibold'
                        : 'border-slate-200 bg-slate-50/70 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate font-semibold">{p.model.name}</span>
                    <span className="font-mono shrink-0 text-[11px]">
                      {p.model.score.toFixed(1)} ·{' '}
                      {mode === 'price' ? `$${p.blendedPrice.toFixed(2)}/1M` : `${p.model.tokPerSec} tok/s`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SEO & GEO Semantic Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">
            Benchmark score, blended API token cost per 1 million tokens, generation speed in tokens per second, and Pareto frontier status across models.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-semibold">
              <th scope="col" className="py-2.5 px-3">Model</th>
              <th scope="col" className="py-2.5 px-3">Frontier</th>
              <th scope="col" className="py-2.5 px-3">Score</th>
              <th scope="col" className="py-2.5 px-3">Blended $/1M</th>
              <th scope="col" className="py-2.5 px-3">Speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 font-mono">
            {sortedTableRows.map((pt, idx) => (
              <tr key={pt.model.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th scope="row" className="py-2 px-3 font-sans font-semibold text-slate-900 text-left">
                  <Link
                    href={`/models/${pt.model.slug}`}
                    className="inline-flex min-h-[44px] items-center hover:text-emerald-800 underline-offset-2 hover:underline"
                  >
                    {pt.model.name}
                  </Link>
                </th>
                <td className="py-2 px-3 font-sans">
                  {pt.isPareto ? (
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                      Frontier
                    </span>
                  ) : (
                    <span className="text-slate-600 text-[11px]">-</span>
                  )}
                </td>
                <td className="py-2 px-3 font-bold text-slate-900">{pt.model.score.toFixed(1)}</td>
                <td className="py-2 px-3 text-slate-800">${pt.blendedPrice.toFixed(2)}</td>
                <td className="py-2 px-3 text-emerald-800 font-semibold">{pt.model.tokPerSec} tok/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
