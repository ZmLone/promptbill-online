'use client';

import React, { useState, useMemo } from 'react';
import leaderboardJson from '../data/leaderboard.json';
import releasesJson from '../data/releases.json';
import blogJson from '../data/blog.json';
import {
  Search,
  ArrowUpDown,
  Database,
  Sparkles,
  Megaphone,
  Calculator,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Layers,
  Server,
} from 'lucide-react';

export interface BenchModel {
  rank: number;
  id: string;
  name: string;
  provider: string;
  evidence: 'Supported' | 'Estimated';
  score: number;
  interval: string;
  params: string;
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
  latency: string;
  status: 'Current' | 'Superseded';
  reasoning: boolean;
  categories: string[];
  bestFor: string;
}

const models = leaderboardJson as BenchModel[];

type SectionView = 'leaderboard' | 'pricing' | 'selector' | 'tokenizer' | 'methodology' | 'advertise';

const CAPABILITY_LINKS: { id: string; label: string }[] = [
  { id: 'all', label: 'All benchmarks' },
  { id: 'frontier', label: 'Frontier models' },
  { id: 'agentic', label: 'Agentic' },
  { id: 'coding', label: 'Coding' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'multimodal', label: 'Multimodal' },
  { id: 'long-context', label: 'Long context' },
  { id: 'tool-use', label: 'Tool use' },
];

const BEST_LIST_LINKS: { id: string; label: string }[] = [
  { id: 'all', label: 'Best overall' },
  { id: 'open-source', label: 'Best open source' },
  { id: 'best-value', label: 'Best value' },
  { id: 'chinese', label: 'Best Chinese / Asian LLMs' },
  { id: 'small-local', label: 'Small & Local LLMs' },
  { id: 'ollama', label: 'Ollama models' },
];

const AI_PRICING_DIRECTORY = [
  { name: 'Gemini API Pricing', desc: 'Input, cached context & output rates across Gemini 4 tiers' },
  { name: 'Claude API Pricing', desc: 'Prompt caching & long-context token rates for Claude 5' },
  { name: 'AI Cost Calculators', desc: '30-day spend, batch discount & SaaS gross margin modeling' },
  { name: 'OpenRouter API Pricing', desc: 'Unified routing comparison across hosted & open-weight models' },
  { name: 'AI TTS & Voice API Pricing', desc: 'Per-character & per-minute speech synthesis cost breakdown' },
  { name: 'AI Video & Image API Pricing', desc: 'Per-second video & per-image generation cost estimation' },
  { name: 'AI Embedding API Pricing', desc: 'Vector indexing & RAG retrieval token cost comparison' },
  { name: 'AI Transcription API Pricing', desc: 'Audio & speech-to-text per-minute API cost comparison' },
];

const CREDIT_MONITORING_DIRECTORY = [
  { name: 'Claude Credits Monitoring', desc: 'Track workspace credit burn, cache hit savings & rate limits' },
  { name: 'Kimi Credits Monitoring', desc: 'Monitor long-context & agentic credit consumption' },
  { name: 'OpenRouter Credits Monitoring', desc: 'Track multi-model credit balance & per-route spend' },
  { name: 'Cloudflare Cost Monitoring', desc: 'Monitor Workers AI, R2 & edge inference spend' },
  { name: 'DigitalOcean Cost Monitoring', desc: 'Track Droplet, GPU & managed database monthly spend' },
  { name: 'ElevenLabs Credits Monitoring', desc: 'Monitor character quota & voice generation credit burn' },
];

export default function BenchLMReplica() {
  const [activeView, setActiveView] = useState<SectionView>('leaderboard');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [licenseFilter, setLicenseFilter] = useState<string>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('All');
  const [reasoningFilter, setReasoningFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'elo' | 'tokPerSec'>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showCount, setShowCount] = useState<number>(12);

  // Cost & Self-host vs API state
  const [inputTokensPerCall, setInputTokensPerCall] = useState<number>(6500);
  const [outputTokensPerCall, setOutputTokensPerCall] = useState<number>(650);
  const [callsPerDay, setCallsPerDay] = useState<number>(2500);
  const [cacheHitPct, setCacheHitPct] = useState<number>(50);
  const [selfHostGpuMonthly, setSelfHostGpuMonthly] = useState<number>(480);

  // Selector state
  const [priorityMode, setPriorityMode] = useState<'balanced' | 'cheapest' | 'highest-score' | 'coding'>('balanced');

  // Tokenizer state
  const [promptSample, setPromptSample] = useState<string>(
    'Compare model accuracy, latency, and monthly API spend across 100,000 production requests with 50% prompt cache reuse.'
  );

  // Sponsor & share state
  const [sponsorEmail, setSponsorEmail] = useState<string>('');
  const [sponsorSent, setSponsorSent] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return models
      .filter((m) => {
        if (categoryFilter !== 'all' && !m.categories.includes(categoryFilter)) return false;
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
        if (reasoningFilter === 'Reasoning' && !m.reasoning) return false;
        if (reasoningFilter === 'Standard' && m.reasoning) return false;
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
  }, [categoryFilter, searchQuery, licenseFilter, evidenceFilter, reasoningFilter, sortBy, sortAsc]);

  const top3Leaders = useMemo(() => models.slice(0, 3), []);

  const calcMonthlyCost = (m: BenchModel) => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30;
    const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
    const effectiveInputRate = (1 - cacheFrac) * m.inputPer1M + cacheFrac * m.cachedInputPer1M;
    const inputCost = (monthlyCalls * inputTokensPerCall * effectiveInputRate) / 1_000_000;
    const outputCost = (monthlyCalls * outputTokensPerCall * m.outputPer1M) / 1_000_000;
    return inputCost + outputCost;
  };

  const recommendedModels = useMemo(() => {
    return [...models]
      .map((m) => {
        const monthlyCost = calcMonthlyCost(m);
        let matchScore = m.score;
        if (priorityMode === 'cheapest') {
          matchScore = m.score / Math.max(monthlyCost, 0.5);
        } else if (priorityMode === 'highest-score') {
          matchScore = m.score + m.elo / 100;
        } else if (priorityMode === 'coding') {
          matchScore = m.co * 1.4 - monthlyCost * 0.01;
        } else {
          matchScore = m.score * 0.65 + (100 / Math.max(monthlyCost, 1)) * 35;
        }
        return { model: m, monthlyCost, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [priorityMode, inputTokensPerCall, outputTokensPerCall, callsPerDay, cacheHitPct]);

  const tokenCountEst = Math.max(1, Math.ceil(promptSample.length / 4));
  const wordCountEst = promptSample.trim() ? promptSample.trim().split(/\s+/).length : 0;

  const handleCopyShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const toggleSortColumn = (col: 'score' | 'price' | 'elo' | 'tokPerSec') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(col === 'price');
    }
  };

  const selectCategoryAndShowLeaderboard = (catId: string) => {
    setCategoryFilter(catId);
    setActiveView('leaderboard');
    document.getElementById('main-workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Utility Strip */}
      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              <strong>PromptBill</strong> · Independent LLM Leaderboard, API Pricing &amp; Credit Directory · Snapshot <strong>Nov 21, 2026</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveView('methodology')}
              className="hover:text-slate-900 underline-offset-2 hover:underline"
            >
              BenchAlign v6.0 Methodology
            </button>
            <button
              type="button"
              onClick={() => setActiveView('advertise')}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              Sponsor &amp; Ads →
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setActiveView('leaderboard');
              }}
              className="flex items-center gap-2.5 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                PB
              </span>
              <div>
                <div className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  PromptBill
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">promptbill.online</div>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {(
                [
                  ['leaderboard', 'Leaderboard'],
                  ['pricing', 'API Pricing & Cost'],
                  ['selector', 'LLM Selector'],
                  ['tokenizer', 'Token Counter'],
                  ['methodology', 'Methodology'],
                  ['advertise', 'Advertise'],
                ] as [SectionView, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveView(key)}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    activeView === key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Copied' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('advertise')}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Advertise
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex lg:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-1.5 text-xs font-medium">
          {(
            [
              ['leaderboard', 'Leaderboard'],
              ['pricing', 'API Pricing'],
              ['selector', 'LLM Selector'],
              ['tokenizer', 'Token Counter'],
              ['methodology', 'Methodology'],
              ['advertise', 'Advertise'],
            ] as [SectionView, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              className={`shrink-0 rounded-md px-2.5 py-1 ${
                activeView === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main id="main-workspace" className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero + Top 3 Leaders */}
        <section className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                1,034 Models Tracked · Evidence-Calibrated Rankings · SEO &amp; GEO Structured
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                LLM Leaderboard &amp; AI Model Pricing — Nov 2026
              </h1>
              <p className="max-w-3xl text-sm sm:text-base text-slate-600">
                Compare frontier, open-weight, and economy models on one calibrated scale with{' '}
                <strong>Supported</strong> vs. <strong>Estimated</strong> evidence labels, token API pricing, credit monitoring directories, and cost calculators.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, providers, use cases..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3Leaders.map((leader, idx) => (
              <div
                key={leader.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                      #{idx + 1} · {leader.provider}
                    </span>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-900">{leader.name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-bold text-slate-900">{leader.score.toFixed(1)}</div>
                    <div className="text-[11px] text-slate-500">90% CI {leader.interval}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Price: <strong className="font-mono text-slate-900">${leader.inputPer1M.toFixed(2)} / ${leader.outputPer1M.toFixed(2)}</strong>
                  </span>
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    {leader.evidence}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sponsored Strip */}
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-800">
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-950">
                Sponsored
              </span>
              <span>
                <strong>Route &amp; benchmark your prompts in one place</strong> — test models side by side with real-time token &amp; cost tracking on <strong>promptbill.online</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('advertise')}
              className="shrink-0 text-xs font-semibold text-amber-900 hover:underline"
            >
              Book a sponsor slot →
            </button>
          </div>
        </section>

        {/* Multi-Column Capability, Best Lists & Use-Case Directory */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              By Capability &amp; Use Case
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAPABILITY_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCategoryAndShowLeaderboard(item.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === item.id && activeView === 'leaderboard'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Best Lists &amp; Local / Open Models
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BEST_LIST_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCategoryAndShowLeaderboard(item.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === item.id && activeView === 'leaderboard'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Calculators &amp; Directories
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveView('pricing')}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                30-Day Cost &amp; Self-Host Calc
              </button>
              <button
                type="button"
                onClick={() => setActiveView('selector')}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                LLM Selector
              </button>
              <button
                type="button"
                onClick={() => setActiveView('tokenizer')}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Token Counter
              </button>
              <button
                type="button"
                onClick={() => setActiveView('advertise')}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Sponsor Slots
              </button>
            </div>
          </div>
        </section>

        {/* VIEW 1: LEADERBOARD */}
        {activeView === 'leaderboard' && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  The LLM Leaderboard — November 2026 Rankings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing {Math.min(showCount, filteredModels.length)} of {filteredModels.length} filtered models · AG Agentic, CO Coding, RE Reasoning, MM Multimodal, KN Knowledge, ML Multilingual, IF Instruction Following, MA Math.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={evidenceFilter}
                  onChange={(e) => setEvidenceFilter(e.target.value)}
                  aria-label="Evidence filter"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                >
                  <option value="All">All Evidence</option>
                  <option value="Supported">Supported only</option>
                  <option value="Estimated">Estimated only</option>
                </select>

                <select
                  value={licenseFilter}
                  onChange={(e) => setLicenseFilter(e.target.value)}
                  aria-label="License filter"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                >
                  <option value="All">All Licenses</option>
                  <option value="Closed">Closed</option>
                  <option value="Open">Open Weight</option>
                </select>

                <select
                  value={reasoningFilter}
                  onChange={(e) => setReasoningFilter(e.target.value)}
                  aria-label="Reasoning filter"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                >
                  <option value="All">All Models</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Rank &amp; Model</th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSortColumn('score')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Score <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Context</th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSortColumn('price')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Price (In / Out) <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3">
                      <button type="button" onClick={() => toggleSortColumn('elo')} className="inline-flex items-center gap-1 hover:text-slate-900">
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
                      <button type="button" onClick={() => toggleSortColumn('tokPerSec')} className="inline-flex items-center gap-1 ml-auto hover:text-slate-900">
                        Tok/s <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredModels.slice(0, showCount).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">#{m.rank}</span>
                          <span className="font-semibold text-slate-900">{m.name}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              m.evidence === 'Supported'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {m.evidence}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {m.provider} · {m.license} · {m.bestFor}
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

            {showCount < filteredModels.length && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowCount((c) => c + 12)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Load more models ({filteredModels.length - showCount} remaining)
                </button>
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: API PRICING & SELF-HOST VS API */}
        {activeView === 'pricing' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Calculator className="w-4 h-4" />
                  Token Price Index · 30-Day Cost &amp; Self-Host vs. API
                </div>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Compare Real API Costs Across Models
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-500">Input tok/call</span>
                  <input
                    type="number"
                    value={inputTokensPerCall}
                    onChange={(e) => setInputTokensPerCall(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-500">Output tok/call</span>
                  <input
                    type="number"
                    value={outputTokensPerCall}
                    onChange={(e) => setOutputTokensPerCall(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-500">Calls / day</span>
                  <input
                    type="number"
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-500">Cache hit %</span>
                  <input
                    type="number"
                    min={0}
                    max={95}
                    value={cacheHitPct}
                    onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-500">GPU $/mo</span>
                  <input
                    type="number"
                    min={0}
                    value={selfHostGpuMonthly}
                    onChange={(e) => setSelfHostGpuMonthly(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Input / Cached / Output ($/1M)</th>
                    <th className="py-2.5 px-3">Rank Score</th>
                    <th className="py-2.5 px-3">API vs. GPU (${selfHostGpuMonthly}/mo)</th>
                    <th className="py-2.5 px-3 text-right">Est. Monthly Cost (30d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {[...models]
                    .sort((a, b) => calcMonthlyCost(a) - calcMonthlyCost(b))
                    .map((m) => {
                      const est = calcMonthlyCost(m);
                      const apiCheaper = est < selfHostGpuMonthly;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {m.name} <span className="text-xs font-normal text-slate-500">({m.provider})</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-700">
                            ${m.inputPer1M.toFixed(2)} / ${m.cachedInputPer1M.toFixed(2)} / ${m.outputPer1M.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-700">{m.score.toFixed(1)}</td>
                          <td className="py-3 px-3 text-xs">
                            <span className={`rounded px-2 py-0.5 font-medium ${apiCheaper ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {apiCheaper ? 'API Cheaper' : 'Self-Host Cheaper'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            ${est.toFixed(2)}/mo
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VIEW 3: LLM SELECTOR */}
        {activeView === 'selector' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Sparkles className="w-4 h-4" />
                Model Finder &amp; Selector
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Which LLM Fits Your Workload &amp; Budget?
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['balanced', 'Best Score + Cost Balance'],
                  ['cheapest', 'Lowest Cost per Benchmark Point'],
                  ['highest-score', 'Highest Capability & Elo'],
                  ['coding', 'Coding & Agentic Priority'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPriorityMode(mode)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold border ${
                    priorityMode === mode
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedModels.map(({ model, monthlyCost }, i) => (
                <div key={model.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-700">PICK #{i + 1}</span>
                    <span className="font-mono text-slate-600">Score {model.score.toFixed(1)}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{model.name}</div>
                  <div className="text-xs text-slate-600">{model.bestFor}</div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-600">Est. Monthly</span>
                    <span className="font-bold text-slate-900">${monthlyCost.toFixed(2)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VIEW 4: TOKEN COUNTER */}
        {activeView === 'tokenizer' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Prompt Token &amp; Word Estimator</h2>
            <p className="text-sm text-slate-600">
              Paste a prompt to inspect estimated tokens, words, and input cost across models.
            </p>
            <textarea
              rows={5}
              value={promptSample}
              onChange={(e) => setPromptSample(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs sm:text-sm text-slate-900"
            />
            <div className="flex flex-wrap gap-6 font-mono text-sm">
              <span>Characters: <strong>{promptSample.length.toLocaleString()}</strong></span>
              <span>Words: <strong>{wordCountEst.toLocaleString()}</strong></span>
              <span className="text-emerald-700">Est. Tokens: <strong>~{tokenCountEst.toLocaleString()}</strong></span>
            </div>
          </section>
        )}

        {/* VIEW 5: METHODOLOGY & RESEARCH */}
        {activeView === 'methodology' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <BookOpen className="w-4 h-4" />
                Evidence &amp; Ranking Rules
              </div>
              <h2 className="text-2xl font-bold text-slate-900">How Rankings &amp; Evidence Work</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every model row separates <strong>Supported</strong> rankings (backed by independent benchmark evidence) from <strong>Estimated</strong> rankings (wider uncertainty), without inventing missing scores.
              </p>
              <div className="space-y-3 pt-2">
                {blogJson.map((post) => (
                  <div key={post.slug} className="rounded-lg border border-slate-200 p-4">
                    <div className="text-[11px] font-semibold uppercase text-emerald-700">
                      {post.category} · {post.readTime}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{post.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{post.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Latest Confirmed Releases · Nov 2026
              </div>
              <div className="space-y-3">
                {releasesJson.map((rel) => (
                  <div key={rel.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{rel.provider}</span>
                      <span>{rel.date}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{rel.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 6: ADVERTISE & MONETIZATION */}
        {activeView === 'advertise' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Megaphone className="w-4 h-4" />
                Monetization &amp; Sponsorships
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Sponsor Placements, Credits &amp; Pro Pass
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Labeled website sponsorships, comparison/pricing placements, launch briefs, and optional Pro/API tiers—with strict editorial independence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 p-5 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-700">1. Website &amp; Table Sponsorships</div>
                <h3 className="text-lg font-bold text-slate-900">Leaderboard &amp; Pricing Slots</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Labeled sponsor banners and comparison slots placed beside high-intent LLM buyers comparing models and token rates.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-700">2. Launch &amp; Data Briefs</div>
                <h3 className="text-lg font-bold text-slate-900">Sponsored Research &amp; Guides</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clearly disclosed guides and benchmarks for AI infrastructure, routing gateways, and developer tools.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-700">3. Pro Pass &amp; Data Access</div>
                <h3 className="text-lg font-bold text-slate-900">Exports, Alerts &amp; API Feeds</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Offer a $9 Pro pass via Dodo Payments for bulk exports, custom routing sheets, and dataset access.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (sponsorEmail.trim()) setSponsorSent(true);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <input
                type="email"
                required
                value={sponsorEmail}
                onChange={(e) => setSponsorEmail(e.target.value)}
                placeholder="Enter work email for sponsorship & media kit..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {sponsorSent ? 'Inquiry Noted ✓' : 'Request Sponsor Info'}
              </button>
            </form>
          </section>
        )}

        {/* AI Pricing & Credit Monitoring Directory (SEO & GEO Structured Directory) */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Complete Pricing &amp; Credit Monitoring Directory
              </span>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                AI APIs, Media Pricing &amp; Provider Credit Monitoring
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('pricing')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Open interactive cost calculator →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Layers className="w-4 h-4 text-emerald-700" />
                AI API &amp; Media Pricing Guides
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AI_PRICING_DIRECTORY.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveView('pricing')}
                    className="text-left rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 hover:border-emerald-400 hover:bg-white transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Activity className="w-4 h-4 text-emerald-700" />
                Provider Credits &amp; Usage Monitoring
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CREDIT_MONITORING_DIRECTORY.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveView('pricing')}
                    className="text-left rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 hover:border-emerald-400 hover:bg-white transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data & GEO Strip */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Give your AI or workflow live rankings &amp; pricing data (/llms.txt &amp; JSON-LD ready)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Structured benchmark scores, credit directories, and token rates published for SEO &amp; AI search citations on <strong>promptbill.online</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/llms.txt"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              View /llms.txt
            </a>
            <button
              type="button"
              onClick={() => setActiveView('selector')}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Open LLM Selector
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-900">PromptBill</span>
            <span>· promptbill.online · Independent LLM Benchmarks, Pricing &amp; Credits</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setActiveView('leaderboard')} className="hover:text-slate-900">Leaderboard</button>
            <button type="button" onClick={() => setActiveView('pricing')} className="hover:text-slate-900">Pricing &amp; Credits</button>
            <button type="button" onClick={() => setActiveView('selector')} className="hover:text-slate-900">Selector</button>
            <button type="button" onClick={() => setActiveView('methodology')} className="hover:text-slate-900">Methodology</button>
            <button type="button" onClick={() => setActiveView('advertise')} className="hover:text-slate-900">Advertise</button>
            <a href="/sitemap.xml" className="inline-flex items-center gap-1 hover:text-slate-900">
              Sitemap <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
