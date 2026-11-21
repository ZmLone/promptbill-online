import React from 'react';
import { SiteShell } from '../../components/SiteShell';

export default function MethodologyPage() {
  return (
    <SiteShell
      title="Scoring Methodology & Pricing Formula"
      subtitle="promptbill.online/methodology · Transparent Calculations"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <p className="text-sm text-slate-600">
          Every model on PromptBill is evaluated across capability benchmarks, Score/$ value ratio, and monthly cost formulas:
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 space-y-1.5">
          <div>Score/$ = Benchmark Score ÷ Output Rate ($/1M)</div>
          <div>Effective Calls = Calls/Day × 30 × (1 + Retry%)</div>
          <div>Blended Input Rate = ((1 - Cache%) × Input$/1M + Cache% × Cached$/1M) × BatchFactor</div>
          <div>Estimated Monthly Cost = (EffectiveCalls × InputTokens × BlendedInputRate + EffectiveCalls × OutputTokens × OutputRate) / 1,000,000</div>
        </div>
      </section>
    </SiteShell>
  );
}
