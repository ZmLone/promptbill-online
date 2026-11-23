'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { TrendingUp, Copy, Check, ArrowUpRight } from 'lucide-react';

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
}

export const ParetoFrontierChart: React.FC<ParetoFrontierChartProps> = ({ models }) => {
  const [mode, setMode] = useState<ChartMode>('price');
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

    const yMin = Math.floor(Math.min(...items.map((i) => i.yRaw)) - 1.5);
    const yMax = Math.ceil(Math.max(...items.map((i) => i.yRaw)) + 1.5);
    const ySpan = Math.max(1, yMax - yMin);

    if (mode === 'price') {
      const logMin = Math.log10(Math.min(...items.map((i) => i.xRaw)));
      const logMax = Math.log10(Math.max(...items.map((i) => i.xRaw)));
      const logSpan = Math.max(0.1, logMax - logMin);

      return items.map((it, idx) => {
        const logVal = Math.log10(it.xRaw);
        const xPct = 12 + ((logVal - logMin) / logSpan) * 76;
        const yPct = 82 - ((it.yRaw - yMin) / ySpan) * 64;
        return {
          ...it,
          xPct: Math.min(89, Math.max(12, xPct)),
          yPct: Math.min(83, Math.max(16, yPct)),
          isPareto: paretoFlags[idx],
        };
      });
    } else {
      const xMin = Math.floor(Math.min(...items.map((i) => i.xRaw)) * 0.9);
      const xMax = Math.ceil(Math.max(...items.map((i) => i.xRaw)) * 1.05);
      const xSpan = Math.max(1, xMax - xMin);

      return items.map((it, idx) => {
        const xPct = 12 + ((it.xRaw - xMin) / xSpan) * 76;
        const yPct = 82 - ((it.yRaw - yMin) / ySpan) * 64;
        return {
          ...it,
          xPct: Math.min(89, Math.max(12, xPct)),
          yPct: Math.min(83, Math.max(16, yPct)),
          isPareto: paretoFlags[idx],
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

  const activeModelRow = useMemo(() => {
    if (selectedId) {
      return ranked.find((r) => r.model.id === selectedId) || paretoModels[0] || ranked[0] || null;
    }
    return paretoModels[paretoModels.length - 1] || ranked[0] || null;
  }, [selectedId, ranked, paretoModels]);

  const handleCopyAttribution = () => {
    if (typeof window === 'undefined') return;
    const summary =
      mode === 'price'
        ? `LLM Intelligence vs. API Cost Pareto Frontier (${paretoModels.map((p) => p.model.name).join(', ')}) — PromptBill https://promptbill.online`
        : `LLM Intelligence vs. Speed (Tok/s) Pareto Frontier (${paretoModels.map((p) => p.model.name).join(', ')}) — PromptBill https://promptbill.online`;
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
            <span>Pareto Frontier · Cost vs. Intelligence &amp; Speed</span>
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

      {/* Desktop Scatter Plot */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-2">
          <div className="relative h-[340px] w-full rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:56px_56px] opacity-60 pointer-events-none" />

            <div className="absolute left-3 top-3 rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
              ↑ Score (Intelligence)
            </div>

            <div className="absolute right-3 bottom-3 rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
              {mode === 'price'
                ? 'Blended $/1M (log scale) →'
                : 'Output Speed (tok/s) →'}
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
              return (
                <button
                  key={pt.model.id}
                  type="button"
                  onClick={() => setSelectedId(pt.model.id)}
                  onMouseEnter={() => setSelectedId(pt.model.id)}
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
                  className="group absolute flex h-11 w-11 items-center justify-center focus:outline-none z-10 hover:z-20"
                >
                  <span
                    className={`block h-3.5 w-3.5 rounded-full border-2 transition-transform ${
                      pt.isPareto
                        ? 'border-emerald-950 bg-emerald-600'
                        : 'border-slate-600 bg-white'
                    } ${isSelected ? 'scale-150 ring-4 ring-emerald-500/30 bg-emerald-700 border-emerald-950' : ''}`}
                  />
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
              Hover or click any dot to inspect · promptbill.online
            </span>
          </div>
        </div>

        {/* Selected Model Inspector Card (Desktop) */}
        <div className="lg:col-span-5">
          {activeModelRow && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
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
                  <div className="text-xs text-slate-700">{activeModelRow.model.provider}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-bold text-slate-900">
                    {activeModelRow.model.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-600">Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs">
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
        </div>
      </div>

      {/* Frontier Pills Row (44px tap height, 8px spacing) */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Frontier Models ({mode === 'price' ? 'Best Score per Price Tier' : 'Best Score per Speed Tier'})
        </div>
        <div className="flex flex-wrap gap-2">
          {paretoModels.map((p) => {
            const active = activeModelRow?.model.id === p.model.id;
            return (
              <button
                key={p.model.id}
                type="button"
                onClick={() => setSelectedId(p.model.id)}
                className={`min-h-[44px] min-w-[44px] rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-emerald-800 bg-emerald-800 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                {p.model.name}{' '}
                <span className="font-mono font-normal opacity-90">
                  ({p.model.score.toFixed(1)} ·{' '}
                  {mode === 'price' ? `$${p.blendedPrice.toFixed(2)}/1M` : `${p.model.tokPerSec} tok/s`})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Selected Model Card (< lg) */}
      {activeModelRow && (
        <div className="lg:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-900">{activeModelRow.model.name}</div>
              <div className="text-xs text-slate-700">{activeModelRow.model.provider}</div>
            </div>
            <div className="font-mono text-base font-bold text-slate-900">
              Score {activeModelRow.model.score.toFixed(1)}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-800">
            <span>Blended: ${activeModelRow.blendedPrice.toFixed(2)}/1M</span>
            <span className="text-emerald-800 font-semibold">{activeModelRow.model.tokPerSec} tok/s</span>
            <Link href={`/models/${activeModelRow.model.slug}`} className="inline-flex min-h-[44px] items-center font-sans font-semibold text-emerald-800 underline">
              Cost &amp; Specs -&gt;
            </Link>
          </div>
        </div>
      )}

      {/* Clean Semantic Data Table */}
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
