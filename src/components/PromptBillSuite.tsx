'use client';

import React, { useState, useMemo } from 'react';
import leaderboardJson from '../data/leaderboard.json';
import dealsJson from '../data/deals.json';
import {
  Search,
  ArrowUpDown,
  Calculator,
  Sparkles,
  FileText,
  BookOpen,
  Megaphone,
  Tag,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export interface BenchModel {
  rank: number;
  id: string;
  name: string;
  provider: string;
  evidence: 'Supported' | 'Estimated';
  score: number;
  interval: string;
  contextWindow: string;
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M: number;
  elo: number;
  license: 'Closed' | 'Open' | 'Pending';
  ag: number;
  co: number;
  re: number;
  mm: number;
  kn: number;
  ml: number;
  if: number;
  ma: number;
  tokPerSec: number;
  reasoning: boolean;
  categories: string[];
  bestFor: string;
}

export interface DealItem {
  id: string;
  badge: string;
  title: string;
  provider: string;
  savings: string;
  description: string;
  ctaLabel: string;
  useEnvCheckout: boolean;
}

const models = leaderboardJson as BenchModel[];
const deals = dealsJson as DealItem[];

export type ActiveTab =
  | 'leaderboard'
  | 'pricing'
  | 'selector'
  | 'tokenizer'
  | 'deals'
  | 'methodology'
  | 'advertise';

const TABS: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'leaderboard', label: 'Leaderboard', icon: ArrowUpDown },
  { id: 'pricing', label: 'API Pricing & Cost', icon: Calculator },
  { id: 'selector', label: 'LLM Selector', icon: Sparkles },
  { id: 'tokenizer', label: 'Token Counter', icon: FileText },
  { id: 'deals', label: 'Deals', icon: Tag },
  { id: 'methodology', label: 'Methodology', icon: BookOpen },
  { id: 'advertise', label: 'Advertise', icon: Megaphone },
];

export default function PromptBillSuite() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard');

  // Leaderboard filters & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [licenseFilter, setLicenseFilter] = useState<string>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // API Pricing & Cost Calculator inputs
  const [inputTokensPerCall, setInputTokensPerCall] = useState<number>(6500);
  const [outputTokensPerCall, setOutputTokensPerCall] = useState<number>(650);
  const [callsPerDay, setCallsPerDay] = useState<number>(2500);
  const [cacheHitPct, setCacheHitPct] = useState<number>(50);
  const [batchSharePct, setBatchSharePct] = useState<number>(0);

  // LLM Selector priority
  const [selectorGoal, setSelectorGoal] = useState<'balanced' | 'cheapest' | 'coding' | 'reasoning'>('balanced');

  // Token Counter text
  const [promptText, setPromptText] = useState<string>(
    'Summarize the customer support ticket, classify urgency (low, medium, high), and output valid JSON with action items.'
  );

  // Sponsor form
  const [sponsorEmail, setSponsorEmail] = useState<string>('');
  const [sponsorSubmitted, setSponsorSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return models
      .filter((m) => {
        if (
          q &&
          !m.name.toLowerCase().includes(q) &&
          !m.provider.toLowerCase().includes(q) &&
          !m.bestFor.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (licenseFilter !== 'All' && m.license !== licenseFilter) return false;
        if (evidenceFilter !== 'All' && m.evidence !== evidenceFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let va = 0;
        let vb = 0;
        if (sortBy === 'score') {
          va = a.score;
          vb = b.score;
        } else if (sortBy === 'price') {
          va = (a.inputPer1M + a.outputPer1M) / 2;
          vb = (b.inputPer1M + b.outputPer1M) / 2;
        } else if (sortBy === 'elo') {
          va = a.elo;
          vb = b.elo;
        } else if (sortBy === 'tokPerSec') {
          va = a.tokPerSec;
          vb = b.tokPerSec;
        }
        return sortAsc ? va - vb : vb - va;
      });
  }, [searchQuery, licenseFilter, evidenceFilter, sortBy, sortAsc]);

  const computeMonthlyApiCost = (m: BenchModel) => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30;
    const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
    const batchDiscountFactor = 1 - Math.min(1, Math.max(0, batchSharePct / 100)) * 0.5;
    const blendedInputRate =
      ((1 - cacheFrac) * m.inputPer1M + cacheFrac * m.cachedInputPer1M) * batchDiscountFactor;
    const blendedOutputRate = m.outputPer1M * batchDiscountFactor;

    const inputCost = (monthlyCalls * inputTokensPerCall * blendedInputRate) / 1_000_000;
    const outputCost = (monthlyCalls * outputTokensPerCall * blendedOutputRate) / 1_000_000;
    return inputCost + outputCost;
  };

  const pricingRows = useMemo(() => {
    return [...models]
      .map((m) => {
        const monthlyCost = computeMonthlyApiCost(m);
        const monthlyCalls = Math.max(0, callsPerDay) * 30;
        const costPer1k = monthlyCalls > 0 ? (monthlyCost / monthlyCalls) * 1000 : 0;
        return { model: m, monthlyCost, costPer1k };
      })
      .sort((a, b) => a.monthlyCost - b.monthlyCost);
  }, [inputTokensPerCall, outputTokensPerCall, callsPerDay, cacheHitPct, batchSharePct]);

  const selectorPicks = useMemo(() => {
    return [...models]
      .map((m) => {
        const monthlyCost = computeMonthlyApiCost(m);
        let rankMetric = m.score;
        if (selectorGoal === 'cheapest') {
          rankMetric = m.score / Math.max(monthlyCost, 0.25);
        } else if (selectorGoal === 'coding') {
          rankMetric = m.co * 1.5 - monthlyCost * 0.005;
        } else if (selectorGoal === 'reasoning') {
          rankMetric = m.re * 1.5 + m.score * 0.5;
        } else {
          rankMetric = m.score * 0.6 + (200 / Math.max(monthlyCost, 1)) * 40;
        }
        return { model: m, monthlyCost, rankMetric };
      })
      .sort((a, b) => b.rankMetric - a.rankMetric)
      .slice(0, 6);
  }, [selectorGoal, inputTokensPerCall, outputTokensPerCall, callsPerDay, cacheHitPct, batchSharePct]);

  const tokenEstimate = Math.max(1, Math.ceil(promptText.length / 4));
  const wordCount = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleSort = (col: 'score' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(col === 'price');
    }
  };

  const checkoutUrl = process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || '';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-mono text-sm font-bold text-white">
              PB
            </span>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 leading-none">
                PromptBill
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">promptbill.online</div>
            </div>
          </button>

          <nav aria-label="Primary Sections" className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deals')}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Deals
            </button>
          </div>
        </div>

        {/* Mobile Tab Strip */}
        <div
          role="tablist"
          aria-label="Sections"
          className="flex lg:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-1.5 text-xs font-medium"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 rounded-md px-2.5 py-1 ${
                activeTab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Compact Page Title Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Updated November 2026 · promptbill.online
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              LLM Benchmarks, API Token Pricing &amp; Cost Calculators
            </h1>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 1: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <section aria-labelledby="heading-leaderboard" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 id="heading-leaderboard" className="text-xl font-bold text-slate-900">
                  LLM Leaderboard Rankings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AG Agentic · CO Coding · RE Reasoning · MM Multimodal · KN Knowledge · ML Multilingual · IF Instruction · MA Math
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={evidenceFilter}
                  onChange={(e) => setEvidenceFilter(e.target.value)}
                  aria-label="Filter by evidence"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                >
                  <option value="All">All Evidence</option>
                  <option value="Supported">Supported</option>
                  <option value="Estimated">Estimated</option>
                </select>
                <select
                  value={licenseFilter}
                  onChange={(e) => setLicenseFilter(e.target.value)}
                  aria-label="Filter by license"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                >
                  <option value="All">All Licenses</option>
                  <option value="Closed">Closed</option>
                  <option value="Open">Open</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSort('score')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Score <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Context</th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Price (In / Out) <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSort('elo')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Elo <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3 font-mono">AG</th>
                    <th className="py-2.5 px-3 font-mono">CO</th>
                    <th className="py-2.5 px-3 font-mono">RE</th>
                    <th className="py-2.5 px-3 font-mono">MM</th>
                    <th className="py-2.5 px-3 font-mono">KN</th>
                    <th className="py-2.5 px-3 font-mono">ML</th>
                    <th className="py-2.5 px-3 font-mono">IF</th>
                    <th className="py-2.5 px-3 font-mono">MA</th>
                    <th className="py-2.5 px-3 text-right">
                      <button type="button" onClick={() => toggleSort('tokPerSec')} className="inline-flex items-center gap-1 ml-auto hover:text-slate-900">
                        Tok/s <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredModels.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">#{m.rank}</span>
                          <span className="font-semibold text-slate-900">{m.name}</span>
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                            {m.evidence}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {m.provider} · {m.bestFor}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.score.toFixed(1)}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{m.contextWindow}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">
                        ${m.inputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.elo.toFixed(1)}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.ag}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.co}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.re}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.mm}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.kn}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.ml}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.if}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{m.ma}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {m.tokPerSec}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 2: API PRICING & COST */}
        {activeTab === 'pricing' && (
          <section aria-labelledby="heading-pricing" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 id="heading-pricing" className="text-xl font-bold text-slate-900">
                AI API Token Pricing &amp; 30-Day Cost Calculator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Adjust daily requests, token counts, prompt cache hit rate, and batch discount share to estimate real 30-day API spend across models.
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-600 font-medium">Input tokens / call</span>
                  <input
                    type="number"
                    min={0}
                    value={inputTokensPerCall}
                    onChange={(e) => setInputTokensPerCall(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600 font-medium">Output tokens / call</span>
                  <input
                    type="number"
                    min={0}
                    value={outputTokensPerCall}
                    onChange={(e) => setOutputTokensPerCall(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600 font-medium">Calls / day</span>
                  <input
                    type="number"
                    min={0}
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600 font-medium">Prompt cache hit %</span>
                  <input
                    type="number"
                    min={0}
                    max={95}
                    value={cacheHitPct}
                    onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600 font-medium">Batch API share % (50% off)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={batchSharePct}
                    onChange={(e) => setBatchSharePct(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[740px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                    <th className="py-2.5 px-3">Model &amp; Provider</th>
                    <th className="py-2.5 px-3">Base Input / Cached / Output ($/1M)</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Cost / 1K Calls</th>
                    <th className="py-2.5 px-3 text-right">Est. 30-Day Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pricingRows.map(({ model, monthlyCost, costPer1k }) => (
                    <tr key={model.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{model.name}</div>
                        <div className="text-xs text-slate-500">{model.provider}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">
                        ${model.inputPer1M.toFixed(2)} / ${model.cachedInputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">{model.score.toFixed(1)}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">${costPer1k.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ${monthlyCost.toFixed(2)}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 3: LLM SELECTOR */}
        {activeTab === 'selector' && (
          <section aria-labelledby="heading-selector" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            <div>
              <h2 id="heading-selector" className="text-xl font-bold text-slate-900">
                LLM Selector — Match a Model to Your Priority
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Select your optimization goal to rank top models for your current token volume.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['balanced', 'Balanced Score & Cost'],
                  ['cheapest', 'Lowest Monthly Spend'],
                  ['coding', 'Coding Strength'],
                  ['reasoning', 'Reasoning & Benchmark Score'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectorGoal(key)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold border ${
                    selectorGoal === key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectorPicks.map(({ model, monthlyCost }, idx) => (
                <div key={model.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-700">RECOMMENDED #{idx + 1}</span>
                    <span className="font-mono text-slate-600">Score {model.score.toFixed(1)}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{model.name}</div>
                  <div className="text-xs text-slate-600">{model.bestFor}</div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-600">Est. 30-Day Cost</span>
                    <span className="font-bold text-slate-900">${monthlyCost.toFixed(2)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: TOKEN COUNTER */}
        {activeTab === 'tokenizer' && (
          <section aria-labelledby="heading-tokenizer" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
            <div>
              <h2 id="heading-tokenizer" className="text-xl font-bold text-slate-900">
                Live Prompt Token Counter
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Paste any prompt or system message to estimate characters, words, tokens, and input API cost.
              </p>
            </div>

            <textarea
              rows={5}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />

            <div className="flex flex-wrap gap-6 font-mono text-sm">
              <span>Characters: <strong>{promptText.length.toLocaleString()}</strong></span>
              <span>Words: <strong>{wordCount.toLocaleString()}</strong></span>
              <span className="text-emerald-700">Est. Tokens: <strong>~{tokenEstimate.toLocaleString()}</strong></span>
            </div>
          </section>
        )}

        {/* SECTION 5: DEALS */}
        {activeTab === 'deals' && (
          <section aria-labelledby="heading-deals" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            <div>
              <h2 id="heading-deals" className="text-xl font-bold text-slate-900">
                API Savings, Discounts &amp; Pro Deals
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Ways to lower your LLM API bill through batch discounts, prompt caching, smart routing, and Pro tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deals.map((deal) => (
                <div key={deal.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono font-semibold text-emerald-900">
                        {deal.badge}
                      </span>
                      <span className="text-slate-500">{deal.provider}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{deal.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{deal.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-800">{deal.savings}</span>
                    {deal.useEnvCheckout && checkoutUrl ? (
                      <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        {deal.ctaLabel}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(deal.id === 'deal-model-routing' ? 'selector' : 'pricing')
                        }
                        className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        {deal.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: METHODOLOGY */}
        {activeTab === 'methodology' && (
          <section aria-labelledby="heading-methodology" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div>
              <h2 id="heading-methodology" className="text-xl font-bold text-slate-900">
                Scoring Methodology &amp; Pricing Formula
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                How PromptBill calculates composite scores, confidence intervals, and monthly API cost estimates.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 space-y-1.5">
              <div>Monthly Calls = Calls/Day × 30</div>
              <div>Blended Input Rate = ((1 - Cache%) × Input$/1M + Cache% × Cached$/1M) × BatchFactor</div>
              <div>Estimated Monthly Cost = (MonthlyCalls × InputTokens × BlendedInputRate + MonthlyCalls × OutputTokens × OutputRate) / 1,000,000</div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Supported rows reflect verified benchmark coverage; Estimated rows carry wider uncertainty intervals.</span>
            </div>
          </section>
        )}

        {/* SECTION 7: ADVERTISE */}
        {activeTab === 'advertise' && (
          <section aria-labelledby="heading-advertise" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div>
              <h2 id="heading-advertise" className="text-xl font-bold text-slate-900">
                Advertise &amp; Sponsorships on PromptBill
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Reach developers and engineering teams actively comparing LLM API pricing, latency, and models.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (sponsorEmail.trim()) setSponsorSubmitted(true);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                value={sponsorEmail}
                onChange={(e) => setSponsorEmail(e.target.value)}
                placeholder="Work email for sponsorship details..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {sponsorSubmitted ? 'Request Received' : 'Request Media Kit'}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="font-medium text-slate-700">
            PromptBill (<a href="https://promptbill.online" className="underline">https://promptbill.online</a>) · All rights reserved
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/sitemap.xml" className="inline-flex items-center gap-1 hover:text-slate-900">
              Sitemap <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/llms.txt" className="inline-flex items-center gap-1 hover:text-slate-900">
              llms.txt <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
