'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

const SAMPLE_PROMPT =
  'You are a production backend and AI cost analyst. Parse the incoming payload, verify schema constraints, and return a concise structured JSON response.';

export default function TokenCounterPage() {
  const [text, setText] = useState(SAMPLE_PROMPT);
  const [providerStyle, setProviderStyle] = useState<'standard' | 'anthropic' | 'gemini'>('standard');
  const [callsVolume, setCallsVolume] = useState<number>(100_000);

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const divisor = providerStyle === 'anthropic' ? 3.7 : providerStyle === 'gemini' ? 3.8 : 4.0;
  const estTokens = chars > 0 ? Math.max(1, Math.ceil(chars / divisor)) : 0;

  const modelEstimates = useMemo(() => {
    return [...ALL_MODELS]
      .map((m) => {
        const perCallCost = (estTokens * m.inputPer1M) / 1_000_000;
        const cachedPerCallCost = (estTokens * m.cachedInputPer1M) / 1_000_000;
        const volumeCost = perCallCost * Math.max(0, callsVolume);
        return { model: m, perCallCost, cachedPerCallCost, volumeCost };
      })
      .sort((a, b) => a.volumeCost - b.volumeCost)
      .slice(0, 8);
  }, [estTokens, callsVolume]);

  return (
    <SiteShell
      title="LLM Token Counter & Prompt Cost Estimator"
      subtitle="promptbill.online/tools/token-counter · Character, Word & Provider Token Estimation"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
            Paste any system prompt, RAG chunk, or user instruction below to estimate <strong>input token counts</strong> and compare <strong>input vs. cached-read token costs</strong> across models on PromptBill.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Tokenizer Heuristic:</span>
              {[
                { id: 'standard', label: 'Standard (~4.0 chars/tok)' },
                { id: 'anthropic', label: 'Claude Style (~3.7 chars/tok)' },
                { id: 'gemini', label: 'Gemini Style (~3.8 chars/tok)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProviderStyle(opt.id as 'standard' | 'anthropic' | 'gemini')}
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

            <label htmlFor="tc-calls-volume" className="flex items-center gap-2 font-medium text-slate-800">
              <span>Calls for Cost Estimate:</span>
              <input
                id="tc-calls-volume"
                type="number"
                min={1}
                step={10000}
                value={callsVolume}
                onChange={(e) => setCallsVolume(Math.max(1, Number(e.target.value)))}
                className="min-h-[38px] w-32 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-900"
              />
            </label>
          </div>

          <textarea
            rows={6}
            aria-label="Prompt text to count tokens"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs sm:text-sm text-slate-900"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-sm">
            <div className="flex flex-wrap gap-6">
              <span>Characters: <strong>{chars.toLocaleString()}</strong></span>
              <span>Words: <strong>{words.toLocaleString()}</strong></span>
              <span className="text-emerald-800">Est. Input Tokens: <strong>~{estTokens.toLocaleString()}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setText(SAMPLE_PROMPT)}
              className="min-h-[34px] font-sans text-xs font-semibold text-slate-700 underline hover:text-slate-950"
            >
              Reset sample text
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Estimated input token cost and cached read cost for {estTokens} tokens across top models
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                  <th scope="col" className="py-2.5 px-3">Model</th>
                  <th scope="col" className="py-2.5 px-3">Input / 1M</th>
                  <th scope="col" className="py-2.5 px-3">Cached Read / 1M</th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Cost at {callsVolume.toLocaleString()} Calls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono text-xs">
                {modelEstimates.map(({ model: m, cachedPerCallCost, volumeCost }, idx) => (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <th scope="row" className="py-2.5 px-3 font-sans font-semibold text-slate-900 text-left">
                      <Link href={`/models/${m.slug}`} className="hover:text-emerald-800 underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                      <span className="ml-2 text-[11px] font-normal text-slate-700">{m.provider}</span>
                    </th>
                    <td className="py-2.5 px-3 text-slate-800">${m.inputPer1M.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-emerald-800">
                      ${m.cachedInputPer1M.toFixed(2)} (${(cachedPerCallCost * callsVolume).toFixed(2)} at vol)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ${volumeCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
