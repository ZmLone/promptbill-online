import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { CATEGORY_LEGEND, PRICES_LAST_VERIFIED_DATE } from '../../components/ScoreLegendAndVerified';

export const metadata: Metadata = {
  title: 'Benchmark Methodology',
  description: `Benchmark definitions (AG, CO, RE, MM, KN, ML, IF, MA), Supported vs Estimated evidence rules, and pricing verification methodology. Prices last verified: ${PRICES_LAST_VERIFIED_DATE}.`,
  alternates: { canonical: 'https://promptbill.online/methodology' },
};

export default function Page() {
  return (
    <SiteShell title="Scoring Methodology & Column Definitions" subtitle={`promptbill.online/methodology · Prices last verified: ${PRICES_LAST_VERIFIED_DATE}`}>
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>Prices last verified: {PRICES_LAST_VERIFIED_DATE}.</strong> Every model entry on PromptBill is evaluated across capability benchmarks, value ratio (Score/$), speed (Tok/s), and per-1M token pricing.
        </p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Supported vs. Estimated Coverage</h2>
          <p><strong>Supported:</strong> Models with direct benchmark &amp; pricing coverage tracked on PromptBill.</p>
          <p><strong>Estimated:</strong> Models whose benchmark or token cost figures are derived or projected from published specifications.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {CATEGORY_LEGEND.map((item) => (
            <div key={item.code} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-mono font-bold text-slate-900">{item.code} — {item.label}</div>
              <p className="text-slate-600 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </article>
    </SiteShell>
  );
}
