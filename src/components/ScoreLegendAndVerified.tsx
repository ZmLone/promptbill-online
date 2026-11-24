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

export const PRICE_CHANGELOG: PriceChangelogItem[] = Array.isArray(changelogJson)
  ? (changelogJson as PriceChangelogItem[])
  : [];

export interface LegendCategoryItem {
  code: string;
  label: string;
  desc: string;
}

export const CATEGORY_LEGEND: LegendCategoryItem[] = [
  { code: 'AG', label: 'Agentic', desc: 'Multi-step tool use and task execution category' },
  { code: 'CO', label: 'Coding', desc: 'Code generation, debugging, and repository reasoning category' },
  { code: 'RE', label: 'Reasoning', desc: 'Logic and multi-step problem solving category' },
  { code: 'MM', label: 'Multimodal', desc: 'Vision and cross-modal understanding category' },
  { code: 'KN', label: 'Knowledge', desc: 'Factual recall and domain coverage category' },
  { code: 'ML', label: 'Multilingual', desc: 'Cross-lingual comprehension category' },
  { code: 'IF', label: 'Instruction Following', desc: 'Constraint adherence and structured output category' },
  { code: 'MA', label: 'Math', desc: 'Quantitative and mathematical reasoning category' },
];

export function ScoreLegendAndVerified({ showChangelog = true }: { showChangelog?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>Provenance status is tracked per field; unverified values show N/A</span>
        </div>
        <Link
          href="/methodology"
          className="inline-flex min-h-[36px] items-center gap-1.5 font-semibold text-emerald-900 hover:text-emerald-950 underline underline-offset-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Read Scoring &amp; Verification Methodology</span>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-bold uppercase tracking-wider text-slate-800">
            Benchmark Column &amp; Evidence Legend
          </div>
          <div className="text-slate-700">
            <strong className="text-slate-950">Verified</strong> = recorded source and check timestamp ·{' '}
            <strong className="text-slate-950">Estimated</strong> = estimate or snapshot without primary log ·{' '}
            <strong className="text-slate-950">N/A</strong> = no supporting data.
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
                {item.code}{' '}
                <span className="font-sans font-semibold text-emerald-800">= {item.label}</span>
              </div>
              <div className="text-[11px] text-slate-700 mt-0.5 leading-snug">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {showChangelog && PRICE_CHANGELOG.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <TrendingDown className="w-4 h-4 text-emerald-800" />
              <span>Recorded Price Changelog</span>
            </div>
          </div>

          <ul className="divide-y divide-slate-100 text-xs">
            {PRICE_CHANGELOG.map((entry) => (
              <li
                key={entry.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {entry.date}
                    </span>
                    <Link
                      href={`/models/${entry.modelSlug}`}
                      className="inline-flex min-h-[32px] items-center font-bold text-slate-900 hover:text-emerald-800 underline-offset-2 hover:underline"
                    >
                      {entry.modelName}
                    </Link>
                    <span className="text-slate-700">({entry.provider})</span>
                  </div>
                  <p className="text-slate-800">{entry.changeSummary}</p>
                </div>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 self-start sm:self-center">
                  {entry.verifiedDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
