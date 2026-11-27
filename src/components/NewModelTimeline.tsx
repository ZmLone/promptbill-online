'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import { formatCurrency } from '../lib/pricingEngine';
import { getEffectiveModelRates } from '../lib/endpointPricing';
import { ProviderLogo } from './ProviderLogo';
import {
  Sparkles,
  ArrowUpRight,
  Gauge,
  Zap,
  Server,
  Calculator,
  CheckCircle2,
  Clock,
} from 'lucide-react';

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

function formatDateBadge(raw?: string | null): string {
  if (!raw) return '2026';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function NewModelTimeline({
  models,
  onSimulateModel,
}: {
  models: CatalogModel[];
  onSimulateModel?: (slug: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const timelineModels = useMemo(() => {
    return [...models]
      .sort((a, b) => {
        const dA = a.pricingProvenance?.lastVerified ?? '';
        const dB = b.pricingProvenance?.lastVerified ?? '';
        return dB.localeCompare(dA);
      })
      .slice(0, 6);
  }, [models]);

  const safeIdx = activeIndex < timelineModels.length ? activeIndex : 0;
  const focusedModel = timelineModels[safeIdx] ?? timelineModels[0];

  if (!focusedModel) return null;

  const focusedRates = getEffectiveModelRates(focusedModel, 'cheapest');

  return (
    <section aria-labelledby="new-models-timeline-heading" className="space-y-5">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Model Timeline</span>
          </p>
          <h2
            id="new-models-timeline-heading"
            className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Recent Model Releases &amp; Rate Updates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Click any model release to inspect its token rates or send it straight into the calculator.
          </p>
        </div>

        <Link
          href="/models"
          className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
        >
          All {models.length} Models →
        </Link>
      </div>

      {/* Clean Stepped Release Cards (No Line Passing Through Cards) */}
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {timelineModels.map((m, idx) => {
          const eff = getEffectiveModelRates(m, 'cheapest');
          const isSelected = idx === safeIdx;
          const dateBadge = formatDateBadge(m.pricingProvenance?.lastVerified);

          return (
            <li key={m.id} className="flex">
              <button
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-pressed={isSelected}
                className={`w-full text-left group rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-white ring-2 ring-slate-950 shadow-md -translate-y-0.5'
                    : 'bg-white/75 hover:bg-white ring-1 ring-slate-200/80 hover:ring-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Row: Release Date + Step Pill */}
                  <div className="flex items-center justify-between gap-1.5">
                    <time className="font-mono text-[11px] font-semibold text-slate-500">
                      {dateBadge}
                    </time>
                    {idx === 0 ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Latest
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Model Logo + Name */}
                  <div className="flex items-center gap-2">
                    <ProviderLogo
                      provider={m.provider}
                      modelName={m.name}
                      modelSlug={m.slug}
                      size="sm"
                    />
                    <span className="text-[11px] font-medium text-slate-500 truncate">
                      {m.provider}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-950 leading-snug group-hover:text-emerald-800 transition-colors">
                    {m.name}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                  {fmtRate(eff.inputPer1M)} / {fmtRate(eff.outputPer1M)}
                  <span className="text-[10px] font-normal text-slate-400"> /1M</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Focused Release Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl bg-slate-950 text-white p-5 sm:px-7 sm:py-5 shadow-md">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <ProviderLogo
            provider={focusedModel.provider}
            modelName={focusedModel.name}
            modelSlug={focusedModel.slug}
            size="lg"
          />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                {focusedModel.name}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                {focusedModel.provider}
              </span>
              {focusedModel.pricingProvenance?.status === 'Verified' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                  <Clock className="h-3 w-3" />
                  Estimated
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
              <span>
                In: <strong className="text-white">{fmtRate(focusedRates.inputPer1M)}</strong>/1M
              </span>
              <span>
                Cached:{' '}
                <strong className="text-emerald-300">
                  {fmtRate(focusedRates.cachedInputPer1M)}
                </strong>
                /1M
              </span>
              <span>
                Out: <strong className="text-white">{fmtRate(focusedRates.outputPer1M)}</strong>/1M
              </span>
              <span>Ctx: {focusedModel.contextWindow ?? 'N/A'}</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Server className="h-3 w-3 text-emerald-400" />
                {focusedRates.host}
              </span>
              {typeof focusedRates.latencyMs === 'number' && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Gauge className="h-3 w-3" />
                  &lt;{focusedRates.latencyMs}ms
                </span>
              )}
              {typeof focusedRates.tokPerSec === 'number' && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Zap className="h-3 w-3" />~{focusedRates.tokPerSec} tok/s
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onSimulateModel && (
            <button
              type="button"
              onClick={() => onSimulateModel(focusedModel.slug)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors cursor-pointer"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Simulate in Calculator</span>
            </button>
          )}
          <Link
            href={`/models/${focusedModel.slug}`}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <span>Model Specs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
