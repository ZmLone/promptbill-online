'use client';

import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Why is the cheapest per-token model not always the cheapest model in production?',
    a: 'Reasoning models generate hidden thinking tokens billed at output rates, and verbose models produce 2x–4x more output tokens per answer. PromptBill factors in output token multipliers, prompt cache hit rates, and retry overhead so you see true monthly spend.',
  },
  {
    q: 'How are Tokens, Words, and Characters converted?',
    a: 'On average across English and mixed technical prompts, 1,000 tokens equals roughly 750 words or 4,000 characters. You can switch between Tokens, Words, and Characters directly inside the calculator or paste raw text into the Live Prompt Tokenizer.',
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

export const FaqAndMethodology: React.FC = () => {
  return (
    <section id="methodology" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0d121d] p-6 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
          Pricing Formula &amp; Transparency
        </div>
        <h2 className="text-xl font-bold text-white">How PromptBill Calculates Spend</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Unlike static rate tables, PromptBill computes blended monthly spend using the exact billing rules of major LLM providers:
        </p>
        <div className="rounded-xl border border-slate-800 bg-[#080b12] p-4 font-mono text-xs text-slate-200 space-y-2 leading-relaxed">
          <div>Effective Calls = Calls/Day × 30 × (1 + Retry%)</div>
          <div>Blended Input = ((1 - Cache%) × Input + Cache% × Cached) × BatchMult</div>
          <div>Output Bill = (Output + Reasoning) × OutputRate × BatchMult</div>
          <div className="text-emerald-300">Monthly Total = Input Bill + Output Bill</div>
        </div>
      </div>

      <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0d121d] p-6 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
          LLM API Cost FAQ
        </div>
        <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
        <div className="divide-y divide-slate-800/80">
          {FAQS.map((item) => (
            <div key={item.q} className="py-3.5 first:pt-1 last:pb-1">
              <h3 className="text-sm font-semibold text-white">{item.q}</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
