import React from 'react';
import Link from 'next/link';
import changelogJson from '../data/priceChangelog.json';
import { CheckCircle2, BookOpen, TrendingDown } from 'lucide-react';

export interface PriceChangelogItem {
  id: string;
  date: string;
  modelName: string;
  modelSlug: string;
  provider: string;
  changeSummary: string;
  verifiedDate: string;
}

export const PRICE_CHANGELOG = changelogJson as PriceChangelogItem[];
export const PRICES_LAST_VERIFIED_DATE = 'Nov 22, 2026';

export const CATEGORY_LEGEND: { code: string; label: string; desc: string }[] = [
  { code: 'AG', label: 'Agentic', desc: 'Multi-step tool use & autonomous task execution' },
  { code: 'CO', label: 'Coding', desc: 'Code generation, debugging & repository reasoning' },
  { code: 'RE', label: 'Reasoning', desc: 'Logic, multi-hop deduction & complex problem solving' },
  { code: 'MM', label: 'Multimodal', desc: 'Vision, document & cross-modal understanding' },
  { code: 'KN', label: 'Knowledge', desc: 'Broad factual recall & domain accuracy' },
  { code: 'ML', label: 'Multilingual', desc: 'Non-English fluency & cross-lingual comprehension' },
  { code: 'IF', label: 'Instruction Following', desc: 'Constraint adherence & structured output reliability' },
  { code: 'MA', label: 'Math', desc: 'Quantitative & mathematical reasoning accuracy' },
];

export function ScoreLegendAndVerified({ showChangelog = true }: { showChangelog?: boolean }) {
  return (
    <div className="space-y-4">
      {/* Last Verified Badge + Methodology Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Prices last verified: {PRICES_LAST_VERIFIED_DATE}</span>
        </div>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Read Scoring &amp; Verification Methodology</span>
        </Link>
      </div>

      {/* Category & Evidence Legend Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-bold uppercase tracking-wider text-slate-700">
            Benchmark Column &amp; Evidence Legend
          </div>
          <div className="text-slate-600">
            <strong className="text-slate-900">Supported</strong> = directly verified benchmark &amp; pricing coverage ·{' '}
            <strong className="text-slate-900">Estimated</strong> = derived/projected benchmark or pricing tier.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CATEGORY_LEGEND.map((item) => (
            <div
              key={item.code}
              title={`${item.code} = ${item.label}: ${item.desc}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="font-mono font-bold text-slate-900">
                {item.code} <span className="font-sans font-semibold text-emerald-800">= {item.label}</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Public API Price Drop Feed / Changelog */}
      {showChangelog && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              <span>API Price Drop Feed &amp; Changelog</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Last verified: {PRICES_LAST_VERIFIED_DATE}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 text-xs">
            {PRICE_CHANGELOG.map((entry) => (
              <li key={entry.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">{entry.date}</span>
                    <Link
                      href={`/models/${entry.modelSlug}`}
                      className="font-bold text-slate-900 hover:text-emerald-700 underline-offset-2 hover:underline"
                    >
                      {entry.modelName}
                    </Link>
                    <span className="text-slate-500">({entry.provider})</span>
                  </div>
                  <p className="text-slate-700">{entry.changeSummary}</p>
                </div>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 self-start sm:self-center">
                  Verified {entry.verifiedDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
