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
  Activity,
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

function formatTimeStamp(tick: number): string {
  const baseSec = 12 * 3600 + 14 * 60 + 20 + tick * 2;
  const hh = String(Math.floor(baseSec / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor((baseSec % 3600) / 60)).padStart(2, '0');
  const ss = String(baseSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss} IST`;
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
  const [pulseTick, setPulseTick] = useState<number>(0);

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

  // Real-time stream heartbeat every 2.2s
  useEffect(() => {
    if (!isAutoPlaying) return;
    const heartbeat = window.setInterval(() => {
      setPulseTick((t) => t + 1);
    }, 2200);
    return () => window.clearInterval(heartbeat);
  }, [isAutoPlaying]);

  // Cycle focused release smoothly across the timeline
  useEffect(() => {
    if (!isAutoPlaying || isHovered || count <= 1) return;
    const cycle = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5200);
    return () => window.clearInterval(cycle);
  }, [isAutoPlaying, isHovered, count]);

  const safeIdx = activeIndex < count ? activeIndex : 0;
  const focusedModel = timelineModels[safeIdx] ?? timelineModels[0];

  if (!focusedModel) return null;

  const focusedRates = getEffectiveModelRates(focusedModel, 'cheapest');
  const streamingModel = timelineModels[pulseTick % Math.max(1, count)] ?? focusedModel;
  const streamingRates = getEffectiveModelRates(streamingModel, 'cheapest');

  return (
    <section
      aria-labelledby="new-models-timeline-heading"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="space-y-5"
    >
      {/* Real-Time Stream Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>REAL-TIME TIMELINE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
              <Activity className="h-3.5 w-3.5 text-emerald-700" />
              <span>
                {isAutoPlaying
                  ? `Stream active · ${formatTimeStamp(pulseTick)} · ${streamingModel.name} (${streamingRates.host})`
                  : 'Stream paused'}
              </span>
            </span>
          </div>

          <h2
            id="new-models-timeline-heading"
            className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Live Model Release &amp; Endpoint Timeline
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
            Chronological release stream with live endpoint rate checks. Click any milestone node to lock focus or simulate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-3 w-3 text-emerald-700" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-slate-800" />
                <span>Resume Feed</span>
              </>
            )}
          </button>

          <Link
            href="/models"
            className="text-xs sm:text-sm font-bold text-emerald-950 hover:underline underline-offset-4"
          >
            All {models.length} Models →
          </Link>
        </div>
      </div>

      {/* Connected Timeline Track + Milestone Nodes */}
      <div className="relative">
        {/* Continuous Horizontal Timeline Connector Line on Desktop */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute top-6 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-emerald-500/40 via-sky-500/40 to-indigo-500/40 z-0"
        />

        <ol className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {timelineModels.map((m, idx) => {
            const eff = getEffectiveModelRates(m, 'cheapest');
            const isSelected = idx === safeIdx;
            const isTickingNow = isAutoPlaying && pulseTick % count === idx;
            const dateBadge = formatDateBadge(m.pricingProvenance?.lastVerified);

            return (
              <li key={m.id} className="flex flex-col">
                {/* Timeline Node Marker */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span
                    className={`h-3 w-3 rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-500 scale-110 ring-4 ring-emerald-500/20'
                        : isTickingNow
                        ? 'border-sky-700 bg-sky-400'
                        : 'border-slate-400 bg-white'
                    }`}
                  />
                  <time className="font-mono text-[11px] font-bold text-slate-800">
                    {dateBadge}
                  </time>
                  <span className="ml-auto font-mono text-[11px] font-bold text-slate-700">
                    {idx === 0 ? 'LATEST' : `T-${idx}`}
                  </span>
                </div>

                {/* Release Milestone Card */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsAutoPlaying(false);
                  }}
                  aria-pressed={isSelected}
                  className={`relative overflow-hidden flex-1 w-full text-left group rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-white ring-2 ring-emerald-700 shadow-md'
                      : isTickingNow
                      ? 'bg-emerald-50/45 ring-1 ring-emerald-600/50 hover:bg-white'
                      : 'bg-white hover:bg-slate-50 ring-1 ring-slate-200 hover:ring-slate-300 shadow-2xs'
                  }`}
                >
                  {isSelected && isAutoPlaying && !isHovered && (
                    <span
                      key={`rail-${safeIdx}`}
                      aria-hidden="true"
                      className="pb-live-progress absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600"
                    />
                  )}

                  <div className="space-y-2">
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

                    <div className="text-sm font-extrabold text-slate-950 leading-snug group-hover:text-emerald-950 transition-colors">
                      {m.name}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 font-mono text-xs font-bold text-slate-950 tabular-nums">
                    {fmtRate(eff.inputPer1M)} / {fmtRate(eff.outputPer1M)}
                    <span className="text-[11px] font-semibold text-slate-700"> /1M</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Active Milestone Inspector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-slate-300 bg-white p-5 sm:px-7 sm:py-5 shadow-sm">
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
              <span className="font-mono text-xs font-bold text-emerald-900">
                · {formatDateBadge(focusedModel.pricingProvenance?.lastVerified)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-800 font-mono">
              <span>
                In: <strong className="text-slate-950">{fmtRate(focusedRates.inputPer1M)}</strong>/1M
              </span>
              <span>
                Cached:{' '}
                <strong className="text-emerald-950">
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
                <span className="inline-flex items-center gap-1 text-emerald-950 font-bold">
                  <Gauge className="h-3.5 w-3.5" />
                  &lt;{focusedRates.latencyMs}ms
                </span>
              )}
              {typeof focusedRates.tokPerSec === 'number' && (
                <span className="inline-flex items-center gap-1 text-indigo-950 font-bold">
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
