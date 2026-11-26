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

interface TaskMatchResult {
  model: EnrichedModel;
  fitScore: number;
  reasons: string[];
  badge: string;
}

function scoreModelsForJob(query: string, models: EnrichedModel[]): TaskMatchResult[] {
  const q = query.trim().toLowerCase();
  const wantsLongContext = /contract|document|pdf|book|repo|codebase|1m|500k|long|rag|entire|transcript/.test(q);
  const wantsCheap = /cheap|budget|low[- ]?cost|bulk|classif|extract|tag|rout|fallback|scale|volume|\$[0-2]/.test(q);
  const wantsFast = /fast|real[- ]?time|voice|stream|low[- ]?latency|instant|sub[- ]?second|agent/.test(q);
  const wantsCoding = /code|coding|refactor|debug|typescript|python|sql|architect|engineer|software/.test(q);
  const wantsReasoning = /reason|math|complex|analy|legal|research|hard|frontier|deep/.test(q);
  const wantsOpen = /open[- ]?weight|open[- ]?source|self[- ]?host|private|on[- ]?prem|llama|qwen|deepseek/.test(q);

  const candidates = models.filter((m) => m.lifecycleNorm !== 'Deprecated');
  const pool = candidates.length > 0 ? candidates : models;

  const scored = pool.map((m) => {
    let pts = (m.score ?? 70) * 0.55;
    const reasons: string[] = [];

    if (m.lifecycleNorm === 'Active') pts += 6;
    if (m.evidenceNorm === 'Verified') pts += 4;

    if (wantsLongContext) {
      if (m.contextTokens >= 1_000_000) {
        pts += 22;
        reasons.push(`${m.contextWindow} context handles large documents in one pass`);
      } else if (m.contextTokens >= 256_000) {
        pts += 12;
        reasons.push(`${m.contextWindow} extended context window`);
      } else {
        pts -= 12;
      }
    }

    if (wantsCheap) {
      const val = m.scorePerDollar ?? 0;
      pts += Math.min(28, val * 0.35);
      if ((m.outputPer1M ?? 99) <= 3.0) {
        reasons.push(`Low ${formatPrice(m.inputPer1M)}/${formatPrice(m.outputPer1M)} per 1M token pricing (${val.toFixed(1)} Score/$)`);
      }
    }

    if (wantsFast) {
      const spd = m.tokPerSec ?? 0;
      pts += Math.min(24, (spd / 240) * 24);
      if (spd >= 150) {
        reasons.push(`High ${spd} tok/s throughput for low-latency responses`);
      }
    }

    if (wantsCoding) {
      if (/code|refactor|architect|agent|json|debug/i.test(m.cleanSummary + ' ' + m.name)) {
        pts += 16;
        reasons.push('Optimized for multi-file coding & structured outputs');
      }
      if ((m.score ?? 0) >= 85) {
        pts += 10;
      }
    }

    if (wantsReasoning) {
      if ((m.score ?? 0) >= 88) {
        pts += 18;
        reasons.push(`High ${m.score?.toFixed(1)} composite reasoning benchmark score`);
      }
    }

    if (wantsOpen) {
      if (m.licenseNorm === 'Open Weight') {
        pts += 26;
        reasons.push('Open-weight release for flexible hosting');
      } else {
        pts -= 18;
      }
    }

    if (reasons.length === 0) {
      if ((m.score ?? 0) >= 90) reasons.push(`Top-tier ${m.score?.toFixed(1)} benchmark score`);
      if ((m.scorePerDollar ?? 0) >= 20) reasons.push(`Strong ${m.scorePerDollar?.toFixed(1)} Score/$ value ratio`);
      if ((m.tokPerSec ?? 0) >= 160) reasons.push(`Fast ${m.tokPerSec} tok/s output speed`);
      if (reasons.length === 0 && m.cleanSummary) {
        reasons.push(m.cleanSummary);
      }
    }

    return {
      model: m,
      fitScore: pts,
      reasons: reasons.slice(0, 2),
      badge: '',
    };
  });

  scored.sort((a, b) => b.fitScore - a.fitScore);
  const top3 = scored.slice(0, 3);
  if (top3[0]) top3[0].badge = 'Best Overall Fit';
  if (top3[1]) top3[1].badge = wantsCheap ? 'Runner-Up Value' : 'Strong Alternative';
  if (top3[2]) top3[2].badge = 'High-Efficiency Pick';
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

  // Interactive "Which model is right for your job?" finder state
  const [jobPrompt, setJobPrompt] = useState<string>('');
  const [submittedJob, setSubmittedJob] = useState<string>('');
  const [isMatching, setIsMatching] = useState<boolean>(false);
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
    if (unique.length === 1) return `/compare?models=${encodeURIComponent(unique[0])}`;
    return `/compare?a=${encodeURIComponent(unique[0])}&b=${encodeURIComponent(
      unique[1]
    )}&models=${encodeURIComponent(unique.join(','))}`;
  }

  function navigateToCompare(slugs: string[]) {
    const url = buildCompareUrl(slugs);
    router.push(url);
  }

  function handleCompareClick(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      const next = prev.length >= 4 ? [...prev.slice(1), slug] : [...prev, slug];
      return next;
    });

    // If user already had another model selected, pair them immediately and open /compare
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
      setIsMatching(false);
      return;
    }
    if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    setJobPrompt(rawText);
    setSubmittedJob(clean);
    setIsMatching(true);
    matchTimerRef.current = setTimeout(() => {
      const results = scoreModelsForJob(clean, enrichedModels);
      setMatchedResults(results);
      setIsMatching(false);
    }, 520);
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

  const compareHref = buildCompareUrl(selectedSlugs);

  return (
    <section
      className="space-y-10 pb-28 md:pb-14 overflow-x-clip"
      aria-label="LLM Benchmark, Pricing and Throughput Leaderboard"
    >
      {/* Apple-inspired spring curves & smooth compositor motion */}
      <style>{`
        @keyframes appleFloatIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 18px, 0) scale(0.975);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes applePulseWave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .apple-spring-card {
          animation: appleFloatIn 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.36s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.28s ease;
          will-change: transform, opacity;
        }
        .apple-spring-card:hover {
          transform: translate3d(0, -3px, 0);
        }
        .apple-shimmer-track {
          position: relative;
          overflow: hidden;
        }
        .apple-shimmer-track::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.65) 50%,
            transparent 100%
          );
          animation: applePulseWave 1.35s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .apple-spring-card,
          .apple-shimmer-track::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* 1. Interactive "Which model is right for your job?" Finder */}
      <div className="apple-spring-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label
              htmlFor="pb-job-matcher-input"
              className="block text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900"
            >
              Which model is right for your job?
            </label>
            <p className="text-xs sm:text-sm text-slate-500">
              Describe your task, context window, speed, or budget—matched instantaneously on-device.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1.5 w-fit shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
            On-Device Match · Private
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runJobMatcher(jobPrompt);
          }}
          className="group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-2.5 transition-all duration-300 ease-out focus-within:border-emerald-700 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-slate-900/5"
        >
          <div className="flex items-center gap-3.5 flex-1 px-3.5 py-1.5">
            <svg
              className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-emerald-700 transition-colors duration-300"
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
              placeholder="Type the job, e.g. summarize long contracts or refactor TypeScript..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {jobPrompt ? (
              <button
                type="button"
                onClick={() => {
                  setJobPrompt('');
                  setSubmittedJob('');
                  setMatchedResults([]);
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
            <span>{isMatching ? 'Finding match...' : 'Find my model'}</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Examples:</span>
          {SAMPLE_JOBS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => runJobMatcher(sample)}
              className="rounded-full border border-slate-200/90 bg-slate-50/70 px-3.5 py-1.5 text-slate-700 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900 transition-all duration-200 cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Apple-smooth Shimmer & Staggered Match Cards */}
        {isMatching ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="apple-shimmer-track h-36 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-5 flex flex-col justify-between"
              >
                <div className="h-3 w-24 rounded-full bg-slate-200/90" />
                <div className="space-y-2">
                  <div className="h-5 w-44 rounded-lg bg-slate-200/90" />
                  <div className="h-3 w-32 rounded bg-slate-200/80" />
                </div>
                <div className="h-3 w-full rounded bg-slate-200/80" />
              </div>
            ))}
          </div>
        ) : matchedResults.length > 0 ? (
          <div className="space-y-4 pt-2" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                Recommended for <strong className="text-slate-900">“{submittedJob}”</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubmittedJob('');
                  setMatchedResults([]);
                }}
                className="font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {matchedResults.map((item, idx) => (
                <div
                  key={item.model.slug}
                  style={{ animationDelay: `${idx * 110}ms` }}
                  className="apple-spring-card rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/80 p-5 shadow-xs hover:shadow-md flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {item.badge}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        Score {item.model.score?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <div className="pt-1">
                      <Link
                        href={`/models/${item.model.slug}`}
                        className="text-base font-extrabold text-slate-900 hover:text-emerald-800 transition-colors"
                      >
                        {item.model.name}
                      </Link>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">
                        {item.model.provider} · {formatPrice(item.model.inputPer1M)} / {formatPrice(item.model.outputPer1M)} · {item.model.tokPerSec ?? '—'} tok/s
                      </div>
                    </div>
                    <ul className="pt-1 space-y-1.5 text-xs text-slate-700">
                      {item.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <span className="text-emerald-700 font-bold">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCompareClick(item.model.slug)}
                      className="font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
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
        className="apple-spring-card rounded-3xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/65 via-white to-slate-50 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
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
            Hover or focus any <strong className="font-semibold text-slate-800">Verified</strong>, <strong className="font-semibold text-slate-800">Active</strong>, or <strong className="font-semibold text-slate-800">Closed / Open Weight</strong> badge in the table for live provenance, SLA lifecycle, and hosting details. Click <strong className="font-semibold text-slate-800">+ Compare</strong> on two models to launch side-by-side comparison.
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
          <div className="apple-spring-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5">
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

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
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
            className="apple-spring-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5"
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

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
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
            className="apple-spring-card min-w-[290px] md:min-w-0 snap-start rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md flex flex-col justify-between gap-5"
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

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
              <span className="text-slate-500">API In / Out</span>
              <span className="font-mono font-bold text-slate-900">
                {formatPrice(highlights.bySpeed.inputPer1M)} / {formatPrice(highlights.bySpeed.outputPer1M)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Filter & Sort Controls */}
      <div className="apple-spring-card rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
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

      {/* Compare Selection Banner (Appears When 1+ Models Selected) */}
      {selectedSlugs.length > 0 ? (
        <div className="apple-spring-card rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
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
              {selectedSlugs.length >= 2 ? `Open Comparison (${selectedSlugs.length}) →` : 'Open /compare →'}
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
          {/* 6A. Desktop Spacious Table with Sticky Header (No overflow clipping) */}
          <div className="hidden md:block rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(226,232,240,1)]">
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
                      style={{ animationDelay: `${Math.min(rowIdx, 8) * 45}ms` }}
                      className={`apple-spring-card group/row ${
                        isSelected
                          ? 'bg-emerald-50/45'
                          : isRetired
                          ? 'bg-slate-50/70 hover:bg-slate-100/70'
                          : 'hover:bg-slate-50/95'
                      }`}
                    >
                      <td className="py-6 pl-7 pr-6 align-top">
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

                          <div className="space-y-2.5 min-w-0">
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
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/ev:opacity-100 group-hover/ev:scale-100 group-hover/ev:translate-y-0 group-focus-within/ev:opacity-100 group-focus-within/ev:scale-100 group-focus-within/ev:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-200 bg-slate-950 p-3.5 text-left text-white shadow-xl"
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
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/lc:opacity-100 group-hover/lc:scale-100 group-hover/lc:translate-y-0 group-focus-within/lc:opacity-100 group-focus-within/lc:scale-100 group-focus-within/lc:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-200 bg-slate-950 p-3.5 text-left text-white shadow-xl"
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
                                  className="pointer-events-none opacity-0 scale-95 translate-y-1 group-hover/lic:opacity-100 group-hover/lic:scale-100 group-hover/lic:translate-y-0 group-focus-within/lic:opacity-100 group-focus-within/lic:scale-100 group-focus-within/lic:translate-y-0 transition-all duration-200 absolute left-0 bottom-full mb-2.5 z-40 w-64 rounded-2xl border border-slate-200 bg-slate-950 p-3.5 text-left text-white shadow-xl"
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

                      <td className="py-6 px-5 align-top">
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

                      <td className="py-6 px-5 align-top font-mono text-sm font-bold text-emerald-700">
                        {m.scorePerDollar !== null ? m.scorePerDollar.toFixed(1) : '—'}
                      </td>

                      <td className="py-6 px-5 align-top font-mono text-xs font-semibold text-slate-700">
                        {m.contextWindow || '—'}
                      </td>

                      <td className="py-6 px-5 align-top font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatPrice(m.inputPer1M)} / {formatPrice(m.outputPer1M)}
                      </td>

                      {hasAnyElo ? (
                        <td className="py-6 px-5 align-top font-mono text-xs font-semibold text-slate-700">
                          {typeof m.elo === 'number' ? m.elo : '—'}
                        </td>
                      ) : null}

                      <td className="py-6 pl-5 pr-7 align-top text-right">
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
                  className={`apple-spring-card rounded-3xl border bg-white p-5 shadow-xs space-y-4 ${
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

      {/* 9. GEO Structured Citation & Provenance Overview */}
      <footer className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-xs text-slate-600 space-y-2 leading-relaxed">
        <div className="font-bold text-slate-900">Leaderboard Provenance &amp; Citation Standard</div>
        <p>
          PromptBill ranks language models dynamically by composite benchmark score, <strong className="text-slate-800">Score/$ efficiency</strong> (composite score divided by official output token price per 1M tokens), official API pricing, and measured output throughput (<strong className="text-slate-800">tok/s</strong>). Every model displays live provenance (<strong className="text-slate-800">Verified</strong> vs. <strong className="text-slate-800">Estimated</strong>), SLA lifecycle (<strong className="text-slate-800">Active</strong>, <strong className="text-slate-800">Preview</strong>, <strong className="text-slate-800">Deprecated</strong>, <strong className="text-slate-800">Legacy</strong>), and hosting license (<strong className="text-slate-800">Closed</strong> vs. <strong className="text-slate-800">Open Weight</strong>).
        </p>
      </footer>
    </section>
  );
}
