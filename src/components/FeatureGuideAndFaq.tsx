'use client';

import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Calculator,
  FileText,
  Table2,
  GitBranch,
  ArrowRight,
} from 'lucide-react';

export type WorkspaceTab = 'calculator' | 'tokenizer' | 'matrix' | 'routing';

interface Props {
  onJumpToTab: (tab: WorkspaceTab) => void;
}

const GUIDE_CARDS: {
  step: string;
  tab: WorkspaceTab;
  title: string;
  summary: string;
  cta: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    step: '01',
    tab: 'calculator',
    title: 'Monthly Cost & SaaS Margin Calculator',
    summary:
      'Enter daily requests, input/output length (in Tokens, Words, or Characters), cache hit %, batch share, and retry buffer to compute 30-day spend and AI SaaS gross margin.',
    cta: 'Open Calculator',
    icon: Calculator,
  },
  {
    step: '02',
    tab: 'tokenizer',
    title: 'Live Prompt Tokenizer & Bloat Check',
    summary:
      'Paste any real system prompt or RAG chunk to count characters, words, and provider-adjusted tokens, then inject that token count straight into your monthly forecast.',
    cta: 'Open Tokenizer',
    icon: FileText,
  },
  {
    step: '03',
    tab: 'matrix',
    title: '18-Model Leaderboard & CSV Export',
    summary:
      'Compare OpenAI, Claude, Gemini, xAI Grok, Kimi, DeepSeek, and Qwen side by side—sorted by monthly cost or Score/$ ratio—with 1-click CSV export and shareable links.',
    cta: 'Compare All Models',
    icon: Table2,
  },
  {
    step: '04',
    tab: 'routing',
    title: 'Hybrid Model Routing Simulator',
    summary:
      'Test sending 50%–85% of routine classification and lookup requests to an economy model while reserving flagship reasoning for complex edge cases.',
    cta: 'Simulate Routing',
    icon: GitBranch,
  },
];

const FAQS = [
  {
    q: 'Why is the cheapest per-token model not always the cheapest model in production?',
    a: 'Reasoning models generate hidden thinking tokens billed at output rates, and verbose models produce 2x–4x more output tokens per answer. PromptBill factors in output token multipliers, prompt cache hit rates, and retry overhead so you see true monthly spend.',
  },
  {
    q: 'How are Tokens, Words, and Characters converted?',
    a: 'On average across English and mixed technical prompts, 1,000 tokens equals roughly 750 words or 4,000 characters. Switch between Tokens, Words, and Characters in the Cost Calculator or paste raw text into the Live Prompt Tokenizer.',
  },
  {
    q: 'How do Prompt Caching and Batch API discounts stack?',
    a: 'Cached input reads typically cost 90%–95% less than uncached input tokens. Asynchronous Batch APIs apply an additional 50% discount across both input and output tokens for non-realtime workloads.',
  },
  {
    q: 'What is the Score / $ column in the comparison matrix?',
    a: 'Score / $ divides each model’s independent quality benchmark score by its output token rate per 1M tokens—highlighting models like Qwen 3.7 Flash, DeepSeek V4.1 Flash, and Gemini 4 Carbon that deliver strong accuracy per dollar.',
  },
];

export const FeatureGuideAndFaq: React.FC<Props> = ({ onJumpToTab }) => {
  return (
    <div className="space-y-12">
      {/* Clear Guide to All 4 Tools */}
      <section id="feature-guide" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Platform Guide
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Four Integrated Tools in One Clean Workspace
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Click any card below to jump straight to that tool
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GUIDE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.tab}
                type="button"
                onClick={() => onJumpToTab(card.tab)}
                className="group text-left rounded-2xl border border-slate-800 bg-[#0d121d] p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-[#101726] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-500">STEP {card.step}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{card.summary}</p>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Formula + FAQ */}
      <section id="methodology" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0d121d] p-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Pricing Formula &amp; Transparency
          </div>
          <h2 className="text-xl font-bold text-white">How PromptBill Calculates Spend</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            PromptBill computes blended monthly spend using the exact billing rules of major LLM providers:
          </p>
          <div className="rounded-xl border border-slate-800 bg-[#080b12] p-4 font-mono text-xs text-slate-300 space-y-2 leading-relaxed">
            <div>Effective Calls = Calls/Day × 30 × (1 + Retry%)</div>
            <div>Blended Input = ((1 - Cache%) × Input + Cache% × Cached) × BatchMult</div>
            <div>Output Bill = (Output + Reasoning) × OutputRate × BatchMult</div>
            <div className="text-emerald-400">Monthly Total = Input Bill + Output Bill</div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0d121d] p-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            LLM API Cost FAQ
          </div>
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-800/80">
            {FAQS.map((item) => (
              <div key={item.q} className="py-3.5 first:pt-1 last:pb-1">
                <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
