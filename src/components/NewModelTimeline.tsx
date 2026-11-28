'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import { formatCurrency } from '../lib/pricingEngine';
import { getEffectiveModelRates } from '../lib/endpointPricing';
import { ProviderLogo } from './ProviderLogo';
import {
  ArrowUpRight,
  Gauge,
  Zap,
  Server,
  Calculator,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Radio,
} from 'lucide-react';

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

function formatDateBadge(raw?: string | null): string {
  if (!raw) return 'Nov 2026';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeSync(raw?: string | null): string {
  if (!raw) return 'Synced recently';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return `Verified ${raw.slice(0, 10)}`;
  const ref = new Date('2026-11-28T12:00:00Z');
  const diffDays = Math.max(0, Math.round((ref.getTime() - parsed.getTime()) / 86400000));
  if (diffDays === 0) return 'Synced today';
  if (diffDays === 1) return 'Synced 1d ago';
  if (diffDays <= 30) return `Synced ${diffDays}d ago`;
  return `Verified ${formatDateBadge(raw)}`;
}

export function NewModelTimeline({
  models,
  onSimulateModel,
}: {
  models: CatalogModel[];
  onSimulateModel?: (slug: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const timelineModels = useMemo(() => {
    return [...models]
      .sort((a, b) => {
        const dA = a.pricingProvenance?.lastVerified ?? '';
        const dB = b.pricingProvenance?.lastVerified ?? '';
        return dB.localeCompare(dA);
      })
      .slice(0, 6);
  }, [models]);

  const count = timelineModels.length;

  useEffect(() => {
    if (!isAutoPlaying || isHovered || count <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isHovered, count]);

  const safeIdx = activeIndex < count ? activeIndex : 0;
  const focusedModel = timelineModels[safeIdx] ?? timelineModels[0];

  if (!focusedModel) return null;

  const focusedRates = getEffectiveModelRates(focusedModel, 'cheapest');

  return (
    <section
      aria-labelledby="new-models-timeline-heading"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="space-y-5"
    >
      {/* Header with Live Feed Beacon & Auto-Cycle Control */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Live Release Stream</span>
          </div>
          <h2
            id="new-models-timeline-heading"
            className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Recent Model Releases &amp; Rate Updates
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
            Live catalog stream of verified rate cards and inference endpoints. Select any release to inspect or simulate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            aria-label={isAutoPlaying ? 'Pause live release stream' : 'Resume live release stream'}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-3 w-3 text-emerald-700" />
                <span>Live Cycle</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-slate-700" />
                <span>Paused</span>
              </>
            )}
          </button>

          <Link
            href="/models"
            className="text-xs sm:text-sm font-bold text-emerald-900 hover:text-emerald-950 underline underline-offset-4"
          >
            All {models.length} Models →
          </Link>
        </div>
      </div>

      {/* Interactive Live Timeline Cards */}
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {timelineModels.map((m, idx) => {
          const eff = getEffectiveModelRates(m, 'cheapest');
          const isSelected = idx === safeIdx;
          const dateBadge = formatDateBadge(m.pricingProvenance?.lastVerified);

          return (
            <li key={m.id} className="flex">
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setIsAutoPlaying(false);
                }}
                aria-pressed={isSelected}
                className={`relative overflow-hidden w-full text-left group rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-white ring-2 ring-emerald-600 shadow-md -translate-y-0.5'
                    : 'bg-white hover:bg-slate-50/90 ring-1 ring-slate-200 hover:ring-slate-300 shadow-2xs'
                }`}
              >
                {/* Live Auto-Advance Progress Indicator on Active Card */}
                {isSelected && isAutoPlaying && !isHovered && (
                  <span
                    key={`progress-${safeIdx}`}
                    aria-hidden="true"
                    className="pb-live-progress absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500"
                  />
                )}
                {isSelected && (!isAutoPlaying || isHovered) && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-emerald-600"
                  />
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <time className="font-mono text-[11px] font-bold text-slate-700">
                      {dateBadge}
                    </time>
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                        <Radio className="h-2.5 w-2.5 text-emerald-700" />
                        Latest
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-bold text-slate-600">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ProviderLogo
                      provider={m.provider}
                      modelName={m.name}
                      modelSlug={m.slug}
                      size="sm"
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {m.provider}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-950 leading-snug group-hover:text-emerald-900 transition-colors">
                    {m.name}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 font-mono text-xs font-bold text-slate-900 tabular-nums">
                  {fmtRate(eff.inputPer1M)} / {fmtRate(eff.outputPer1M)}
                  <span className="text-[11px] font-semibold text-slate-600"> /1M</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Focused Release Telemetry Bar — Crisp Light Architectural Surface */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:px-7 sm:py-5 shadow-sm">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <ProviderLogo
            provider={focusedModel.provider}
            modelName={focusedModel.name}
            modelSlug={focusedModel.slug}
            size="lg"
          />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950">
                {focusedModel.name}
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                {focusedModel.provider}
              </span>
              {focusedModel.pricingProvenance?.status === 'Verified' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-950">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                  <Clock className="h-3.5 w-3.5 text-amber-800" />
                  Estimated
                </span>
              )}
              <span className="font-mono text-xs font-semibold text-slate-700">
                · {formatRelativeSync(focusedModel.pricingProvenance?.lastVerified)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-800 font-mono">
              <span>
                In: <strong className="text-slate-950">{fmtRate(focusedRates.inputPer1M)}</strong>/1M
              </span>
              <span>
                Cached:{' '}
                <strong className="text-emerald-900">
                  {fmtRate(focusedRates.cachedInputPer1M)}
                </strong>
                /1M
              </span>
              <span>
                Out: <strong className="text-slate-950">{fmtRate(focusedRates.outputPer1M)}</strong>/1M
              </span>
              <span>Ctx: {focusedModel.contextWindow ?? 'N/A'}</span>
              <span className="inline-flex items-center gap-1 text-slate-800">
                <Server className="h-3.5 w-3.5 text-emerald-700" />
                {focusedRates.host}
              </span>
              {typeof focusedRates.latencyMs === 'number' && (
                <span className="inline-flex items-center gap-1 text-emerald-900 font-bold">
                  <Gauge className="h-3.5 w-3.5" />
                  &lt;{focusedRates.latencyMs}ms
                </span>
              )}
              {typeof focusedRates.tokPerSec === 'number' && (
                <span className="inline-flex items-center gap-1 text-indigo-900 font-bold">
                  <Zap className="h-3.5 w-3.5" />~{focusedRates.tokPerSec} tok/s
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
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Simulate in Calculator</span>
            </button>
          )}
          <Link
            href={`/models/${focusedModel.slug}`}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-950 hover:bg-slate-50 transition-colors"
          >
            <span>Model Specs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
