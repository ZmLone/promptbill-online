'use client';

import React, { useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { AIModel } from '@/data/fallbackModels';
import { calculateModelCost, estimateTokensFromText } from '@/lib/calculator';

interface Props {
  models: AIModel[];
  initialHighlightSlugs?: string[];
}

interface Preset {
  id: string;
  label: string;
  desc: string;
  dailyRequests: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  cacheHitRate: number;
  useBatchApi: boolean;
}

const WORKLOAD_PRESETS: Preset[] = [
  {
    id: 'support-bot',
    label: 'Customer Support Bot',
    desc: '5K req/day · 70% cached',
    dailyRequests: 5000,
    avgInputTokens: 1500,
    avgOutputTokens: 300,
    cacheHitRate: 0.7,
    useBatchApi: false,
  },
  {
    id: 'coding-agent',
    label: 'AI Coding Agent',
    desc: '2K req/day · 15K in · 80% cached',
    dailyRequests: 2000,
    avgInputTokens: 15000,
    avgOutputTokens: 2000,
    cacheHitRate: 0.8,
    useBatchApi: false,
  },
  {
    id: 'rag-search',
    label: 'RAG Document Search',
    desc: '10K req/day · 8K in · 50% cached',
    dailyRequests: 10000,
    avgInputTokens: 8000,
    avgOutputTokens: 500,
    cacheHitRate: 0.5,
    useBatchApi: false,
  },
  {
    id: 'bulk-extract',
    label: 'Bulk Data Extraction',
    desc: '50K req/day · Batch 50% Off',
    dailyRequests: 50000,
    avgInputTokens: 2000,
    avgOutputTokens: 200,
    cacheHitRate: 0.2,
    useBatchApi: true,
  },
];

export default function CostSimulator({
  models,
  initialHighlightSlugs = [],
}: Props) {
  const [dailyRequests, setDailyRequests] = useState<number>(10000);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(2500);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(600);
  const [cacheHitRate, setCacheHitRate] = useState<number>(0.5);
  const [useBatchApi, setUseBatchApi] = useState<boolean>(false);
  const [samplePrompt, setSamplePrompt] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [activePreset, setActivePreset] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const req = Number(params.get('req'));
    const inp = Number(params.get('in'));
    const out = Number(params.get('out'));
    const cache = Number(params.get('cache'));
    const batch = params.get('batch');
    const prov = params.get('provider');

    if (req >= 100 && req <= 250000) setDailyRequests(req);
    if (inp >= 100 && inp <= 50000) setAvgInputTokens(inp);
    if (out >= 50 && out <= 8000) setAvgOutputTokens(out);
    if (!Number.isNaN(cache) && params.has('cache') && cache >= 0 && cache <= 95) {
      setCacheHitRate(cache / 100);
    }
    if (batch === '1') setUseBatchApi(true);
    if (prov) setProviderFilter(prov);
  }, []);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setDailyRequests(preset.dailyRequests);
    setAvgInputTokens(preset.avgInputTokens);
    setAvgOutputTokens(preset.avgOutputTokens);
    setCacheHitRate(preset.cacheHitRate);
    setUseBatchApi(preset.useBatchApi);
    posthog.capture('workload_preset_selected', {
      preset_id: preset.id,
      uses_batch_api: preset.useBatchApi,
    });
  };

  const handlePromptPaste = (text: string) => {
    setSamplePrompt(text);
    setActivePreset('');
    const tokens = estimateTokensFromText(text);
    if (tokens > 0) setAvgInputTokens(Math.min(50000, Math.max(100, tokens)));
  };

  const copyShareableLink = async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('req', String(dailyRequests));
    url.searchParams.set('in', String(avgInputTokens));
    url.searchParams.set('out', String(avgOutputTokens));
    url.searchParams.set('cache', String(Math.round(cacheHitRate * 100)));
    url.searchParams.set('batch', useBatchApi ? '1' : '0');
    if (providerFilter !== 'ALL') {
      url.searchParams.set('provider', providerFilter);
    } else {
      url.searchParams.delete('provider');
    }

    window.history.replaceState({}, '', url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      posthog.capture('shareable_link_copied', {
        model_count: results.length,
        provider_filter: providerFilter,
        uses_batch_api: useBatchApi,
      });
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // URL bar is still updated even if clipboard permission is denied
    }
  };

  const providers = useMemo(() => {
    return Array.from(new Set(models.map((m) => m.provider)));
  }, [models]);

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
    posthog.capture('cost_estimate_csv_exported', {
      model_count: results.length,
      provider_filter: providerFilter,
      uses_batch_api: useBatchApi,
    });
  };

  const exportPdfQuote = () => {
    const rowsHtml = results
      .map(
        (r) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${r.model.name} <span style="color:#64748b;font-weight:400;">(${r.model.provider})</span></td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${r.model.tier}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">$${r.model.inputPer1M.toFixed(2)} / $${r.model.outputPer1M.toFixed(2)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#059669;">$${r.finalMonthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0284c7;">-$${r.monthlySavings.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI API Cost Estimate — TokenLedger</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 40px; max-width: 900px; margin: auto; }
            h1 { margin: 0 0 8px 0; font-size: 24px; }
            .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .box-label { font-size: 11px; text-transform: uppercase; color: #64748b; }
            .box-val { font-size: 16px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
            th { background: #f1f5f9; padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>AI API Architecture &amp; Monthly Cost Quote</h1>
          <div class="meta">Generated on ${new Date().toLocaleDateString()} via TokenLedger</div>
          <div class="grid">
            <div class="box"><div class="box-label">Monthly Requests</div><div class="box-val">${(dailyRequests * 30).toLocaleString()}</div></div>
            <div class="box"><div class="box-label">Avg Input / Output</div><div class="box-val">${avgInputTokens.toLocaleString()} / ${avgOutputTokens.toLocaleString()}</div></div>
            <div class="box"><div class="box-label">Prompt Cache Hit</div><div class="box-val">${Math.round(cacheHitRate * 100)}%</div></div>
            <div class="box"><div class="box-label">Batch API</div><div class="box-val">${useBatchApi ? 'Enabled' : 'Disabled'}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Tier</th>
                <th>Rate (In / Out per 1M)</th>
                <th>Est. Monthly Bill</th>
                <th>Cache Savings</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">Estimates based on live provider token rates via TokenLedger.</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      posthog.capture('cost_estimate_pdf_exported', {
        model_count: results.length,
        provider_filter: providerFilter,
        uses_batch_api: useBatchApi,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Workload Presets */}
      <div>
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Workload Presets
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WORKLOAD_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-semibold text-white">
                  {preset.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {preset.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <label htmlFor="daily-requests-slider">Daily API Requests</label>
              <span className="font-mono text-emerald-400">
                {dailyRequests.toLocaleString()} / day (
                {(dailyRequests * 30).toLocaleString()}/mo)
              </span>
            </div>
            <input
              id="daily-requests-slider"
              aria-label="Daily API Requests"
              type="range"
              min={100}
              max={250000}
              step={100}
              value={dailyRequests}
              onChange={(e) => {
                setActivePreset('');
                setDailyRequests(Number(e.target.value));
              }}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <label htmlFor="input-tokens-slider">
                Avg Input Tokens / Request
              </label>
              <span className="font-mono text-emerald-400">
                {avgInputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              id="input-tokens-slider"
              aria-label="Average Input Tokens per Request"
              type="range"
              min={100}
              max={50000}
              step={100}
              value={avgInputTokens}
              onChange={(e) => {
                setActivePreset('');
                setAvgInputTokens(Number(e.target.value));
              }}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <label htmlFor="output-tokens-slider">
                Avg Output Tokens / Request
              </label>
              <span className="font-mono text-emerald-400">
                {avgOutputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              id="output-tokens-slider"
              aria-label="Average Output Tokens per Request"
              type="range"
              min={50}
              max={8000}
              step={50}
              value={avgOutputTokens}
              onChange={(e) => {
                setActivePreset('');
                setAvgOutputTokens(Number(e.target.value));
              }}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-200">
              <label htmlFor="cache-hit-slider">Prompt Cache Hit Rate</label>
              <span className="font-mono text-sky-400">
                {Math.round(cacheHitRate * 100)}% cached
              </span>
            </div>
            <input
              id="cache-hit-slider"
              aria-label="Prompt Cache Hit Rate"
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={cacheHitRate}
              onChange={(e) => {
                setActivePreset('');
                setCacheHitRate(Number(e.target.value));
              }}
              className="mt-2 w-full accent-sky-500"
            />
          </div>

          <label
            htmlFor="batch-api-checkbox"
            className="flex items-center gap-3 text-sm text-slate-300"
          >
            <input
              id="batch-api-checkbox"
              type="checkbox"
              checked={useBatchApi}
              onChange={(e) => {
                setActivePreset('');
                setUseBatchApi(e.target.checked);
              }}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span>Use Async Batch / Flex API (up to 50% off supported models)</span>
          </label>
        </div>

        {/* Live Prompt Token Counter */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <label
              htmlFor="prompt-token-input"
              className="block text-sm font-semibold text-slate-200"
            >
              Paste Real System Prompt / JSON Payload
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Automatically updates input tokens above using real-time length estimation.
            </p>
            <textarea
              id="prompt-token-input"
              rows={6}
              value={samplePrompt}
              onChange={(e) => handlePromptPaste(e.target.value)}
              placeholder="Paste your system instructions, RAG context, or few-shot examples here..."
              className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Share & Export Action Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyShareableLink}
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
              >
                {copiedLink ? '✓ Link Copied!' : 'Copy Shareable Link'}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                CSV
              </button>
            </div>
            <button
              type="button"
              onClick={exportPdfQuote}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Export PDF Quote →
            </button>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <h2 className="text-xl font-bold text-white">
          Monthly Cost Comparison ({results.length} Models · Cheapest First)
        </h2>
        <select
          id="provider-filter"
          aria-label="Filter AI models by provider"
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="ALL">All Providers ({models.length})</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
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
                      onClick={() =>
                        posthog.capture('affiliate_link_clicked', {
                          model_slug: row.model.slug,
                          provider: row.model.provider,
                        })
                      }
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
