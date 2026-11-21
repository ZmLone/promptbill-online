'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ALL_MODELS, getModelBySlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export default function ModelDetailPage() {
  const params = useParams<{ slug: string }>();
  const model = getModelBySlug(params?.slug || '') || ALL_MODELS[0];

  const [inputTokens, setInputTokens] = useState(6500);
  const [outputTokens, setOutputTokens] = useState(650);
  const [callsPerDay, setCallsPerDay] = useState(2500);
  const [cacheHitPct, setCacheHitPct] = useState(50);

  const monthlyCalls = Math.max(0, callsPerDay) * 30;
  const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
  const blendedInput = (1 - cacheFrac) * model.inputPer1M + cacheFrac * model.cachedInputPer1M;
  const monthlySpend =
    (monthlyCalls * inputTokens * blendedInput) / 1_000_000 +
    (monthlyCalls * outputTokens * model.outputPer1M) / 1_000_000;

  return (
    <SiteShell
      title={`${model.name} — Benchmarks, Pricing, Rate Limits & Cost Calculator`}
      subtitle={`promptbill.online/models/${model.slug} · ${model.provider}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Benchmark Score</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.score.toFixed(1)}</div>
            <div className="text-[11px] text-slate-500">90% CI {model.interval}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">API Price (In / Out)</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              ${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500">Cache ${model.cachedInputPer1M.toFixed(2)}/1M</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Context &amp; Speed</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.contextWindow}</div>
            <div className="text-[11px] text-emerald-700 font-mono">{model.tokPerSec} tok/s · Elo {model.elo}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Rate Limits</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">{model.rpmLimit}</div>
            <div className="text-[11px] text-slate-600 font-mono">{model.tpmLimit}</div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">Pricing History &amp; Notes</div>
          <p>{model.priceHistoryNote}</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[
            ['AG', model.ag],
            ['CO', model.co],
            ['RE', model.re],
            ['MM', model.mm],
            ['KN', model.kn],
            ['ML', model.ml],
            ['IF', model.if],
            ['MA', model.ma],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white">
              <div className="text-[10px] text-slate-400">{k}</div>
              <div className="text-sm font-bold text-slate-900">{v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            30-Day Cost Calculator for {model.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-600">Input tokens / call</span>
              <input type="number" min={0} value={inputTokens} onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600">Output tokens / call</span>
              <input type="number" min={0} value={outputTokens} onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600">Calls / day</span>
              <input type="number" min={0} value={callsPerDay} onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600">Cache hit %</span>
              <input type="number" min={0} max={95} value={cacheHitPct} onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900" />
            </label>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-600">Estimated Monthly Spend ({monthlyCalls.toLocaleString()} calls)</span>
            <span className="font-mono text-2xl font-bold text-emerald-700">${monthlySpend.toFixed(2)}/mo</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Link href={`/providers/${model.providerSlug}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50">
            More {model.provider} models →
          </Link>
          <Link href="/" className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800">
            Back to Leaderboard
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
