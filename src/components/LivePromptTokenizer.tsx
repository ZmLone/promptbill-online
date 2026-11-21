'use client';

import React, { useState, useMemo } from 'react';
import {
  LLMModel,
  estimatePromptTokensFromText,
  formatCurrency,
} from '../lib/pricingEngine';
import { FileText, ArrowDownToLine, Sparkles } from 'lucide-react';

interface Props {
  models: LLMModel[];
  selectedModel: LLMModel;
  onApplyInputTokens: (tokens: number) => void;
}

const SAMPLE_PROMPT = `You are a senior financial and API infrastructure analyst. Review the attached customer ticket, extract the account tier, error code, and SLA impact, and return a strict JSON summary with remediation steps.`;

export const LivePromptTokenizer: React.FC<Props> = ({
  models,
  selectedModel,
  onApplyInputTokens,
}) => {
  const [promptText, setPromptText] = useState<string>(SAMPLE_PROMPT);

  const stats = useMemo(() => {
    const chars = promptText.length;
    const words = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
    const estimatedTokens = estimatePromptTokensFromText(promptText, selectedModel.provider);
    const singlePromptCost = (estimatedTokens * selectedModel.inputPer1M) / 1_000_000;
    const costAt100kCalls = singlePromptCost * 100_000;

    return { chars, words, estimatedTokens, singlePromptCost, costAt100kCalls };
  }, [promptText, selectedModel]);

  const top3CheapestForPrompt = useMemo(() => {
    return [...models]
      .map((m) => {
        const toks = estimatePromptTokensFromText(promptText, m.provider);
        const cost100k = ((toks * m.inputPer1M) / 1_000_000) * 100_000;
        return { model: m, toks, cost100k };
      })
      .sort((a, b) => a.cost100k - b.cost100k)
      .slice(0, 3);
  }, [models, promptText]);

  return (
    <section id="prompt-tokenizer" className="rounded-2xl border border-slate-800 bg-[#0d121d] p-6 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
            <FileText className="w-3.5 h-3.5" />
            Live Prompt Tokenizer &amp; Bloat Inspector
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Paste Any System Prompt to Measure Exact Token Cost
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Converts raw text into provider-adjusted token counts (GPT vs. Claude vs. Gemini) and lets you push that token count straight into the monthly calculator.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onApplyInputTokens(stats.estimatedTokens)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Use {stats.estimatedTokens.toLocaleString()} Tokens in Calculator
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <textarea
            rows={5}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Paste your system prompt, RAG context chunk, or few-shot examples here..."
            className="w-full rounded-xl border border-slate-700 bg-[#111827] p-4 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-4 font-mono">
              <span>{stats.chars.toLocaleString()} chars</span>
              <span>{stats.words.toLocaleString()} words</span>
              <span className="text-emerald-400 font-semibold">
                ~{stats.estimatedTokens.toLocaleString()} tokens ({selectedModel.provider})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPromptText(SAMPLE_PROMPT)}
              className="text-slate-400 hover:text-white underline"
            >
              Reset sample prompt
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Prompt Input Cost on {selectedModel.name}</span>
              <span className="font-mono text-slate-300">${selectedModel.inputPer1M.toFixed(2)}/1M</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Per single call</div>
                <div className="font-mono text-lg font-bold text-white tabular-nums">
                  {formatCurrency(stats.singlePromptCost)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500">At 100,000 calls/mo</div>
                <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(stats.costAt100kCalls)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1019] p-4 space-y-2">
            <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Lowest Input Spend for This Prompt (100K calls)
            </div>
            {top3CheapestForPrompt.map(({ model, toks, cost100k }) => (
              <div key={model.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-none">
                <span className="text-slate-300">
                  {model.name} <span className="text-slate-500">({toks} tok)</span>
                </span>
                <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                  {formatCurrency(cost100k)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
