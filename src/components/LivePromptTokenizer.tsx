'use client';

import React, { useState, useMemo } from 'react';
import {
  type LLMModel,
  estimatePromptTokensFromText,
  formatCurrency,
} from '../lib/pricingEngine';
import { FileText, ArrowDownToLine, Sparkles } from 'lucide-react';

interface Props {
  models: LLMModel[];
  selectedModel: LLMModel;
  onApplyInputTokens: (tokens: number) => void;
}

const SAMPLE_PROMPT = `You are a technical analyst. Summarize the attached payload, identify any API rate-limit or timeout errors, and return structured JSON.`;

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
    const hasPrice = typeof selectedModel.inputPer1M === 'number' && Number.isFinite(selectedModel.inputPer1M);
    const rate = hasPrice ? (selectedModel.inputPer1M as number) : null;
    const singlePromptCost = rate !== null ? (estimatedTokens * rate) / 1_000_000 : null;
    const costAt100kCalls = singlePromptCost !== null ? singlePromptCost * 100_000 : null;

    return { chars, words, estimatedTokens, singlePromptCost, costAt100kCalls, rate };
  }, [promptText, selectedModel]);

  const top3CheapestForPrompt = useMemo(() => {
    return models
      .filter((m) => typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M))
      .map((m) => {
        const toks = estimatePromptTokensFromText(promptText, m.provider);
        const cost100k = ((toks * (m.inputPer1M as number)) / 1_000_000) * 100_000;
        return { model: m, toks, cost100k };
      })
      .sort((a, b) => a.cost100k - b.cost100k)
      .slice(0, 3);
  }, [models, promptText]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
            <FileText className="w-3.5 h-3.5" />
            Estimated Prompt Token Counter
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Estimate Prompt Tokens &amp; Input Cost
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Estimated token counts use character-length heuristics by provider; actual token counts vary by tokenizer, code, JSON, and special characters. Text stays in your browser.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onApplyInputTokens(stats.estimatedTokens)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Apply ~{stats.estimatedTokens.toLocaleString()} Est. Tokens
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <textarea
            rows={6}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Paste your prompt or context text here..."
            className="w-full rounded-xl border border-slate-700 bg-[#111827] p-4 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-4 font-mono">
              <span>{stats.chars.toLocaleString()} chars</span>
              <span>{stats.words.toLocaleString()} words</span>
              <span className="text-emerald-400 font-semibold">
                Est. ~{stats.estimatedTokens.toLocaleString()} tokens
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
              <span>Est. Prompt Input Cost on {selectedModel.name}</span>
              <span className="font-mono text-slate-300">
                {stats.rate !== null ? `$${stats.rate.toFixed(2)}/1M` : 'N/A'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Per call</div>
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
              Lowest Listed Input Cost (100K calls)
            </div>
            {top3CheapestForPrompt.map(({ model, toks, cost100k }) => (
              <div
                key={model.id}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-none"
              >
                <span className="text-slate-300">
                  {model.name} <span className="text-slate-500">(~{toks} tok)</span>
                </span>
                <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                  {formatCurrency(cost100k)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
