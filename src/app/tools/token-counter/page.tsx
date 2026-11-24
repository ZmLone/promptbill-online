'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { estimatePromptTokensFromText, formatCurrency } from '../../../lib/pricingEngine';

const SAMPLE_PROMPT =
  'Summarize the payload, extract key fields, and return a concise structured response.';

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function TokenCounterPage() {
  const [text, setText] = useState<string>(SAMPLE_PROMPT);
  const [providerStyle, setProviderStyle] = useState<'standard' | 'anthropic' | 'gemini'>('standard');
  const [callsVolume, setCallsVolume] = useState<number>(100_000);

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const providerHint =
    providerStyle === 'anthropic'
      ? 'Anthropic'
      : providerStyle === 'gemini'
      ? 'Google Gemini'
      : 'Standard';
  const estTokens = chars > 0 ? estimatePromptTokensFromText(text, providerHint) : 0;

  const modelEstimates = useMemo(() => {
    return [...ALL_MODELS]
      .map((m) => {
        const hasIn = typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M);
        const hasCached =
          typeof m.cachedInputPer1M === 'number' && Number.isFinite(m.cachedInputPer1M);

        const perCallCost = hasIn ? (estTokens * (m.inputPer1M as number)) / 1_000_000 : null;
        const cachedPerCallCost = hasCached
          ? (estTokens * (m.cachedInputPer1M as number)) / 1_000_000
          : null;
        const volumeCost =
          perCallCost !== null ? perCallCost * Math.max(0, callsVolume) : null;
        const cachedVolumeCost =
          cachedPerCallCost !== null ? cachedPerCallCost * Math.max(0, callsVolume) : null;

        return {
          model: m,
          perCallCost,
          cachedPerCallCost,
          volumeCost,
          cachedVolumeCost,
        };
      })
      .sort((a, b) => {
        if (a.volumeCost === null && b.volumeCost === null) return 0;
        if (a.volumeCost === null) return 1;
        if (b.volumeCost === null) return -1;
        return a.volumeCost - b.volumeCost;
      })
      .slice(0, 8);
  }, [estTokens, callsVolume]);

  return (
    <SiteShell
      title="Estimated LLM Token Counter & Input Cost Estimator"
      subtitle="promptbill.online/tools/token-counter · Heuristic Token Estimates & Cost"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1">
            <p>
              <strong>Estimated token count:</strong> Counts are character-length approximations, not exact model tokenizer outputs; actual token counts vary across code, JSON, languages, and special characters.
            </p>
            <p className="text-xs text-slate-700">
              Text is processed locally in your browser and is not sent to a server by this tool.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Heuristic:</span>
              {[
                { id: 'standard', label: 'Standard (~4.0 chars/tok)' },
                { id: 'anthropic', label: 'Anthropic heuristic (~3.7 chars/tok)' },
                { id: 'gemini', label: 'Gemini heuristic (~3.8 chars/tok)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setProviderStyle(opt.id as 'standard' | 'anthropic' | 'gemini')
                  }
                  className={`min-h-[36px] rounded-lg px-3 py-1.5 font-medium ${
                    providerStyle === opt.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label
              htmlFor="tc-calls-volume"
              className="flex items-center gap-2 font-medium text-slate-800"
            >
              <span>Calls for Estimate:</span>
              <input
                id="tc-calls-volume"
                type="number"
                min={0}
                step={10000}
                value={callsVolume}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  setCallsVolume(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
                }}
                className="min-h-[38px] w-32 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-900"
              />
            </label>
          </div>

          <textarea
            rows={6}
            aria-label="Prompt text for estimated token count"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs sm:text-sm text-slate-900"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-sm">
            <div className="flex flex-wrap gap-6">
              <span>
                Characters: <strong>{chars.toLocaleString()}</strong>
              </span>
              <span>
                Words: <strong>{words.toLocaleString()}</strong>
              </span>
              <span className="text-emerald-800">
                Estimated token count: <strong>~{estTokens.toLocaleString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setText('')}
                className="min-h-[34px] font-sans text-xs font-semibold text-slate-700 underline hover:text-slate-950"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setText(SAMPLE_PROMPT)}
                className="min-h-[34px] font-sans text-xs font-semibold text-slate-700 underline hover:text-slate-950"
              >
                Reset sample
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Estimated input token cost for ~{estTokens} estimated tokens across models
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                  <th scope="col" className="py-2.5 px-3">Model</th>
                  <th scope="col" className="py-2.5 px-3">Input / 1M</th>
                  <th scope="col" className="py-2.5 px-3">Cached Read / 1M</th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Est. Cost ({callsVolume.toLocaleString()} Calls)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono text-xs">
                {modelEstimates.map(
                  ({ model: m, cachedVolumeCost, volumeCost }, idx) => (
                    <tr
                      key={m.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <th
                        scope="row"
                        className="py-2.5 px-3 font-sans font-semibold text-slate-900 text-left"
                      >
                        <Link
                          href={`/models/${m.slug}`}
                          className="hover:text-emerald-800 underline-offset-2 hover:underline"
                        >
                          {m.name}
                        </Link>
                        <span className="ml-2 text-[11px] font-normal text-slate-700">
                          {m.provider}
                        </span>
                      </th>
                      <td className="py-2.5 px-3 text-slate-800">
                        {fmtRate(m.inputPer1M)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800">
                        {fmtRate(m.cachedInputPer1M)}
                        {cachedVolumeCost !== null
                          ? ` (${formatCurrency(cachedVolumeCost)} at vol)`
                          : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {volumeCost !== null ? formatCurrency(volumeCost) : 'N/A'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
