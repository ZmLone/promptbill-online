import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { getRegistryFreshnessSummary } from '../../lib/freshness';

export const metadata: Metadata = {
  title: 'Methodology & Data Provenance',
  description:
    'How PromptBill handles official vs. router API pricing, evidence statuses, missing data, benchmark limitations, and verification timestamps.',
  alternates: {
    canonical: '/methodology',
  },
};

export default function MethodologyPage() {
  const freshness = getRegistryFreshnessSummary();

  return (
    <SiteShell
      title="Methodology, Data Provenance & Limitations"
      subtitle="promptbill.online/methodology · Pricing Sources, Evidence Rules & Evaluation Caveats"
    >
      <div className="space-y-6 text-sm text-slate-700">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Evidence &amp; Provenance Rules</h2>
          <p className="leading-relaxed">
            PromptBill separates data by field and hosting source rather than assigning a single blanket label to an entire model. Every pricing, benchmark, and throughput value is categorized as:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-slate-900">Verified:</strong> Backed by a recorded source URL and verification check timestamp.
            </li>
            <li>
              <strong className="text-slate-900">Estimated:</strong> Retained for reference where an estimate or unverified snapshot exists without a primary benchmark or speed audit log.
            </li>
            <li>
              <strong className="text-slate-900">Unavailable / N/A:</strong> Used when no reliable supporting value exists. Missing values are never replaced with synthetic defaults or silent zeros.
            </li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            Current catalog snapshot: {freshness.totalModels} models ·{' '}
            {freshness.verifiedPricingCount} with verified pricing provenance ·{' '}
            {freshness.estimatedPricingCount} estimated/unverified pricing provenance · Latest recorded check:{' '}
            {freshness.latestVerifiedDate ?? 'Not recorded'}.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Official API vs. Third-Party Hosting &amp; Router Pricing</h2>
          <p className="leading-relaxed">
            A price listed on an API router (such as OpenRouter) or third-party inference host is not treated as the model creator&apos;s official direct API price. Official provider rates and third-party/router endpoints are stored separately with their own rates, batch discount terms, and verification status.
          </p>
          <p className="leading-relaxed">
            Always verify current rates and billing terms directly on the provider&apos;s official documentation before committing production spend.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Benchmark Scores, Speed &amp; Workload Limitations</h2>
          <p className="leading-relaxed">
            No single benchmark score or tokens-per-second (tok/s) number measures general intelligence or predicts how a model will perform on your specific prompts, schemas, languages, or latency budgets.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-slate-900">Missing or unverified metrics:</strong> Models without a recorded score or speed value display <code className="font-mono text-xs">N/A</code> and sort to the bottom rather than receiving artificial scores.
            </li>
            <li>
              <strong className="text-slate-900">Throughput differences:</strong> Output speed (tok/s) depends on prompt length, concurrency, quantization, reasoning effort, and host hardware—comparing raw numbers across different providers or test conditions is approximate.
            </li>
            <li>
              <strong className="text-slate-900">Value ratio:</strong> Where both a numeric score and a positive output price per 1M tokens exist, value is shown as <code className="font-mono text-xs">Score / Output Price ($ per 1M)</code>; models missing either value show <code className="font-mono text-xs">N/A</code>.
            </li>
          </ul>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
            <Link href="/leaderboard" className="text-emerald-800 underline">
              Go to Leaderboard →
            </Link>
            <Link href="/pricing" className="text-emerald-800 underline">
              Go to API Pricing →
            </Link>
            <Link href="/compare" className="text-emerald-800 underline">
              Go to Model Comparisons →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
