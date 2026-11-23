'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { TrendingUp, Sparkles, Copy, Check } from 'lucide-react';

export type CatalogModel = (typeof ALL_MODELS)[number];

interface ParetoFrontierChartProps {
  models: readonly CatalogModel[];
}

type ChartMode = 'price' | 'speed';

interface PlottedModel {
  model: CatalogModel;
  xRaw: number;
  yRaw: number;
  xPct: number;
  yPct: number;
  isPareto: boolean;
  labelAbove: boolean;
  labelAlignRight: boolean;
}

export const ParetoFrontierChart: React.FC<ParetoFrontierChartProps> = ({ models }) => {
  const [mode, setMode] = useState<ChartMode>('price');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  const plotted = useMemo<PlottedModel[]>(() => {
    if (!models || models.length === 0) return [];

    const items = models.map((m) => {
      const blendedPrice = Number(((m.inputPer1M + m.outputPer1M) / 2).toFixed(2));
      const xRaw = mode === 'price' ? Math.max(0.05, blendedPrice) : Math.max(1, m.tokPerSec);
      const yRaw = m.score;
      return { model: m, xRaw, yRaw };
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

    const yMin = Math.floor(Math.min(...items.map((i) => i.yRaw)) - 2);
    const yMax = Math.ceil(Math.max(...items.map((i) => i.yRaw)) + 2);
    const ySpan = Math.max(1, yMax - yMin);

    if (mode === 'price') {
      const logMin = Math.log10(Math.min(...items.map((i) => i.xRaw)));
      const logMax = Math.log10(Math.max(...items.map((i) => i.xRaw)));
      const logSpan = Math.max(0.1, logMax - logMin);

      return items.map((it, idx) => {
        const logVal = Math.log10(it.xRaw);
        const xPct = 10 + ((logVal - logMin) / logSpan) * 78;
        const yPct = 84 - ((it.yRaw - yMin) / ySpan) * 68;
        const isPareto = paretoFlags[idx];
        const clampedX = Math.min(89, Math.max(10, xPct));
        const clampedY = Math.min(84, Math.max(15, yPct));
        return {
          model: it.model,
          xRaw: it.xRaw,
          yRaw: it.yRaw,
          xPct: clampedX,
          yPct: clampedY,
          isPareto,
          labelAbove: isPareto ? clampedY > 24 : false,
          labelAlignRight: clampedX > 72,
        };
      });
    } else {
      const xMin = Math.floor(Math.min(...items.map((i) => i.xRaw)) * 0.9);
      const xMax = Math.ceil(Math.max(...items.map((i) => i.xRaw)) * 1.05);
      const xSpan = Math.max(1, xMax - xMin);

      return items.map((it, idx) => {
        const xPct = 10 + ((it.xRaw - xMin) / xSpan) * 78;
        const yPct = 84 - ((it.yRaw - yMin) / ySpan) * 68;
        const isPareto = paretoFlags[idx];
        const clampedX = Math.min(89, Math.max(10, xPct));
        const clampedY = Math.min(84, Math.max(15, yPct));
        return {
          model: it.model,
          xRaw: it.xRaw,
          yRaw: it.yRaw,
          xPct: clampedX,
          yPct: clampedY,
          isPareto,
          labelAbove: isPareto ? clampedY > 24 : false,
          labelAlignRight: clampedX > 72,
        };
      });
    }
  }, [models, mode]);

  const paretoModels = useMemo(() => {
    const pts = plotted.filter((p) => p.isPareto);
    return [...pts].sort((a, b) => a.xRaw - b.xRaw);
  }, [plotted]);

  const activePoint = useMemo(() => {
    const targetId = hoveredId || selectedId;
    if (!targetId) return paretoModels[paretoModels.length - 1] || plotted[0] || null;
    return plotted.find((p) => p.model.id === targetId) || null;
  }, [hoveredId, selectedId, plotted, paretoModels]);

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

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <TrendingUp className="w-4 h-4" />
            <span>Pareto Frontier Analysis · Shareable Benchmark Chart</span>
          </div>
          <h2 id="pareto-frontier-heading" className="text-lg sm:text-xl font-bold text-slate-900">
            {mode === 'price'
              ? 'Intelligence Score vs. Blended API Token Price ($/1M)'
              : 'Intelligence Score vs. Generation Speed (Tokens / Sec)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {mode === 'price'
              ? 'Models along the Pareto frontier deliver the highest benchmark score at their price tier-no competing model achieves both a higher score and a lower blended $/1M token cost.'
              : 'Models along the Pareto frontier offer the strongest balance of benchmark intelligence and output throughput (tokens/sec) for low-latency production workloads.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('price')}
              className={`min-h-[38px] rounded-md px-3 py-1.5 font-semibold transition-colors ${
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
              className={`min-h-[38px] rounded-md px-3 py-1.5 font-semibold transition-colors ${
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
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            {copiedCitation ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Copied Attribution</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Cite Chart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop & Tablet Scatter Plot + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="hidden sm:block lg:col-span-8">
          <div className="relative h-[370px] lg:h-[400px] w-full rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden select-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:64px_64px] opacity-60 pointer-events-none" />

            <div className="absolute left-3 top-3 z-10 rounded bg-white/95 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
              Benchmark Score (Intelligence)
            </div>

            <div className="absolute right-3 bottom-3 z-10 rounded bg-white/95 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
              {mode === 'price'
                ? 'Blended API Price ($/1M tokens, log scale)'
                : 'Output Speed (Tokens / Sec)'}
            </div>

            {paretoModels.length > 1 && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full pointer-events-none"
                aria-hidden="true"
              >
                <polyline
                  fill="none"
                  stroke="#065f46"
                  strokeWidth="0.65"
                  strokeDasharray="1.8 1.2"
                  points={paretoModels.map((p) => `${p.xPct},${p.yPct}`).join(' ')}
                />
              </svg>
            )}

            {plotted.map((pt) => {
              const isHighlighted =
                hoveredId === pt.model.id ||
                selectedId === pt.model.id ||
                activePoint?.model.id === pt.model.id;

              return (
                <button
                  key={pt.model.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(pt.model.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(pt.model.id)}
                  onClick={() => setSelectedId(pt.model.id)}
                  style={{
                    left: `${pt.xPct}%`,
                    top: `${pt.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  aria-label={`${pt.model.name}: Score ${pt.yRaw}, ${
                    mode === 'price'
                      ? `Blended price $${pt.xRaw.toFixed(2)} per 1M`
                      : `Speed ${pt.xRaw} tokens per second`
                  }`}
                  className={`group absolute flex min-h-[28px] min-w-[28px] items-center justify-center focus:outline-none ${
                    isHighlighted ? 'z-30' : pt.isPareto ? 'z-20' : 'z-10'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 transition-transform shrink-0 ${
                      pt.isPareto
                        ? 'border-emerald-950 bg-emerald-600 shadow-sm'
                        : 'border-slate-700 bg-white'
                    } ${isHighlighted ? 'scale-125 ring-4 ring-emerald-500/25' : ''}`}
                  />
                  {pt.isPareto && (
                    <span
                      className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold shadow-xs transition-colors ${
                        pt.labelAbove ? 'mb-6 -ml-3' : 'ml-1.5'
                      } bg-emerald-950 text-white ${
                        isHighlighted ? 'ring-2 ring-emerald-600' : ''
                      }`}
                    >
                      {pt.model.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-3 w-3 rounded-full bg-emerald-600 border border-emerald-950 inline-block" />
                Pareto Frontier ({paretoModels.length} models)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-white border border-slate-700 inline-block" />
                Other Tracked Models (click/tap in list or table to inspect)
              </span>
            </div>
            <span className="text-[11px] text-slate-600">
              Source: PromptBill (https://promptbill.online) · Nov 2026
            </span>
          </div>
        </div>

        {/* Mobile-Friendly Compact Frontier Summary (< sm) */}
        <div className="sm:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="text-xs font-bold text-slate-900">
            {mode === 'price' ? 'Cost-Efficiency Frontier' : 'Speed-Efficiency Frontier'}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Tap any model below to inspect its benchmark score, API pricing, and speed without crowded mobile chart labels.
          </p>
        </div>

        {/* Inspector & Frontier Summary Card */}
        <div className="lg:col-span-4 space-y-4">
          {activePoint && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    {activePoint.isPareto ? 'On Pareto Frontier' : 'Tracked Model'}
                  </div>
                  <Link
                    href={`/models/${activePoint.model.slug}`}
                    className="text-base font-bold text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline"
                  >
                    {activePoint.model.name}
                  </Link>
                  <div className="text-xs text-slate-700">{activePoint.model.provider}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-slate-900">{activePoint.model.score.toFixed(1)}</div>
                  <div className="text-[11px] text-slate-600">Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs">
                <div>
                  <div className="text-[10px] font-sans text-slate-600">API In / Out ($/1M)</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    ${activePoint.model.inputPer1M.toFixed(2)} / ${activePoint.model.outputPer1M.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-600">Throughput</div>
                  <div className="font-bold text-emerald-800 mt-0.5">
                    {activePoint.model.tokPerSec} tok/s
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700">{activePoint.model.bestFor}</p>

              <Link
                href={`/models/${activePoint.model.slug}`}
                className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Open Full Specs &amp; Cost Calculator -&gt;
              </Link>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Pareto Frontier Leaders</span>
            </div>
            <ul className="space-y-1 text-xs">
              {paretoModels.map((p) => (
                <li key={p.model.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-none">
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.model.id)}
                    className="min-h-[32px] font-semibold text-slate-900 hover:text-emerald-800 text-left"
                  >
                    {p.model.name}
                  </button>
                  <span className="font-mono text-slate-700 shrink-0">
                    Score {p.model.score.toFixed(1)} ·{' '}
                    {mode === 'price'
                      ? `$${p.xRaw.toFixed(2)}/1M avg`
                      : `${p.model.tokPerSec} tok/s`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Accessible & GEO-Friendly Data Table for Readers, Screen Readers & AI Crawlers */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">
            Pareto frontier comparison table listing benchmark score, blended API token cost per 1 million tokens, generation speed in tokens per second, and frontier status for tracked LLMs.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-semibold">
              <th scope="col" className="py-2.5 px-3">Model</th>
              <th scope="col" className="py-2.5 px-3">Frontier Status</th>
              <th scope="col" className="py-2.5 px-3">Score</th>
              <th scope="col" className="py-2.5 px-3">Blended $/1M</th>
              <th scope="col" className="py-2.5 px-3">Speed (Tok/s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 font-mono">
            {plotted
              .slice()
              .sort((a, b) => b.yRaw - a.yRaw)
              .slice(0, 8)
              .map((pt, idx) => (
                <tr key={pt.model.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-2 px-3 font-sans font-semibold text-slate-900 text-left">
                    <button
                      type="button"
                      onClick={() => setSelectedId(pt.model.id)}
                      className="min-h-[32px] hover:text-emerald-800 underline-offset-2 hover:underline text-left"
                    >
                      {pt.model.name}
                    </button>
                  </th>
                  <td className="py-2 px-3 font-sans">
                    {pt.isPareto ? (
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                        Pareto Frontier
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Tracked</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900">{pt.model.score.toFixed(1)}</td>
                  <td className="py-2 px-3 text-slate-800">${pt.xRaw.toFixed(2)}</td>
                  <td className="py-2 px-3 text-emerald-800 font-semibold">{pt.model.tokPerSec} tok/s</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
