'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_MODELS } from '../lib/catalog';

type SortKey = 'score' | 'value' | 'price' | 'speed' | 'elo';
type LifecycleStatus = 'Active' | 'Preview' | 'Deprecated' | 'Legacy';
type EvidenceStatus = 'Verified' | 'Estimated' | 'Unavailable';
type LicenseStatus = 'Closed' | 'Open Weight';

const DESKTOP_PAGE_SIZES = [15, 25, 50, 100] as const;
const MOBILE_PAGE_SIZE = 7;

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

function getBadgeExplanation(type: 'evidence' | 'lifecycle' | 'license', value: string): {
  title: string;
  meaning: string;
  impact: string;
} {
  if (type === 'evidence') {
    if (value === 'Verified') {
      return {
        title: 'Verified Provenance',
        meaning: 'Token rates & benchmark metrics are cross-checked against official provider docs.',
        impact: 'Safe for production cost estimates and procurement comparisons.',
      };
    }
    if (value === 'Estimated') {
      return {
        title: 'Estimated Telemetry',
        meaning: 'Derived from third-party router rates or preliminary benchmark runs.',
        impact: 'Confirm exact pricing on the provider console before high-volume runs.',
      };
    }
    return {
      title: 'Telemetry Unavailable',
      meaning: 'Official benchmark or pricing figures are currently pending publication.',
      impact: 'Excluded from value-per-dollar ranking calculations.',
    };
  }

  if (type === 'lifecycle') {
    if (value === 'Active') {
      return {
        title: 'Active Production Release',
        meaning: 'Generally available (GA) endpoint with full provider SLA & ongoing support.',
        impact: 'Recommended for new production deployments.',
      };
    }
    if (value === 'Preview') {
      return {
        title: 'Preview / Beta Endpoint',
        meaning: 'Early-access release whose rate limits, pricing, or weights may still shift.',
        impact: 'Ideal for evaluation; pin model versions before shipping.',
      };
    }
    if (value === 'Legacy') {
      return {
        title: 'Legacy Generation',
        meaning: 'Superseded by a newer flagship or workhorse release from the same provider.',
        impact: 'Still callable, but newer tiers usually offer higher Score/$ efficiency.',
      };
    }
    return {
      title: 'Deprecated / Scheduled Sunset',
      meaning: 'Provider has announced retirement or migration off this model ID.',
      impact: 'Avoid for new builds; migrate existing workloads to an Active replacement.',
    };
  }

  if (value === 'Open Weight') {
    return {
      title: 'Open-Weight Model',
      meaning: 'Model weights are downloadable for self-hosting or multi-cloud inference.',
      impact: 'Zero vendor lock-in; deploy on Groq, Together, Fireworks, or private GPUs.',
    };
  }

  return {
    title: 'Closed Proprietary API',
    meaning: 'Hosted exclusively via official provider APIs or authorized cloud partners.',
    impact: 'Managed infrastructure with zero GPU maintenance overhead.',
  };
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

  // 1. Extract explicit numeric context window (e.g., "1m context", "500k", "128k tokens", "300-page")
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

  // 2. Extract explicit budget / price caps (e.g., "under $2", "< $5", "below $1.50/1m", "$2/1m")
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

  // 3. Extract explicit speed requirement (e.g., "over 100 tok/s", ">120 tokens/sec")
  let minSpeedTokPerSec: number | null = null;
  const speedNumMatch = q.match(/(?:over|above|at\s+least|>|>=|min(?:imum)?)\s*(\d{2,4})\s*(?:tok(?:ens)?\s*\/?\s*s(?:ec)?)/i);
  if (speedNumMatch) {
    minSpeedTokPerSec = parseInt(speedNumMatch[1], 10);
    specs.push(`Speed ≥ ${minSpeedTokPerSec} tok/s`);
  }

  // 4. Extract minimum benchmark score requirement (e.g., "score above 85", "85+ score")
  let minScore: number | null = null;
  const scoreMatch = q.match(/(?:score\s*(?:above|over|>=|>|at\s+least)\s*(\d{2,3}(?:\.\d+)?)|(\d{2,3})\+\s*score)/i);
  if (scoreMatch) {
    minScore = parseFloat(scoreMatch[1] || scoreMatch[2]);
    specs.push(`Score ≥ ${minScore}`);
  }

  // 5. Intent classification across multiple dimensions
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

  // Multi-factor dynamic weight vector
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

  // Filter out deprecated unless explicitly requested
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

    // Hard/soft constraint scoring & exact matching explanations
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

    // Lexical / capability relevance boost against model name, provider, and summary
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

export function LeaderboardTableClient({
  lastVerifiedDate,
}: {
  lastVerifiedDate?: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | EvidenceStatus>('ALL');
  const [licenseFilter, setLicenseFilter] = useState<'ALL' | LicenseStatus>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<'ALL' | LifecycleStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [desktopPageSize, setDesktopPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [quickCompareBase, setQuickCompareBase] = useState<string | null>(null);

  // Fixed desktop column bar when scrolled past table header
  const tableTopRef = useRef<HTMLDivElement | null>(null);
  const [showFloatingHeader, setShowFloatingHeader] = useState<boolean>(false);

  // Interactive "Which model is right for your job?" matcher state
  const [jobPrompt, setJobPrompt] = useState<string>('');
  const [submittedJob, setSubmittedJob] = useState<string>('');
  const [showExamples, setShowExamples] = useState<boolean>(true);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [activeAnalysis, setActiveAnalysis] = useState<WorkloadConstraints | null>(null);
  const [matchedResults, setMatchedResults] = useState<TaskMatchResult[]>([]);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (!tableTopRef.current) return;
      const rect = tableTopRef.current.getBoundingClientRect();
      setShowFloatingHeader(rect.top < 8 && rect.bottom > 180);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  function buildCompareUrl(slugs: string[]): string {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    if (unique.length === 0) return '/compare';
    const query = new URLSearchParams();
    query.set('models', unique.join(','));
    if (unique[0]) query.set('a', unique[0]);
    if (unique[1]) query.set('b', unique[1]);
    return `/compare?${query.toString()}`;
  }

  function navigateToCompare(slugs: string[]) {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    try {
      window.localStorage.setItem('promptbill_compare_slugs', JSON.stringify(unique));
      window.sessionStorage.setItem('promptbill_compare_slugs', JSON.stringify(unique));
    } catch {
      // ignore storage errors
    }
    router.push(buildCompareUrl(unique));
  }

  function handleCompareClick(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
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

    // Immediately hide examples & start Siri-like coloured search animation
    setShowExamples(false);
    setJobPrompt(rawText);
    setSubmittedJob(clean);
    setMatchedResults([]);
    setIsMatching(true);

    const parsed = parseWorkloadQuery(clean);
    setActiveAnalysis(parsed);

    // Deliberate ~1.15s thinking beat so the user feels analytical search in progress
    matchTimerRef.current = setTimeout(() => {
      const results = scoreModelsForJob(clean, enrichedModels);
      setMatchedResults(results);
      setIsMatching(false);
    }, 1150);
  }

  const providersWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of enrichedModels) {
      if (!m.provider) continue;
      const key = String(m.provider);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [enrichedModels]);

  const hasAnyElo = useMemo(
    () => enrichedModels.some((m) => typeof m.elo === 'number' && Number.isFinite(m.elo)),
    [enrichedModels]
  );

  const verifiedCount = useMemo(
    () => enrichedModels.filter((m) => m.evidenceNorm === 'Verified').length,
    [enrichedModels]
  );

  const deprecatedCount = useMemo(
    () => enrichedModels.filter((m) => m.lifecycleNorm === 'Deprecated' || m.lifecycleNorm === 'Legacy').length,
    [enrichedModels]
  );

  const maxScore = useMemo(() => {
    const vals = enrichedModels.map((m) => (typeof m.score === 'number' ? m.score : 0));
    return Math.max(100, ...vals);
  }, [enrichedModels]);

  const maxSpeed = useMemo(() => {
    const vals = enrichedModels.map((m) => (typeof m.tokPerSec === 'number' ? m.tokPerSec : 0));
    return Math.max(1, ...vals);
  }, [enrichedModels]);

  const formattedVerifiedDate = useMemo(() => {
    const raw = lastVerifiedDate || new Date().toISOString().slice(0, 10);
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [lastVerifiedDate]);

  const activeFilterCount = [
    providerFilter !== 'ALL',
    evidenceFilter !== 'ALL',
    licenseFilter !== 'ALL',
    lifecycleFilter !== 'ALL',
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(searchQuery.trim()) || activeFilterCount > 0;

  function resetAllFilters() {
    setSearchQuery('');
    setProviderFilter('ALL');
    setEvidenceFilter('ALL');
    setLicenseFilter('ALL');
    setLifecycleFilter('ALL');
    setSortBy('score');
    setSortDir('desc');
    setCurrentPage(1);
  }

  function toggleSelectionOnly(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return [...prev.slice(1), slug];
      return [...prev, slug];
    });
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = enrichedModels.filter((m) => {
      if (providerFilter !== 'ALL' && m.provider !== providerFilter) return false;
      if (evidenceFilter !== 'ALL' && m.evidenceNorm !== evidenceFilter) return false;
      if (licenseFilter !== 'ALL' && m.licenseNorm !== licenseFilter) return false;
      if (lifecycleFilter !== 'ALL' && m.lifecycleNorm !== lifecycleFilter) return false;
      if (q) {
        const hay = `${m.name} ${m.slug} ${m.provider} ${m.licenseNorm} ${m.lifecycleNorm} ${m.cleanSummary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'desc' ? -1 : 1;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'score') {
        const av = a.score ?? -Infinity;
        const bv = b.score ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'value') {
        const av = a.scorePerDollar ?? -Infinity;
        const bv = b.scorePerDollar ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'price') {
        const av = a.outputPer1M ?? Infinity;
        const bv = b.outputPer1M ?? Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'speed') {
        const av = a.tokPerSec ?? -Infinity;
        const bv = b.tokPerSec ?? -Infinity;
        return (av - bv) * dir;
      }
      if (sortBy === 'elo') {
        const av = a.elo ?? -Infinity;
        const bv = b.elo ?? -Infinity;
        return (av - bv) * dir;
      }
      return 0;
    });
  }, [enrichedModels, searchQuery, providerFilter, evidenceFilter, licenseFilter, lifecycleFilter, sortBy, sortDir]);

  const effectivePageSize = isMobileViewport ? MOBILE_PAGE_SIZE : desktopPageSize;
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / effectivePageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedModels = useMemo(() => {
    const startIdx = (safePage - 1) * effectivePageSize;
    return filteredAndSorted.slice(startIdx, startIdx + effectivePageSize).map((item, offset) => ({
      ...item,
      dynamicRank: startIdx + offset + 1,
    }));
  }, [filteredAndSorted, safePage, effectivePageSize]);

  const highlights = useMemo(() => {
    const byScore = [...enrichedModels].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
    const byValue = [...enrichedModels].sort((a, b) => (b.scorePerDollar ?? -1) - (a.scorePerDollar ?? -1))[0];
    const bySpeed = [...enrichedModels].sort((a, b) => (b.tokPerSec ?? -1) - (a.tokPerSec ?? -1))[0];
    return { byScore, byValue, bySpeed };
  }, [enrichedModels]);

  function handleSortToggle(nextKey: SortKey) {
    setCurrentPage(1);
    if (sortBy === nextKey) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(nextKey);
      setSortDir(nextKey === 'price' ? 'asc' : 'desc');
    }
  }

  return (
    <section
      className="space-y-12 pb-28 md:pb-16"
      aria-label="LLM Benchmark, Pricing and Throughput Leaderboard"
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
        .pb-apple-card:hover {
          transform: translate3d(0, -2px, 0);
        }
        /* Shining neon perimeter line around the prompt bar */
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

      {/* Fixed Top Column Bar on Scroll */}
      {showFloatingHeader ? (
        <div
          aria-hidden="false"
          className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-lg shadow-sm"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-12 items-center py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <div className="col-span-5 pl-2">Rank &amp; Model</div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => handleSortToggle('score')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  Score <span>{sortBy === 'score' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => handleSortToggle('value')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  Score/$ <span>{sortBy === 'value' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </div>
              <div className="col-span-1">Context</div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => handleSortToggle('price')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  API Price <span>{sortBy === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </div>
              <div className="col-span-2 text-right pr-2">
                <button
                  type="button"
                  onClick={() => handleSortToggle('speed')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer"
                >
                  Speed <span>{sortBy === 'speed' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 1. "Which model is right for your job?" Finder */}
      <div className="pb-apple-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
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

        {/* Neon Shining Perimeter Input */}
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

        {/* Example Chips — Disappear immediately when Find my model is clicked */}
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

        {/* Coloured Siri-Style Search Thinking State */}
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
      </div>

      {/* 2. GEO Direct-Answer Freshness & Trust Strip */}
      <div
        data-geo-summary="true"
        className="pb-apple-card rounded-3xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/65 via-white to-slate-50 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-3.5 py-1.5 text-xs font-bold tracking-wide text-white uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
              Data Last Verified: {formattedVerifiedDate}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
              {verifiedCount} of {enrichedModels.length} Active Models Verified
            </span>
            {deprecatedCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setLifecycleFilter((prev) => (prev === 'Deprecated' ? 'ALL' : 'Deprecated'));
                  setCurrentPage(1);
                }}
                className="inline-flex items-center rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100 transition-colors"
              >
                {deprecatedCount} Deprecated / Legacy
              </button>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Hover or focus any <strong className="font-semibold text-slate-800">Verified</strong>, <strong className="font-semibold text-slate-800">Active</strong>, or <strong className="font-semibold text-slate-800">Closed / Open Weight</strong> badge in the table for live provenance, SLA lifecycle, and hosting details. Click <strong className="font-semibold text-slate-800">+ Compare</strong> on any two models to open side-by-side comparison.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
          <Link
            href="/pricing"
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-900 transition-colors"
          >
            API Pricing Table
          </Link>
          <button
            type="button"
            onClick={() => navigateToCompare(selectedSlugs)}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {selectedSlugs.length >= 2
              ? `Compare ${selectedSlugs.length} Models →`
              : selectedSlugs.length === 1
              ? 'Compare (Pick 1 More) →'
              : 'Compare Models →'}
          </button>
        </div>
      </div>

      {/* 3. Spacious Leader Spotlight Cards */}
      <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {highlights.byScore ? (
          <div className="pb-apple-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                #1 Benchmark Score
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                {highlights.byScore.score} / 100
              </span>
            </div>

            <div className="space-y-1.5">
              <Link
                href={`/models/${highlights.byScore.slug}`}
                className="text-lg font-extrabold text-slate-900 hover:text-emerald-800 transition-colors"
              >
                {highlights.byScore.name}
              </Link>
              <p className="text-xs text-slate-500">
                {highlights.byScore.provider} · {highlights.byScore.licenseNorm} · {highlights.byScore.lifecycleNorm}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">API In / Out</span>
              <span className="font-mono font-bold text-slate-900">
                {formatPrice(highlights.byScore.inputPer1M)} / {formatPrice(highlights.byScore.outputPer1M)}
              </span>
            </div>
          </div>
        ) : null}

        {highlights.byValue ? (
          <div
            style={{ animationDelay: '90ms' }}
            className="pb-apple-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                #1 Score/$ Efficiency
              </span>
              <span className="rounded-full bg-teal-50 px-3 py-1 font-mono text-xs font-bold text-teal-800 ring-1 ring-teal-200">
                {highlights.byValue.scorePerDollar} pts/$
              </span>
            </div>

            <div className="space-y-1.5">
              <Link
                href={`/models/${highlights.byValue.slug}`}
                className="text-lg font-extrabold text-slate-900 hover:text-teal-800 transition-colors"
              >
                {highlights.byValue.name}
              </Link>
              <p className="text-xs text-slate-500">
                {highlights.byValue.provider} · Score {highlights.byValue.score} · {highlights.byValue.tokPerSec ?? '—'} tok/s
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">API In / Out</span>
              <span className="font-mono font-bold text-slate-900">
                {formatPrice(highlights.byValue.inputPer1M)} / {formatPrice(highlights.byValue.outputPer1M)}
              </span>
            </div>
          </div>
        ) : null}

        {highlights.bySpeed ? (
          <div
            style={{ animationDelay: '180ms' }}
            className="pb-apple-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                #1 Output Speed
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 font-mono text-xs font-bold text-sky-800 ring-1 ring-sky-200">
                {highlights.bySpeed.tokPerSec} tok/s
              </span>
            </div>

            <div className="space-y-1.5">
              <Link
                href={`/models/${highlights.bySpeed.slug}`}
                className="text-lg font-extrabold text-slate-900 hover:text-sky-800 transition-colors"
              >
                {highlights.bySpeed.name}
              </Link>
              <p className="text-xs text-slate-500">
                {highlights.bySpeed.provider} · {highlights.bySpeed.licenseNorm} · Score {highlights.bySpeed.score ?? '—'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">API In / Out</span>
              <span className="font-mono font-bold text-slate-900">
                {formatPrice(highlights.bySpeed.inputPer1M)} / {formatPrice(highlights.bySpeed.outputPer1M)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Filter & Sort Controls */}
      <div className="pb-apple-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter table by model name, provider, or capability..."
              aria-label="Search models or providers"
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-800 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Provider Quick Chips */}
        {providersWithCounts.length > 1 ? (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="region"
            aria-label="Provider quick filters"
          >
            <button
              type="button"
              onClick={() => {
                setProviderFilter('ALL');
                setCurrentPage(1);
              }}
              className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 font-semibold transition-all duration-200 cursor-pointer ${
                providerFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              All ({enrichedModels.length})
            </button>
            {providersWithCounts.map((prov) => {
              const active = providerFilter === prov.name;
              return (
                <button
                  key={prov.name}
                  type="button"
                  onClick={() => {
                    setProviderFilter(active ? 'ALL' : prov.name);
                    setCurrentPage(1);
                  }}
                  className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {prov.name} ({prov.count})
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Dropdown Filters */}
        <div
          className={`${
            mobileFiltersOpen ? 'grid' : 'hidden'
          } lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1 text-xs`}
        >
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by provider"
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Providers ({providersWithCounts.length})</option>
            {providersWithCounts.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>

          <select
            value={evidenceFilter}
            onChange={(e) => {
              setEvidenceFilter(e.target.value as typeof evidenceFilter);
              setCurrentPage(1);
            }}
            aria-label="Filter by provenance status"
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Evidence</option>
            <option value="Verified">Verified Only</option>
            <option value="Estimated">Estimated</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <select
            value={licenseFilter}
            onChange={(e) => {
              setLicenseFilter(e.target.value as typeof licenseFilter);
              setCurrentPage(1);
            }}
            aria-label="Filter by license type"
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Licenses</option>
            <option value="Closed">Closed</option>
            <option value="Open Weight">Open Weight</option>
          </select>

          <select
            value={lifecycleFilter}
            onChange={(e) => {
              setLifecycleFilter(e.target.value as typeof lifecycleFilter);
              setCurrentPage(1);
            }}
            aria-label="Filter by model lifecycle status"
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800"
          >
            <option value="ALL">All Lifecycles</option>
            <option value="Active">Active</option>
            <option value="Preview">Preview</option>
            <option value="Deprecated">Deprecated</option>
            <option value="Legacy">Legacy</option>
          </select>
        </div>

        {/* Sort Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 font-semibold text-slate-500">Sort:</span>
            {[
              { id: 'score', label: 'Score' },
              { id: 'value', label: 'Best Score/$' },
              { id: 'price', label: 'Lowest Price' },
              { id: 'speed', label: 'Fastest Tok/s' },
              ...(hasAnyElo ? [{ id: 'elo', label: 'Elo' }] : []),
            ].map((pill) => {
              const active = sortBy === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleSortToggle(pill.id as SortKey)}
                  className={`min-h-[38px] shrink-0 rounded-xl px-3.5 py-1.5 font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {pill.label} {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="min-h-[36px] font-semibold text-emerald-800 hover:underline"
              >
                Reset filters
              </button>
            ) : null}

            <span className="text-slate-500 font-medium">
              <strong className="text-slate-900">{filteredAndSorted.length}</strong> models ·{' '}
              {isMobileViewport ? '7 per page' : `${desktopPageSize} per page`}
            </span>
          </div>
        </div>
      </div>

      {/* Compare Queue Banner */}
      {selectedSlugs.length > 0 ? (
        <div className="pb-apple-card rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-emerald-950">
              Compare Queue ({selectedSlugs.length}/4):
            </span>
            {selectedSlugs.map((slug) => {
              const found = enrichedModels.find((m) => m.slug === slug);
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-slate-800 ring-1 ring-emerald-200"
                >
                  <span>{found?.name || slug}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectionOnly(slug)}
                    aria-label={`Remove ${found?.name || slug}`}
                    className="text-slate-400 hover:text-slate-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedSlugs([]);
                setQuickCompareBase(null);
              }}
              className="font-semibold text-slate-600 hover:text-slate-900"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => navigateToCompare(selectedSlugs)}
              className="min-h-[36px] inline-flex items-center rounded-xl bg-emerald-800 px-4 py-1.5 font-bold text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              {selectedSlugs.length >= 2 ? `Compare ${selectedSlugs.length} Now →` : 'Open /compare →'}
            </button>
          </div>
        </div>
      ) : null}

      {/* 5. Empty State */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            No models match your current search or filter combination.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex min-h-[42px] items-center rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* 6A. Desktop Spacious Table */}
          <div ref={tableTopRef} className="hidden md:block rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-5 pl-7 pr-5 rounded-tl-3xl">Rank &amp; Model</th>
                  <th className="py-5 px-5">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('score')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Score <span>{sortBy === 'score' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                    </button>
                  </th>
                  <th className="py-5 px-5">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('value')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Score/$ <span>{sortBy === 'value' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                    </button>
                  </th>
                  <th className="py-5 px-5">Context</th>
                  <th className="py-5 px-5">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('price')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      API Price (In / Out) <span>{sortBy === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                    </button>
                  </th>
                  {hasAnyElo ? (
                    <th className="py-5 px-5">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('elo')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                      >
                        Elo <span>{sortBy === 'elo' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                      </button>
                    </th>
                  ) : null}
                  <th className="py-5 pl-5 pr-7 text-right rounded-tr-3xl">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('speed')}
                      className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Speed (Tok/s) <span>{sortBy === 'speed' ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-sm">
                {paginatedModels.map((m, rowIdx) => {
                  const { dynamicRank } = m;
                  const scorePct =
                    typeof m.score === 'number'
                      ? Math.max(4, Math.min(100, Math.round((m.score / maxScore) * 100)))
                      : 0;
                  const speedPct =
                    typeof m.tokPerSec === 'number'
                      ? Math.max(6, Math.min(100, Math.round((m.tokPerSec / maxSpeed) * 100)))
                      : 0;
                  const isRetired = m.lifecycleNorm === 'Deprecated' || m.lifecycleNorm === 'Legacy';
                  const isSelected = selectedSlugs.includes(m.slug);
                  const isCompareAnchor = quickCompareBase === m.slug;

                  const evInfo = getBadgeExplanation('evidence', m.evidenceNorm);
                  const lcInfo = getBadgeExplanation('lifecycle', m.lifecycleNorm);
                  const licInfo = getBadgeExplanation('license', m.licenseNorm);

                  return (
                    <tr
                      key={m.slug}
                      style={{ animationDelay: `${Math.min(rowIdx, 8) * 40}ms` }}
                      className={`pb-apple-card group/row ${
                        isSelected
                          ? 'bg-emerald-50/45'
                          : isRetired
                          ? 'bg-slate-50/70 hover:bg-slate-100/70'
                          : 'hover:bg-slate-50/95'
                      }`}
                    >
                      <td className="py-7 pl-7 pr-6 align-top">
                        <div className="flex items-start gap-4">
                          <span
                            title={`Current sort position #${dynamicRank}`}
                            className={`mt-0.5 inline-flex h-8 min-w-[38px] shrink-0 items-center justify-center rounded-xl px-2 font-mono text-xs font-bold ${
                              dynamicRank === 1
                                ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300'
                                : dynamicRank === 2
                                ? 'bg-slate-200 text-slate-900'
                                : dynamicRank === 3
                                ? 'bg-orange-100 text-orange-950'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{dynamicRank}
                          </span>

                          <div className="space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Link
                                href={`/models/${m.slug}`}
                                className="text-[15px] font-bold text-slate-900 group-hover/row:text-emerald-800 transition-colors"
                              >
                                {m.name}
                              </Link>

                              {/* Evidence Popover */}
                              <span className="relative inline-flex items-center group/ev">
                                <button
                                  type="button"
                                  aria-label={`${m.evidenceNorm}: ${evInfo.meaning}`}
                                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold cursor-help ${
                                    m.evidenceNorm === 'Verified'
                                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                      : m.evidenceNorm === 'Estimated'
                                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <span>{m.evidenceNorm}</span>
                                  <span className="opacity-60 text-[10px]" aria-hidden="true">
                                    ⓘ
                                  </span>
                                </button>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/ev:opacity-100 group-hover/ev:scale-100 group-hover/ev:translate-y-0 group-focus-within/ev:opacity-100 group-focus-within/ev:scale-100 group-focus-within/ev:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-left text-white shadow-2xl"
                                >
                                  <span className="block text-xs font-bold text-emerald-300">
                                    {evInfo.title}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-slate-200 leading-relaxed">
                                    {evInfo.meaning}
                                  </span>
                                  <span className="mt-1.5 block text-[10px] text-slate-400">
                                    {evInfo.impact}
                                  </span>
                                </span>
                              </span>

                              {/* Lifecycle Popover */}
                              <span className="relative inline-flex items-center group/lc">
                                <button
                                  type="button"
                                  aria-label={`${m.lifecycleNorm}: ${lcInfo.meaning}`}
                                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold cursor-help ${
                                    m.lifecycleNorm === 'Active'
                                      ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
                                      : m.lifecycleNorm === 'Preview'
                                      ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
                                      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'
                                  }`}
                                >
                                  <span>{m.lifecycleNorm}</span>
                                  <span className="opacity-60 text-[10px]" aria-hidden="true">
                                    ⓘ
                                  </span>
                                </button>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/lc:opacity-100 group-hover/lc:scale-100 group-hover/lc:translate-y-0 group-focus-within/lc:opacity-100 group-focus-within/lc:scale-100 group-focus-within/lc:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-left text-white shadow-2xl"
                                >
                                  <span className="block text-xs font-bold text-sky-300">
                                    {lcInfo.title}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-slate-200 leading-relaxed">
                                    {lcInfo.meaning}
                                  </span>
                                  <span className="mt-1.5 block text-[10px] text-slate-400">
                                    {lcInfo.impact}
                                  </span>
                                </span>
                              </span>

                              {/* License Popover */}
                              <span className="relative inline-flex items-center group/lic">
                                <button
                                  type="button"
                                  aria-label={`${m.licenseNorm}: ${licInfo.meaning}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 cursor-help"
                                >
                                  <span>{m.licenseNorm}</span>
                                  <span className="opacity-60 text-[10px]" aria-hidden="true">
                                    ⓘ
                                  </span>
                                </button>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/lic:opacity-100 group-hover/lic:scale-100 group-hover/lic:translate-y-0 group-focus-within/lic:opacity-100 group-focus-within/lic:scale-100 group-focus-within/lic:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-left text-white shadow-2xl"
                                >
                                  <span className="block text-xs font-bold text-amber-300">
                                    {licInfo.title}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-slate-200 leading-relaxed">
                                    {licInfo.meaning}
                                  </span>
                                  <span className="mt-1.5 block text-[10px] text-slate-400">
                                    {licInfo.impact}
                                  </span>
                                </span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCompareClick(m.slug)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                                  isCompareAnchor
                                    ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300'
                                    : isSelected
                                    ? 'bg-emerald-800 text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                {isCompareAnchor
                                  ? 'Pick 2nd to Compare →'
                                  : isSelected
                                  ? '✓ In Compare'
                                  : '+ Compare'}
                              </button>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                              <span className="font-semibold text-slate-800">{m.provider}</span>
                              {m.cleanSummary ? ` · ${m.cleanSummary}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-7 px-5 align-top">
                        <div className="font-mono text-base font-extrabold text-slate-900">
                          {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}
                        </div>
                        {typeof m.score === 'number' ? (
                          <div className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-800 transition-all duration-500"
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        ) : null}
                      </td>

                      <td className="py-7 px-5 align-top font-mono text-sm font-bold text-emerald-700">
                        {m.scorePerDollar !== null ? m.scorePerDollar.toFixed(1) : '—'}
                      </td>

                      <td className="py-7 px-5 align-top font-mono text-xs font-semibold text-slate-700">
                        {m.contextWindow || '—'}
                      </td>

                      <td className="py-7 px-5 align-top font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatPrice(m.inputPer1M)} / {formatPrice(m.outputPer1M)}
                      </td>

                      {hasAnyElo ? (
                        <td className="py-7 px-5 align-top font-mono text-xs font-semibold text-slate-700">
                          {typeof m.elo === 'number' ? m.elo : '—'}
                        </td>
                      ) : null}

                      <td className="py-7 pl-5 pr-7 align-top text-right">
                        <div className="font-mono text-xs font-bold text-teal-700 whitespace-nowrap">
                          {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                        </div>
                        {typeof m.tokPerSec === 'number' ? (
                          <div className="mt-2 ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-teal-600 transition-all duration-500"
                              style={{ width: `${speedPct}%` }}
                            />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 6B. Mobile Cards (7 Models Per Page) */}
          <div className="md:hidden space-y-5">
            {paginatedModels.map((m, cardIdx) => {
              const { dynamicRank } = m;
              const isSelected = selectedSlugs.includes(m.slug);
              return (
                <article
                  key={m.slug}
                  style={{ animationDelay: `${cardIdx * 65}ms` }}
                  className={`pb-apple-card rounded-3xl border bg-white p-5 shadow-xs space-y-4 ${
                    isSelected ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-7 min-w-[34px] shrink-0 items-center justify-center rounded-lg px-2 font-mono text-xs font-bold ${
                            dynamicRank === 1
                              ? 'bg-amber-100 text-amber-950'
                              : dynamicRank === 2
                              ? 'bg-slate-200 text-slate-900'
                              : dynamicRank === 3
                              ? 'bg-orange-100 text-orange-950'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          #{dynamicRank}
                        </span>
                        <Link
                          href={`/models/${m.slug}`}
                          className="text-base font-bold text-slate-900 leading-snug hover:text-emerald-800"
                        >
                          {m.name}
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="text-slate-700">{m.provider}</span>
                        <span>·</span>
                        <span
                          className={`rounded-md px-2 py-0.5 ${
                            m.evidenceNorm === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {m.evidenceNorm}
                        </span>
                        <span>·</span>
                        <span
                          className={`rounded-md px-2 py-0.5 ${
                            m.lifecycleNorm === 'Active'
                              ? 'bg-sky-50 text-sky-800'
                              : m.lifecycleNorm === 'Preview'
                              ? 'bg-indigo-50 text-indigo-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {m.lifecycleNorm}
                        </span>
                        <span>·</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                          {m.licenseNorm}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200/80">
                      <div className="font-mono text-lg font-extrabold text-slate-900 leading-none">
                        {typeof m.score === 'number' ? m.score.toFixed(1) : '—'}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Score
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/90 p-3.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        API Price (In / Out)
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatPrice(m.inputPer1M)} / {formatPrice(m.outputPer1M)}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Value (Score/$)
                      </div>
                      <div className="font-mono text-sm font-bold text-emerald-700">
                        {m.scorePerDollar !== null ? `${m.scorePerDollar.toFixed(1)} pts/$` : '—'}
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Output Speed
                      </div>
                      <div className="font-mono text-sm font-bold text-teal-700">
                        {typeof m.tokPerSec === 'number' ? `${m.tokPerSec} tok/s` : '—'}
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Context Window
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-800">
                        {m.contextWindow || '—'}
                      </div>
                    </div>
                  </div>

                  {m.cleanSummary ? (
                    <p className="text-xs text-slate-600 leading-relaxed">{m.cleanSummary}</p>
                  ) : null}

                  <div className="flex items-center gap-2.5 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCompareClick(m.slug)}
                      className={`min-h-[42px] flex-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200/80'
                      }`}
                    >
                      {isSelected ? '✓ In Compare' : '+ Compare'}
                    </button>
                    <Link
                      href={`/models/${m.slug}`}
                      className="min-h-[42px] flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white font-semibold text-emerald-900 hover:bg-emerald-50"
                    >
                      Specs &amp; Cost →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 7. Pagination Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              {!isMobileViewport ? (
                <>
                  <span>Show:</span>
                  <select
                    value={desktopPageSize}
                    onChange={(e) => {
                      setDesktopPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Rows per page"
                    className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-800"
                  >
                    {DESKTOP_PAGE_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} rows
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <span>Showing 7 models per page ·</span>
              )}
              <span>
                Page <strong className="text-slate-900">{safePage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong> ({filteredAndSorted.length} total)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="min-h-[38px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[38px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* 8. Sticky Mobile Compare Bar */}
      {selectedSlugs.length > 0 ? (
        <div className="md:hidden fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-emerald-700 bg-slate-950/95 px-4 py-3 text-white shadow-xl backdrop-blur-xs flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-emerald-300">{selectedSlugs.length} selected</span>
            <span className="text-slate-300"> (up to 4)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedSlugs([]);
                setQuickCompareBase(null);
              }}
              className="min-h-[36px] rounded-lg px-2.5 py-1 text-slate-300 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => navigateToCompare(selectedSlugs)}
              className="min-h-[36px] inline-flex items-center rounded-xl bg-emerald-500 px-3.5 py-1.5 font-bold text-slate-950 cursor-pointer"
            >
              Compare →
            </button>
          </div>
        </div>
      ) : null}

      {/* 9. GEO Structured Citation, Definitions & Provenance Overview */}
      <footer
        data-geo-facts="true"
        className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 text-xs text-slate-600 space-y-5 leading-relaxed"
      >
        <div className="space-y-1.5">
          <h2 className="text-sm font-extrabold text-slate-900">
            Leaderboard Methodology, Definitions &amp; Citation Standard
          </h2>
          <p>
            PromptBill (<a href="https://promptbill.online/leaderboard" className="font-semibold text-emerald-800 underline">promptbill.online/leaderboard</a>) evaluates {enrichedModels.length} language models ({verifiedCount} Verified) as of <time dateTime={lastVerifiedDate || formattedVerifiedDate}>{formattedVerifiedDate}</time>. Rankings combine composite capability benchmarks, official API token pricing per 1 million tokens, context window limits, and measured generation throughput.
          </p>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Score/$ Efficiency Formula</dt>
            <dd>
              Calculated as <code className="font-mono text-slate-800">Composite Score ÷ Output Price ($/1M)</code>. Higher values indicate greater reasoning and coding capability per dollar spent on generated tokens.
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Provenance &amp; SLA Lifecycle</dt>
            <dd>
              <strong>Verified</strong> entries match official provider rate cards; <strong>Estimated</strong> entries derive from router telemetry. <strong>Active</strong> denotes production GA endpoints, distinguishing them from <strong>Preview</strong>, <strong>Legacy</strong>, or <strong>Deprecated</strong> IDs.
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1">
            <dt className="font-bold text-slate-900">Hosting &amp; Licensing</dt>
            <dd>
              <strong>Closed</strong> models run on proprietary managed APIs, whereas <strong>Open Weight</strong> models release weights for self-hosting or multi-provider inference.
            </dd>
          </div>
        </dl>
      </footer>
    </section>
  );
}
