'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

type TaskGoal = 'all' | 'coding' | 'reasoning' | 'classification' | 'fast';

export default function LlmSelectorPage() {
  const [goal, setGoal] = useState<TaskGoal>('all');
  const [maxOutputPrice, setMaxOutputPrice] = useState<number>(40);
  const [minScore, setMinScore] = useState<number>(70);
  const [openWeightOnly, setOpenWeightOnly] = useState<boolean>(false);

  const filtered = useMemo(() => {
    return ALL_MODELS
      .filter((m) => {
        if (m.outputPer1M > maxOutputPrice) return false;
        if (m.score < minScore) return false;
        if (openWeightOnly && m.license !== 'Open') return false;
        if (goal === 'coding') return m.co >= 78 || m.bestFor.toLowerCase().includes('cod');
        if (goal === 'reasoning') return m.re >= 80 || m.ag >= 80;
        if (goal === 'classification') return m.outputPer1M <= 4.0 || m.bestFor.toLowerCase().includes('class');
        if (goal === 'fast') return m.tokPerSec >= 150;
        return true;
      })
      .sort((a, b) => {
        if (goal === 'coding') return b.co - a.co;
        if (goal === 'reasoning') return b.re - a.re;
        if (goal === 'fast') return b.tokPerSec - a.tokPerSec;
        if (goal === 'classification') return a.outputPer1M - b.outputPer1M;
        return b.score - a.score;
      });
  }, [goal, maxOutputPrice, minScore, openWeightOnly]);

  return (
    <SiteShell
      title="Interactive LLM Selector — Find the Best Model by Task, Budget & Speed"
      subtitle="promptbill.online/tools/llm-selector · Workload Filtering, API Pricing & GEO Guide"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
            Use the <strong>LLM Selector</strong> to filter models by workload goal (<strong>Coding</strong>,{' '}
            <strong>Reasoning</strong>, <strong>Classification / Low Cost</strong>, or <strong>High Speed</strong>), maximum output token price, minimum benchmark score, and open-weight vs. closed licensing.
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'All Top Models' },
              { id: 'coding', label: 'Best for Coding' },
              { id: 'reasoning', label: 'Deep Reasoning & Agents' },
              { id: 'classification', label: 'Low-Cost Classification & RAG' },
              { id: 'fast', label: 'Fastest Speed (150+ Tok/s)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGoal(tab.id as TaskGoal)}
                className={`min-h-[38px] rounded-lg px-3.5 py-2 font-semibold transition-colors ${
                  goal === tab.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
              <div className="flex justify-between font-medium text-slate-800">
                <span>Max Output Price</span>
                <span className="font-mono font-bold text-slate-900">${maxOutputPrice.toFixed(2)} / 1M</span>
              </div>
              <input
                type="range"
                aria-label="Maximum output price per 1M tokens"
                min={1}
                max={40}
                step={0.5}
                value={maxOutputPrice}
                onChange={(e) => setMaxOutputPrice(Number(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
              <div className="flex justify-between font-medium text-slate-800">
                <span>Min Benchmark Score</span>
                <span className="font-mono font-bold text-slate-900">{minScore}+</span>
              </div>
              <input
                type="range"
                aria-label="Minimum benchmark score"
                min={65}
                max={92}
                step={1}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Open-Weight Only</div>
                <div className="text-[11px] text-slate-700">Show open-weight models</div>
              </div>
              <button
                type="button"
                aria-pressed={openWeightOnly}
                onClick={() => setOpenWeightOnly((prev) => !prev)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 font-semibold ${
                  openWeightOnly
                    ? 'bg-emerald-800 text-white'
                    : 'border border-slate-300 bg-white text-slate-800'
                }`}
              >
                {openWeightOnly ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-700">
            Showing <strong>{filtered.length}</strong> matching models
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700 space-y-2">
              <p>No models matched those exact filters.</p>
              <button
                type="button"
                onClick={() => {
                  setGoal('all');
                  setMaxOutputPrice(40);
                  setMinScore(70);
                  setOpenWeightOnly(false);
                }}
                className="min-h-[38px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <article key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3 hover:border-emerald-400">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/models/${m.slug}`} className="font-bold text-base text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span className="font-mono text-xs font-bold text-emerald-800">Score {m.score.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {m.provider} · {m.license} · {m.contextWindow} ctx · {m.tokPerSec} tok/s
                    </div>
                    <p className="text-xs text-slate-700">{m.bestFor}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">
                      ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)} per 1M
                    </span>
                    <Link href={`/models/${m.slug}`} className="inline-flex min-h-[32px] items-center font-semibold text-emerald-800 hover:underline">
                      Calculator -&gt;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <Link href="/best-llms-for-coding" className="inline-flex min-h-[36px] items-center text-emerald-800 hover:underline">
              Best LLMs for Coding -&gt;
            </Link>
            <Link href="/cheapest-llms-for-classification" className="inline-flex min-h-[36px] items-center text-emerald-800 hover:underline">
              Cheapest for Classification -&gt;
            </Link>
            <Link href="/tools/routing-simulator" className="inline-flex min-h-[36px] items-center text-emerald-800 hover:underline">
              Test Hybrid Routing -&gt;
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
