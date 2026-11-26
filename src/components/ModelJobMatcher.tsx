'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_MODELS } from '../lib/catalog';

type LifecycleStatus = 'Active' | 'Preview' | 'Deprecated' | 'Legacy';
type EvidenceStatus = 'Verified' | 'Estimated' | 'Unavailable';
type LicenseStatus = 'Closed' | 'Open Weight';

const SAMPLE_JOBS = [
  'Summarize 300-page legal contracts accurately',
  'Fast low-cost JSON extraction & routing',
  'Multi-file coding & deep architecture refactoring',
  'High-volume RAG support chatbot under $2/1M',
];

function sanitizeBlurb(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/#1\s+benchmark\s+score\s*;?\s*/gi, 'Top-tier benchmark performance; ')
    .replace(/#1\s+Score\/\$\s+ratio\s*/gi, 'Leading Score/$ efficiency ')
    .replace(/#1\s+overall\s*/gi, 'Leading ')
    .replace(/;\s*$/g, '')
    .trim();
}

function normalizeLicense(raw: string | null | undefined): LicenseStatus {
  if (!raw) return 'Closed';
  const v = raw.trim();
  if (!v || /^n\/?a$/i.test(v) || /^unspecified$/i.test(v)) return 'Closed';
  if (/open/i.test(v) || /apache|mit|llama|gemma|qwen|deepseek|mistral/i.test(v)) {
    return 'Open Weight';
  }
  return 'Closed';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLifecycle(m: any): LifecycleStatus {
  const candidates = [
    m?.lifecycleStatus,
    m?.lifecycle,
    m?.status,
    m?.modelStatus,
    m?.availability,
  ];
  for (const cand of candidates) {
    if (typeof cand !== 'string' || !cand.trim()) continue;
    const v = cand.trim().toLowerCase();
    if (v === 'deprecated' || v === 'deprecating' || v === 'retired') return 'Deprecated';
    if (v === 'legacy' || v === 'superseded') return 'Legacy';
    if (v === 'preview' || v === 'beta' || v === 'experimental') return 'Preview';
    if (v === 'active' || v === 'ga' || v === 'generally available' || v === 'live') return 'Active';
  }
  if (m?.deprecated === true) return 'Deprecated';
  return 'Active';
}

function normalizeEvidence(m: {
  evidence?: string | null;
  pricingProvenance?: { status?: string | null } | null;
  benchmarkProvenance?: { status?: string | null } | null;
}): EvidenceStatus {
  const ev = (m.evidence || '').trim().toLowerCase();
  const pr = (m.pricingProvenance?.status || '').trim().toLowerCase();
  const bm = (m.benchmarkProvenance?.status || '').trim().toLowerCase();
  if (ev === 'verified' || (pr === 'verified' && bm === 'verified')) return 'Verified';
  if (ev === 'unavailable') return 'Unavailable';
  return 'Estimated';
}

function computeScorePerDollar(score: number | null | undefined, outputPer1M: number | null | undefined): number | null {
  if (typeof score !== 'number' || typeof outputPer1M !== 'number' || outputPer1M <= 0) return null;
  return Number((score / outputPer1M).toFixed(1));
}

function formatPrice(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  return `$${val.toFixed(2)}`;
}

function parseContextTokens(ctx: string | number | null | undefined): number {
  if (typeof ctx === 'number') return ctx;
  if (!ctx) return 0;
  const s = String(ctx).trim().toUpperCase();
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(num)) return 0;
  if (s.includes('M')) return num * 1_000_000;
  if (s.includes('K')) return num * 1_000;
  return num;
}

interface EnrichedModel {
  slug: string;
  name: string;
  provider: string;
  score?: number | null;
  inputPer1M?: number | null;
  outputPer1M?: number | null;
  tokPerSec?: number | null;
  elo?: number | null;
  contextWindow?: string | null;
  bestFor?: string | null;
  notes?: string | null;
  license?: string | null;
  evidenceNorm: EvidenceStatus;
  licenseNorm: LicenseStatus;
  lifecycleNorm: LifecycleStatus;
  scorePerDollar: number | null;
  cleanSummary: string;
  contextTokens: number;
}

interface WorkloadConstraints {
  minContextTokens: number | null;
  maxOutputPrice: number | null;
  maxInputPrice: number | null;
  minSpeedTokPerSec: number | null;
  minScore: number | null;
  requireOpenWeight: boolean;
  preferClosed: boolean;
  requireActive: boolean;
  requireVerified: boolean;
  weights: {
    capability: number;
    value: number;
    speed: number;
    context: number;
    reliability: number;
  };
  detectedIntents: string[];
  extractedSpecs: string[];
}

interface TaskMatchResult {
  model: EnrichedModel;
  fitScore: number;
  matchPercent: number;
  reasons: string[];
  tradeoffs: string[];
  badge: string;
}

function parseWorkloadQuery(query: string): WorkloadConstraints {
  const q = query.trim().toLowerCase();
  const specs: string[] = [];
  const intents: string[] = [];

  let minContextTokens: number | null = null;
  const ctxMatch = q.match(/(\d+(?:\.\d+)?)\s*(m|million|k|thousand)\s*(?:context|window|tokens?)?/i);
  if (ctxMatch) {
    const base = parseFloat(ctxMatch[1]);
    const unit = ctxMatch[2].toLowerCase();
    minContextTokens = unit.startsWith('m') ? base * 1_000_000 : base * 1_000;
    specs.push(`Context ≥ ${base}${unit.startsWith('m') ? 'M' : 'K'}`);
  } else if (/contract|document|pdf|book|codebase|repo|monorepo|entire\s+(?:codebase|repo|book)|long\s+(?:context|doc|pdf|transcript)/.test(q)) {
    minContextTokens = 256_000;
    specs.push('Extended context (≥256K)');
  }

  let maxOutputPrice: number | null = null;
  let maxInputPrice: number | null = null;
  const priceCapMatch = q.match(/(?:under|below|less\s+than|max(?:imum)?|at\s+most|<|<=|budget\s+of?)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (priceCapMatch) {
    const cap = parseFloat(priceCapMatch[1]);
    if (Number.isFinite(cap) && cap > 0) {
      maxOutputPrice = cap;
      maxInputPrice = cap * 0.6;
      specs.push(`Budget cap ≤ $${cap.toFixed(2)}/1M`);
    }
  }

  let minSpeedTokPerSec: number | null = null;
  const speedNumMatch = q.match(/(?:over|above|at\s+least|>|>=|min(?:imum)?)\s*(\d{2,4})\s*(?:tok(?:ens)?\s*\/?\s*s(?:ec)?)/i);
  if (speedNumMatch) {
    minSpeedTokPerSec = parseInt(speedNumMatch[1], 10);
    specs.push(`Speed ≥ ${minSpeedTokPerSec} tok/s`);
  }

  let minScore: number | null = null;
  const scoreMatch = q.match(/(?:score\s*(?:above|over|>=|>|at\s+least)\s*(\d{2,3}(?:\.\d+)?)|(\d{2,3})\+\s*score)/i);
  if (scoreMatch) {
    minScore = parseFloat(scoreMatch[1] || scoreMatch[2]);
    specs.push(`Score ≥ ${minScore}`);
  }

  const isCoding = /\b(code|coding|refactor|debug|typescript|javascript|python|rust|go|sql|bug|pr|pull\s*request|repo|compiler|test|unit\s*test|fullstack|backend|frontend)\b/i.test(q);
  const isReasoning = /\b(reason|reasoning|math|theorem|proof|logic|complex|analy[sz]e|legal|contract|compliance|audit|research|synthesis|multi[- ]?step|hard|frontier|deep)\b/i.test(q);
  const isCostSensitive = /\b(cheap|cheapest|budget|low[- ]?cost|inexpensive|affordable|bulk|batch|high[- ]?volume|scale|volume|classif\w*|extract\w*|tag\w*|rout\w*|summar\w*|fallback|micro|mini|flash|lite)\b/i.test(q) || maxOutputPrice !== null;
  const isLatencySensitive = /\b(fast|fastest|real[- ]?time|voice|live|stream\w*|low[- ]?latency|instant|quick|sub[- ]?second|interactive|autocomplete|agent\w*)\b/i.test(q) || minSpeedTokPerSec !== null;
  const isExtractionOrJson = /\b(json|schema|structured|extract|parse|csv|xml|sql|entity|classif|tag|label|format)\b/i.test(q);
  const isRagOrSearch = /\b(rag|retrieval|ground\w*|citation\w*|knowledge\s*base|search|q&a|qa|support\s*(?:bot|agent|desk)|customer\s*service)\b/i.test(q);
  const requireOpenWeight = /\b(open[- ]?weight|open[- ]?source|self[- ]?host\w*|private\s*(?:cloud|gpu|vpc)|on[- ]?prem\w*|weights|llama|qwen|deepseek|mistral|gemma)\b/i.test(q);
  const preferClosed = /\b(closed|proprietary|managed\s*api|enterprise\s*sla|official\s*api)\b/i.test(q) && !requireOpenWeight;
  const requireActive = /\b(production|prod|live|mission[- ]?critical|sla|stable|active)\b/i.test(q);
  const requireVerified = /\b(verified|audited|reliable|accurate|precision|exact|high[- ]?accuracy)\b/i.test(q);

  if (isCoding) intents.push('Software Engineering & Code');
  if (isReasoning) intents.push('Deep Reasoning & Analysis');
  if (isCostSensitive) intents.push('Cost & Token Efficiency');
  if (isLatencySensitive) intents.push('Low-Latency Throughput');
  if (isExtractionOrJson) intents.push('Structured Data & Extraction');
  if (isRagOrSearch) intents.push('RAG & Knowledge Grounding');
  if (minContextTokens) intents.push('Long-Context Processing');
  if (requireOpenWeight) intents.push('Open-Weight / Self-Hostable');

  const weights = {
    capability: 1.0 + (isReasoning ? 0.65 : 0) + (isCoding ? 0.5 : 0) + (isRagOrSearch ? 0.3 : 0),
    value: 0.75 + (isCostSensitive ? 1.15 : 0) + (isExtractionOrJson ? 0.45 : 0),
    speed: 0.65 + (isLatencySensitive ? 1.15 : 0) + (isExtractionOrJson ? 0.25 : 0),
    context: 0.5 + (minContextTokens ? 1.2 : 0) + (isRagOrSearch ? 0.45 : 0),
    reliability: 0.65 + (requireActive ? 0.5 : 0) + (requireVerified ? 0.5 : 0),
  };

  return {
    minContextTokens,
    maxOutputPrice,
    maxInputPrice,
    minSpeedTokPerSec,
    minScore,
    requireOpenWeight,
    preferClosed,
    requireActive,
    requireVerified,
    weights,
    detectedIntents: intents.length > 0 ? intents : ['General Production Workload'],
    extractedSpecs: specs,
  };
}

function scoreModelsForJob(query: string, models: EnrichedModel[]): TaskMatchResult[] {
  const c = parseWorkloadQuery(query);
  const qLower = query.trim().toLowerCase();
  const tokens = qLower
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'model', 'models', 'need', 'want', 'best', 'good'].includes(t));

  const wantsDeprecated = /deprecat|legacy|old|retired/.test(qLower);
  const candidatePool = wantsDeprecated
    ? models
    : models.filter((m) => m.lifecycleNorm !== 'Deprecated');
  const pool = candidatePool.length > 0 ? candidatePool : models;

  const maxCtxInPool = Math.max(1_000_000, ...pool.map((m) => m.contextTokens));
  const maxValInPool = Math.max(10, ...pool.map((m) => m.scorePerDollar ?? 0));
  const maxSpdInPool = Math.max(100, ...pool.map((m) => m.tokPerSec ?? 0));

  const evaluated = pool.map((m) => {
    const scoreNorm = typeof m.score === 'number' ? Math.max(0, Math.min(100, m.score)) : 65;
    const valNorm = m.scorePerDollar !== null ? Math.min(100, (m.scorePerDollar / maxValInPool) * 100) : 40;
    const spdNorm = typeof m.tokPerSec === 'number' ? Math.min(100, (m.tokPerSec / maxSpdInPool) * 100) : 45;
    const ctxNorm = m.contextTokens > 0 ? Math.min(100, (Math.log10(m.contextTokens + 1) / Math.log10(maxCtxInPool + 1)) * 100) : 35;

    let relNorm = 60;
    if (m.lifecycleNorm === 'Active') relNorm += 22;
    else if (m.lifecycleNorm === 'Preview') relNorm += 8;
    else if (m.lifecycleNorm === 'Legacy') relNorm -= 18;
    else relNorm -= 35;

    if (m.evidenceNorm === 'Verified') relNorm += 18;
    else if (m.evidenceNorm === 'Estimated') relNorm += 4;

    const totalWeight =
      c.weights.capability +
      c.weights.value +
      c.weights.speed +
      c.weights.context +
      c.weights.reliability;

    let weightedPts =
      (scoreNorm * c.weights.capability +
        valNorm * c.weights.value +
        spdNorm * c.weights.speed +
        ctxNorm * c.weights.context +
        relNorm * c.weights.reliability) /
      totalWeight;

    const reasons: string[] = [];
    const tradeoffs: string[] = [];

    if (c.minContextTokens !== null) {
      if (m.contextTokens >= c.minContextTokens) {
        weightedPts += 14;
        reasons.push(`${m.contextWindow} context fits ≥${Math.round(c.minContextTokens / 1000)}K requirement`);
      } else {
        weightedPts -= 26;
        tradeoffs.push(`Context (${m.contextWindow || 'N/A'}) is below target window`);
      }
    }

    if (c.maxOutputPrice !== null) {
      const outP = m.outputPer1M ?? Infinity;
      if (outP <= c.maxOutputPrice) {
        weightedPts += 15;
        reasons.push(`Output rate ${formatPrice(m.outputPer1M)}/1M meets ≤${formatPrice(c.maxOutputPrice)} budget`);
      } else {
        weightedPts -= 28;
        tradeoffs.push(`Output cost ${formatPrice(m.outputPer1M)}/1M exceeds $${c.maxOutputPrice.toFixed(2)} cap`);
      }
    }

    if (c.minSpeedTokPerSec !== null) {
      const spd = m.tokPerSec ?? 0;
      if (spd >= c.minSpeedTokPerSec) {
        weightedPts += 14;
        reasons.push(`Speed ${spd} tok/s exceeds ${c.minSpeedTokPerSec} tok/s threshold`);
      } else {
        weightedPts -= 22;
        tradeoffs.push(`Speed (${spd || '—'} tok/s) is below target throughput`);
      }
    }

    if (c.minScore !== null) {
      const sc = m.score ?? 0;
      if (sc >= c.minScore) {
        weightedPts += 12;
        reasons.push(`Benchmark score ${sc.toFixed(1)} clears ${c.minScore}+ bar`);
      } else {
        weightedPts -= 20;
        tradeoffs.push(`Score (${sc.toFixed(1)}) is below ${c.minScore}`);
      }
    }

    if (c.requireOpenWeight) {
      if (m.licenseNorm === 'Open Weight') {
        weightedPts += 18;
        reasons.push('Open-weight license allows custom/private deployment');
      } else {
        weightedPts -= 30;
        tradeoffs.push('Closed API only (not open-weight)');
      }
    } else if (c.preferClosed && m.licenseNorm === 'Closed') {
      weightedPts += 6;
      reasons.push('Managed closed API with provider SLA');
    }

    if (c.requireActive && m.lifecycleNorm !== 'Active') {
      weightedPts -= 16;
      tradeoffs.push(`Lifecycle is ${m.lifecycleNorm} rather than Active`);
    }

    if (c.requireVerified && m.evidenceNorm !== 'Verified') {
      weightedPts -= 12;
      tradeoffs.push(`Provenance is ${m.evidenceNorm} rather than Verified`);
    }

    const corpus = `${m.name} ${m.provider} ${m.cleanSummary} ${m.licenseNorm}`.toLowerCase();
    let keywordHits = 0;
    for (const kw of tokens) {
      if (corpus.includes(kw)) keywordHits += 1;
    }
    if (keywordHits > 0) {
      weightedPts += Math.min(12, keywordHits * 3.5);
    }

    if (typeof m.scorePerDollar === 'number' && m.scorePerDollar >= 25 && c.weights.value > 1.1) {
      reasons.push(`High ${m.scorePerDollar.toFixed(1)} Score/$ efficiency (${formatPrice(m.inputPer1M)} / ${formatPrice(m.outputPer1M)})`);
    }
    if (typeof m.tokPerSec === 'number' && m.tokPerSec >= 150 && c.weights.speed > 1.0) {
      reasons.push(`Fast ${m.tokPerSec} tok/s generation for responsive UX`);
    }
    if (typeof m.score === 'number' && m.score >= 88 && c.weights.capability > 1.2) {
      reasons.push(`Frontier ${m.score.toFixed(1)} composite capability score`);
    }

    if (reasons.length === 0) {
      if (typeof m.score === 'number') reasons.push(`Score ${m.score.toFixed(1)} · ${m.lifecycleNorm} (${m.evidenceNorm})`);
      if (m.cleanSummary) reasons.push(m.cleanSummary);
    }

    const clampedFit = Math.max(25, Math.min(99, Math.round(weightedPts)));

    return {
      model: m,
      fitScore: weightedPts,
      matchPercent: clampedFit,
      reasons: reasons.slice(0, 3),
      tradeoffs: tradeoffs.slice(0, 2),
      badge: '',
    };
  });

  evaluated.sort((a, b) => b.fitScore - a.fitScore);
  const top3 = evaluated.slice(0, 3);

  if (top3[0]) top3[0].badge = 'Best Overall Match';
  if (top3[1]) {
    top3[1].badge =
      c.weights.value > c.weights.capability ? 'Best Budget Alternative' : 'Strong Runner-Up';
  }
  if (top3[2]) {
    top3[2].badge =
      c.weights.speed > c.weights.capability ? 'Fastest Alternative' : 'High-Efficiency Option';
  }

  return top3;
}

export function ModelJobMatcher() {
  const router = useRouter();
  const [jobPrompt, setJobPrompt] = useState<string>('');
  const [submittedJob, setSubmittedJob] = useState<string>('');
  const [showExamples, setShowExamples] = useState<boolean>(true);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [activeAnalysis, setActiveAnalysis] = useState<WorkloadConstraints | null>(null);
  const [matchedResults, setMatchedResults] = useState<TaskMatchResult[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [quickCompareBase, setQuickCompareBase] = useState<string | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    };
  }, []);

  const enrichedModels = useMemo<EnrichedModel[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ALL_MODELS as any[])
      .filter((m) => !m.archived)
      .map((m) => {
        const evidenceNorm = normalizeEvidence(m);
        const licenseNorm = normalizeLicense(m.license);
        const lifecycleNorm = normalizeLifecycle(m);
        const scorePerDollar = computeScorePerDollar(m.score, m.outputPer1M);
        const cleanSummary = sanitizeBlurb(m.bestFor || m.notes);
        const contextTokens = parseContextTokens(m.contextWindow);
        return {
          ...m,
          evidenceNorm,
          licenseNorm,
          lifecycleNorm,
          scorePerDollar,
          cleanSummary,
          contextTokens,
        };
      });
  }, []);

  function navigateToCompare(slugs: string[]) {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    const params = new URLSearchParams();
    params.set('models', unique.join(','));
    if (unique[0]) params.set('a', unique[0]);
    if (unique[1]) params.set('b', unique[1]);
    router.push(`/compare?${params.toString()}`);
  }

  function handleCompareClick(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      return prev.length >= 4 ? [...prev.slice(1), slug] : [...prev, slug];
    });

    if (quickCompareBase && quickCompareBase !== slug) {
      const pair = [quickCompareBase, slug];
      setQuickCompareBase(null);
      navigateToCompare(pair);
    } else {
      setQuickCompareBase((prev) => (prev === slug ? null : slug));
    }
  }

  function runJobMatcher(rawText: string) {
    const clean = rawText.trim();
    if (!clean) {
      setSubmittedJob('');
      setMatchedResults([]);
      setActiveAnalysis(null);
      setIsMatching(false);
      setShowExamples(true);
      return;
    }

    if (matchTimerRef.current) clearTimeout(matchTimerRef.current);

    setShowExamples(false);
    setJobPrompt(rawText);
    setSubmittedJob(clean);
    setMatchedResults([]);
    setIsMatching(true);

    const parsed = parseWorkloadQuery(clean);
    setActiveAnalysis(parsed);

    matchTimerRef.current = setTimeout(() => {
      const results = scoreModelsForJob(clean, enrichedModels);
      setMatchedResults(results);
      setIsMatching(false);
    }, 1150);
  }

  return (
    <section
      aria-label="Which model is right for your job?"
      className="pb-apple-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5"
    >
      <style>{`
        @keyframes pbAppleEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, 16px, 0) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes pbNeonPerimeterFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes pbSiriThinkingPulse {
          0% {
            transform: scale(0.96);
            opacity: 0.72;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
          100% {
            transform: scale(0.96);
            opacity: 0.72;
          }
        }
        @keyframes pbColouredSweep {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(220%);
          }
        }
        .pb-apple-card {
          animation: pbAppleEnter 0.52s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.34s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.25s ease;
        }
        .pb-neon-perimeter {
          position: relative;
          border-radius: 1.15rem;
          padding: 2px;
          background: linear-gradient(
            90deg,
            #00f5d4,
            #00bbf9,
            #9b5de5,
            #f15bb5,
            #00f5d4
          );
          background-size: 280% 280%;
          animation: pbNeonPerimeterFlow 6s ease infinite;
          box-shadow: 0 0 18px -4px rgba(0, 187, 249, 0.32),
                      0 0 24px -6px rgba(155, 93, 229, 0.26);
        }
        .pb-neon-perimeter-thinking {
          animation: pbNeonPerimeterFlow 2.1s linear infinite;
          box-shadow: 0 0 24px -2px rgba(0, 245, 212, 0.5),
                      0 0 32px -2px rgba(241, 91, 181, 0.42);
        }
        .pb-siri-orb {
          background: radial-gradient(circle at 30% 30%, #22d3ee, #818cf8 52%, #ec4899 100%);
          animation: pbSiriThinkingPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 16px rgba(129, 140, 248, 0.65);
        }
        .pb-coloured-beam-card {
          position: relative;
          overflow: hidden;
        }
        .pb-coloured-beam-card::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 48%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34, 211, 238, 0.28),
            rgba(168, 85, 247, 0.28),
            rgba(244, 114, 182, 0.24),
            transparent
          );
          animation: pbColouredSweep 1.15s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pb-apple-card,
          .pb-neon-perimeter,
          .pb-siri-orb,
          .pb-coloured-beam-card::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <label
            htmlFor="pb-job-matcher-input"
            className="block text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900"
          >
            Which model is right for your job?
          </label>
          <p className="text-xs sm:text-sm text-slate-500">
            Describe your workload, context window, speed, budget, or hosting needs—scored across all factors locally.
          </p>
        </div>
        {isMatching ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1.5 text-[11px] font-semibold text-white w-fit shrink-0">
            <span className="pb-siri-orb h-2.5 w-2.5 rounded-full" aria-hidden="true" />
            <span>Evaluating constraints &amp; trade-offs...</span>
          </span>
        ) : null}
      </div>

      <div className={`pb-neon-perimeter ${isMatching ? 'pb-neon-perimeter-thinking' : ''}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runJobMatcher(jobPrompt);
          }}
          className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-[1rem] bg-white p-2.5"
        >
          <div className="flex items-center gap-3.5 flex-1 px-3.5 py-1.5">
            <svg
              className="h-5 w-5 shrink-0 text-slate-500 group-focus-within:text-indigo-600 transition-colors duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
            <input
              id="pb-job-matcher-input"
              type="text"
              value={jobPrompt}
              onChange={(e) => setJobPrompt(e.target.value)}
              placeholder="Type the job, e.g. 500k context legal review under $5/1M or fast open-weight coding..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {jobPrompt ? (
              <button
                type="button"
                onClick={() => {
                  setJobPrompt('');
                  setSubmittedJob('');
                  setMatchedResults([]);
                  setActiveAnalysis(null);
                  setIsMatching(false);
                  setShowExamples(true);
                }}
                aria-label="Clear job description"
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-900 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span>{isMatching ? 'Searching...' : 'Find my model'}</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </form>
      </div>

      {showExamples && !isMatching && matchedResults.length === 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Examples:</span>
          {SAMPLE_JOBS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => runJobMatcher(sample)}
              className="rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-1.5 text-slate-700 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-slate-950 transition-all duration-200 cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      ) : null}

      {isMatching ? (
        <div className="space-y-4 pt-2" aria-live="polite">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-cyan-50/70 via-indigo-50/70 to-fuchsia-50/70 px-4 py-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="pb-siri-orb h-3 w-3 rounded-full shrink-0" aria-hidden="true" />
              <span className="font-bold text-slate-900">
                Analyzing requirements for “{submittedJob}”
              </span>
            </div>
            {activeAnalysis ? (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900">
                {activeAnalysis.detectedIntents.slice(0, 2).map((intent) => (
                  <span key={intent} className="rounded-full bg-white/90 px-2.5 py-0.5 ring-1 ring-indigo-200">
                    {intent}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 120}ms` }}
                className="pb-coloured-beam-card h-40 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-cyan-50/50 via-white to-fuchsia-50/40 p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded-full bg-indigo-100/90" />
                  <div className="h-4 w-14 rounded-full bg-cyan-100/90" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-44 rounded-lg bg-slate-200/80" />
                  <div className="h-3 w-32 rounded bg-slate-200/70" />
                </div>
                <div className="h-3 w-full rounded bg-fuchsia-100/70" />
              </div>
            ))}
          </div>
        </div>
      ) : matchedResults.length > 0 ? (
        <div className="space-y-4 pt-2" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Matches for <strong className="text-slate-900">“{submittedJob}”</strong>
              </span>
              {activeAnalysis?.extractedSpecs.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-semibold text-indigo-900 ring-1 ring-indigo-200"
                >
                  {spec}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmittedJob('');
                setMatchedResults([]);
                setActiveAnalysis(null);
                setShowExamples(true);
              }}
              className="font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Show examples &amp; reset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {matchedResults.map((item, idx) => (
              <div
                key={item.model.slug}
                style={{ animationDelay: `${idx * 110}ms` }}
                className="pb-apple-card rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/80 p-5 shadow-xs hover:shadow-md flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {item.badge}
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-900">
                      {item.matchPercent}% Fit · Score {item.model.score?.toFixed(1) ?? '—'}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <Link
                      href={`/models/${item.model.slug}`}
                      className="text-base font-extrabold text-slate-900 hover:text-emerald-800 transition-colors"
                    >
                      {item.model.name}
                    </Link>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {item.model.provider} · {item.model.contextWindow || '—'} ctx · {formatPrice(item.model.inputPer1M)}/{formatPrice(item.model.outputPer1M)} · {item.model.tokPerSec ?? '—'} tok/s
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {item.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                    {item.tradeoffs.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-amber-800">
                        <span className="font-bold">!</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCompareClick(item.model.slug)}
                    className="font-semibold text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    {selectedSlugs.includes(item.model.slug) ? '✓ Selected' : '+ Compare'}
                  </button>
                  <Link
                    href={`/models/${item.model.slug}`}
                    className="font-bold text-emerald-800 hover:underline"
                  >
                    Inspect →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
