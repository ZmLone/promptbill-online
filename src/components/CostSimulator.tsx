'use client';

import React, { useMemo, useState } from 'react';
import { AIModel } from '@/data/fallbackModels';
import { calculateModelCost, estimateTokensFromText } from '@/lib/calculator';

interface Props {
  models: AIModel[];
  initialHighlightSlugs?: string[];
  lemonSqueezyCheckoutUrl?: string;
}

export default function CostSimulator({
  models,
  initialHighlightSlugs = [],
  lemonSqueezyCheckoutUrl = 'https://YOUR_STORE.lemonsqueezy.com',
}: Props) {
  const [dailyRequests, setDailyRequests] = useState<number>(10000);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(2500);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(600);
  const [cacheHitRate, setCacheHitRate] = useState<number>(0.5);
  const [useBatchApi, setUseBatchApi] = useState<boolean>(false);
  const [samplePrompt, setSamplePrompt] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');

  const handlePromptPaste = (text: string) => {
    setSamplePrompt(text);
    const tokens = estimateTokensFromText(text);
    if (tokens > 0) setAvgInputTokens(tokens);
  };

  const results = useMemo(() => {
    const filtered =
      providerFilter === 'ALL'
        ? models
        : models.filter((m) => m.provider === providerFilter);

    const calculated = filtered.map((model) =>
      calculateModelCost(model, {
        dailyRequests,
        avgInputTokens,
        avgOutputTokens,
        cacheHitRate,
        useBatchApi,
      })
    );

    return calculated.sort((a, b) => {
      const aPin = initialHighlightSlugs.includes(a.model.slug) ? -1 : 0;
      const bPin = initialHighlightSlugs.includes(b.model.slug) ? -1 : 0;
      if (aPin !== bPin) return aPin - bPin;
      return a.finalMonthlyCost - b.finalMonthlyCost;
    });
  }, [
    models,
    providerFilter,
    dailyRequests,
    avgInputTokens,
    avgOutputTokens,
    cacheHitRate,
    useBatchApi,
    initialHighlightSlugs,
  ]);

  const exportCsv = () => {
    const headers = [
      'Model,Provider,Tier,Monthly Cost ($),Cache Savings ($),Cost per 1K Req ($)',
    ];
    const rows = results.map(
      (r) =>
        `"${r.model.name}",${r.model.provider},${r.model.tier},${r.finalMonthlyCost.toFixed(
          2
        )},${r.monthlySavings.toFixed(2)},${r.costPer1kRequests.toFixed(4)}`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-api-cost-estimate-${dailyRequests}req.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Controls Grid */}
      <div className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <span>Daily API Requests</span>
              <span className="font-mono text-emerald-400">
                {dailyRequests.toLocaleString()} / day (
                {(dailyRequests * 30).toLocaleString()}/mo)
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={250000}
              step={100}
              value={dailyRequests}
              onChange={(e) => setDailyRequests(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <span>Avg Input Tokens / Request</span>
              <span className="font-mono text-emerald-400">
                {avgInputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={50000}
              step={100}
              value={avgInputTokens}
              onChange={(e) => setAvgInputTokens(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <span>Avg Output Tokens / Request</span>
              <span className="font-mono text-emerald-400">
                {avgOutputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={8000}
              step={50}
              value={avgOutputTokens}
              onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <span>Prompt Cache Hit Rate</span>
              <span className="font-mono text-sky-400">
                {Math.round(cacheHitRate * 100)}% cached
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={cacheHitRate}
              onChange={(e) => setCacheHitRate(Number(e.target.value))}
              className="mt-2 w-full accent-sky-500"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={useBatchApi}
              onChange={(e) => setUseBatchApi(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span>Use Async Batch / Flex API (50% off token rates)</span>
          </label>
        </div>

        {/* Live Prompt Token Counter */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Paste Real System Prompt / JSON Payload
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Automatically updates input tokens above using real-time length estimation.
            </p>
            <textarea
              rows={6}
              value={samplePrompt}
              onChange={(e) => handlePromptPaste(e.target.value)}
              placeholder="Paste your system instructions, RAG context, or few-shot examples here..."
              className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Monetization Action Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
            <button
              onClick={exportCsv}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              Download Free CSV
            </button>
            <a
              href={lemonSqueezyCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Export Client-Ready CTO Quote ($9) →
            </a>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">
          Monthly Cost Comparison (Cheapest First)
        </h2>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="ALL">All Providers</option>
          <option value="OpenAI">OpenAI</option>
          <option value="Anthropic">Anthropic</option>
          <option value="Google">Google</option>
        </select>
      </div>

      {/* Comparison Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Input / Output (1M)</th>
              <th className="px-4 py-3">Monthly Bill</th>
              <th className="px-4 py-3">Cache Savings</th>
              <th className="px-4 py-3 text-right">Deploy / Credits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {results.map((row) => {
              const isHighlighted = initialHighlightSlugs.includes(row.model.slug);
              return (
                <tr
                  key={row.model.id}
                  className={
                    isHighlighted ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                  }
                >
                  <td className="px-4 py-3.5 font-semibold text-white">
                    {row.model.name}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {row.model.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                      {row.model.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    ${row.model.inputPer1M.toFixed(2)} / $
                    {row.model.outputPer1M.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-base font-bold text-emerald-400">
                    $
                    {row.finalMonthlyCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-sky-400">
                    -${row.monthlySavings.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <a
                      href={row.model.affiliateUrl}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                      className="inline-block rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                    >
                      {row.model.affiliateLabel}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
