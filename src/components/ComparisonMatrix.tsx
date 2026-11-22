'use client';

import React, { useState, useMemo } from 'react';
import { LLMModel, CostInputs, calculateModelCost, formatCurrency } from '../lib/pricingEngine';
import {
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  Share2,
  Check,
  Table2,
} from 'lucide-react';

interface Props {
  models: LLMModel[];
  inputs: CostInputs;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

type SortKey = 'monthlyTotalCost' | 'qualityScore' | 'valueScore' | 'inputPer1M' | 'outputPer1M';

export const ComparisonMatrix: React.FC<Props> = ({
  models,
  inputs,
  selectedModelId,
  onSelectModel,
}) => {
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('monthlyTotalCost');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return ['All', ...Array.from(set)];
  }, [models]);

  const rows = useMemo(() => {
    return models
      .filter((m) => {
        const matchesProvider = providerFilter === 'All' || m.provider === providerFilter;
        const matchesTier = tierFilter === 'All' || m.tier === tierFilter;
        const matchesSearch =
          !searchTerm.trim() ||
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.notes.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProvider && matchesTier && matchesSearch;
      })
      .map((model) => ({
        model,
        calc: calculateModelCost(model, inputs),
      }))
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortKey === 'monthlyTotalCost') {
          valA = a.calc.monthlyTotalCost;
          valB = b.calc.monthlyTotalCost;
        } else if (sortKey === 'valueScore') {
          valA = a.calc.valueScore;
          valB = b.calc.valueScore;
        } else {
          valA = a.model[sortKey];
          valB = b.model[sortKey];
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [models, inputs, providerFilter, tierFilter, searchTerm, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'monthlyTotalCost' || key === 'inputPer1M' || key === 'outputPer1M');
    }
  };

  const exportCsv = () => {
    const headers = [
      'Model',
      'Provider',
      'Tier',
      'Context Window',
      'Input $/1M',
      'Cached Input $/1M',
      'Output $/1M',
      'Quality Score',
      'Score per Output $',
      'Cost per Request ($)',
      'Est Monthly Cost ($)',
    ];
    const lines = rows.map(({ model, calc }) =>
      [
        `"${model.name}"`,
        `"${model.provider}"`,
        model.tier,
        model.contextWindow,
        model.inputPer1M.toFixed(2),
        model.cachedInputPer1M.toFixed(2),
        model.outputPer1M.toFixed(2),
        model.qualityScore.toFixed(1),
        calc.valueScore.toFixed(1),
        calc.costPerRequest.toFixed(6),
        calc.monthlyTotalCost.toFixed(2),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptbill-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
      provider_filter: providerFilter,
      tier_filter: tierFilter,
      row_count: rows.length,
    });
      provider_filter: providerFilter,
      tier_filter: tierFilter,
      row_count: rows.length,
    });
    URL.revokeObjectURL(url);
  };

  const copyShareUrl = async () => {
    if (typeof window === 'undefined' || !navigator.clipboard) return;
    const params = new URLSearchParams({
      m: selectedModelId,
      in: String(inputs.inputTokensPerCall),
      out: String(inputs.outputTokensPerCall),
      rsn: String(inputs.reasoningTokensPerCall),
      cpd: String(inputs.callsPerDay),
      cache: String(inputs.cacheHitPercent),
      batch: String(inputs.batchPercent),
      retry: String(inputs.retriesPercent),
    });
    const shareUrl = `${window.location.origin}/?${params.toString()}#workspace`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return;
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <Table2 className="w-3.5 h-3.5" />
            Tool 3 of 4 · 18-Model Leaderboard &amp; Matrix
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Side-by-Side LLM API Cost &amp; Value Matrix
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Click any model row to load it into the Cost Calculator, or export the filtered table as CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyShareUrl}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Scenario URL Copied' : 'Share Scenario'}
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search OpenAI, Claude, Gemini, Grok, Kimi, DeepSeek..."
            className="w-full rounded-xl border border-slate-700 bg-[#131a29] pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          aria-label="Filter by provider"
          className="rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'All Providers' : p}
            </option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          aria-label="Filter by tier"
          className="rounded-xl border border-slate-700 bg-[#131a29] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
        >
          <option value="All">All Tiers</option>
          <option value="Flagship">Flagship</option>
          <option value="Balanced">Balanced</option>
          <option value="Economy">Economy</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left border-collapse min-w-[840px]">
          <thead className="bg-[#111827]">
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3.5">Model &amp; Provider</th>
              <th className="py-3 px-3.5">
                <button
                  type="button"
                  onClick={() => toggleSort('inputPer1M')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  List In / Out <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-3.5">Cache / Context</th>
              <th className="py-3 px-3.5">
                <button
                  type="button"
                  onClick={() => toggleSort('qualityScore')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Quality <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-3.5">
                <button
                  type="button"
                  onClick={() => toggleSort('valueScore')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Score / $ <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-3.5 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('monthlyTotalCost')}
                  className="inline-flex items-center gap-1 ml-auto hover:text-white"
                >
                  Est. Monthly <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {rows.map(({ model, calc }) => {
              const isSelected = model.id === selectedModelId;
              return (
                <tr
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 px-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{model.name}</span>
                      <span className="rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-300">
                        {model.tier}
                      </span>
                      {calc.exceedsContextWindow && (
                        <span
                          title="Total tokens exceed model context window"
                          className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[11px] text-rose-300"
                        >
                          <AlertTriangle className="w-3 h-3" /> Exceeds Context
                        </span>
                      )}
                      {!calc.exceedsContextWindow && calc.triggersLongContextMultiplier && (
                        <span
                          title="Input exceeds 272K long-context threshold (2x input / 1.5x output surcharge)"
                          className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[11px] text-amber-300"
                        >
                          <AlertTriangle className="w-3 h-3" /> 272K+ Surcharge
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {model.provider} · {model.notes}
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-xs text-slate-200 tabular-nums">
                    ${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}{' '}
                    <span className="text-slate-500">/1M</span>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-xs text-slate-300 tabular-nums">
                    Cache ${model.cachedInputPer1M.toFixed(2)} · {model.contextWindow}
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-xs text-slate-200 tabular-nums">
                    {model.qualityScore.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-xs text-emerald-300 tabular-nums">
                    {calc.valueScore.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="font-mono font-bold text-white tabular-nums">
                      {formatCurrency(calc.monthlyTotalCost)}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {formatCurrency(calc.costPerRequest)} / req
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Selecting any row updates the active model in the Cost Calculator tab.
        </span>
        <span>Score/$ = Quality Score ÷ Output $/1M · Rate card verified November 2026.</span>
      </div>
    </div>
  );
};
