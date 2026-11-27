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
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const providers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) {
      counts.set(m.provider, (counts.get(m.provider) ?? 0) + 1);
    }
    return ['All', ...Array.from(counts.keys()).slice(0, 5)];
  }, [models]);

  const timelineModels = useMemo(() => {
    const filtered =
      providerFilter === 'All'
        ? models
        : models.filter((m) => m.provider === providerFilter);
    return [...filtered]
      .sort((a, b) => {
        const dA = a.pricingProvenance?.lastVerified ?? '';
        const dB = b.pricingProvenance?.lastVerified ?? '';
        return dB.localeCompare(dA);
      })
      .slice(0, 6);
  }, [models, providerFilter]);

  const safeIdx = activeIndex < timelineModels.length ? activeIndex : 0;
  const focusedModel = timelineModels[safeIdx] ?? timelineModels[0];

  if (!focusedModel) return null;

  const focusedRates = getEffectiveModelRates(focusedModel, 'cheapest');

  return (
    <section aria-labelledby="new-models-timeline-heading" className="space-y-6">
      {/* Header & Interactive Lab Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Release Stream</span>
          </p>
          <h2
            id="new-models-timeline-heading"
            className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
          >
            New Model Timeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Select any release node on the timeline to inspect live token rates, speed, or load it directly into the calculator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {providers.map((prov) => {
            const selected = providerFilter === prov;
            return (
              <button
                key={prov}
                type="button"
                onClick={() => {
                  setProviderFilter(prov);
                  setActiveIndex(0);
                }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all ${
                  selected
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-950'
                }`}
              >
                {prov !== 'All' && <ProviderLogo provider={prov} size="sm" />}
                <span>{prov}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Interactive Timeline Track */}
      <div className="relative pt-2">
        {/* Continuous Gradient Rail on Desktop */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute top-[22px] inset-x-4 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 via-sky-500/60 to-violet-500/30"
        />

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-3">
          {timelineModels.map((m, idx) => {
            const eff = getEffectiveModelRates(m, 'cheapest');
            const isSelected = idx === safeIdx;
            const dateBadge = formatDateBadge(m.pricingProvenance?.lastVerified);

            return (
              <li key={m.id} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-pressed={isSelected}
                  className={`w-full text-left group rounded-2xl p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white ring-2 ring-slate-950 shadow-md'
                      : 'bg-white/65 hover:bg-white ring-1 ring-slate-200/80 hover:ring-slate-300'
                  }`}
                >
                  {/* Node Dot + Timestamp */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-3 w-3 rounded-full transition-transform ${
                          isSelected
                            ? 'bg-emerald-500 scale-110 ring-4 ring-emerald-500/20'
                            : idx === 0
                              ? 'bg-emerald-600'
                              : 'bg-slate-300 group-hover:bg-slate-600'
                        }`}
                      />
                      <time className="font-mono text-[11px] font-semibold text-slate-500">
                        {dateBadge}
                      </time>
                    </span>

                    {idx === 0 && (
                      <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Provider Logo + Name */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <ProviderLogo provider={m.provider} size="sm" />
                    <span className="text-[11px] font-medium text-slate-500 truncate">
                      {m.provider}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-950 truncate group-hover:text-emerald-800 transition-colors">
                    {m.name}
                  </div>

                  <div className="mt-1.5 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                    {fmtRate(eff.inputPer1M)} / {fmtRate(eff.outputPer1M)}
                    <span className="text-[10px] font-normal text-slate-400"> /1M</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Interactive Spotlight Strip for the Selected Timeline Model */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-5 sm:px-7 sm:py-5 shadow-md">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <ProviderLogo provider={focusedModel.provider} size="lg" />
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
