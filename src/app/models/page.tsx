import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { ModelJobMatcher } from '../../components/ModelJobMatcher';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT } from '../../lib/modelRegistry';

export const metadata: Metadata = {
  title: 'Models Directory & Workload Finder (2026) — Compare Every LLM API & Specs | PromptBill',
  description:
    'Describe your workload to find the ideal LLM, or browse every tracked AI model with verified benchmark scores, Score/$ efficiency, official API token pricing per 1M tokens, context windows, and speed.',
  keywords: [
    'LLM models directory',
    'which LLM is right for my job',
    'AI model selector',
    'all LLM API pricing',
    'open weight and proprietary LLMs',
    'PromptBill models',
  ],
  alternates: {
    canonical: 'https://promptbill.online/models',
  },
  openGraph: {
    title: 'Models Directory & Workload Finder (2026) | PromptBill',
    description:
      'Match your exact workload constraints to the best LLM, or explore full specifications, pricing, and benchmark data across every model.',
    url: 'https://promptbill.online/models',
    siteName: 'PromptBill',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
};

function fmtPrice(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v) ? `$${v.toFixed(2)}` : 'N/A';
}

export default function ModelsDirectoryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeModels = (ALL_MODELS as any[])
    .filter((m) => !m.archived)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const lastVerifiedIso = REGISTRY_SNAPSHOT.generatedMonthYear || '2026-11-27';

  // Group models by provider for clean directory browsing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byProvider = new Map<string, any[]>();
  for (const m of activeModels) {
    const prov = String(m.provider || 'Other');
    const arr = byProvider.get(prov) || [];
    arr.push(m);
    byProvider.set(prov, arr);
  }
  const providerGroups = Array.from(byProvider.entries()).sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://promptbill.online/models#webpage',
        url: 'https://promptbill.online/models',
        name: 'Models Directory & Workload Finder (2026)',
        description:
          'Interactive LLM workload matcher and complete catalog of tracked large language models with benchmark scores, API token pricing, context windows, and speed.',
        dateModified: lastVerifiedIso,
        isPartOf: {
          '@type': 'WebSite',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://promptbill.online',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Models',
              item: 'https://promptbill.online/models',
            },
          ],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://promptbill.online/models#task-matcher',
        name: 'PromptBill LLM Workload Finder',
        url: 'https://promptbill.online/models',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://promptbill.online/models#itemlist',
        name: 'All Tracked LLMs on PromptBill',
        numberOfItems: activeModels.length,
        itemListElement: activeModels.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: m.name,
          url: `https://promptbill.online/models/${m.slug}`,
        })),
      },
    ],
  };

  return (
    <SiteShell
      title="Models Directory & Workload Finder"
      subtitle="promptbill.online/models · Match Your Job or Browse Every Model Spec & API Rate"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-12 pb-16">
        {/* Interactive "Which model is right for your job?" Section */}
        <ModelJobMatcher />

        {/* Complete Models Catalog Grouped by Provider */}
        <section aria-label="All Tracked Models by Provider" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                All Models ({activeModels.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any model to inspect full benchmark breakdowns, token cost calculators, and provider provenance.
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <Link
                href="/leaderboard"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-emerald-600"
              >
                View Ranked Leaderboard →
              </Link>
              <Link
                href="/compare"
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
              >
                Compare Models →
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            {providerGroups.map(([provider, list]) => (
              <div
                key={provider}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">{provider}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {list.length} {list.length === 1 ? 'model' : 'models'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((m) => {
                    const scorePerDollar =
                      typeof m.score === 'number' && typeof m.outputPer1M === 'number' && m.outputPer1M > 0
                        ? (m.score / m.outputPer1M).toFixed(1)
                        : null;
                    return (
                      <Link
                        key={m.slug}
                        href={`/models/${m.slug}`}
                        className="group rounded-2xl border border-slate-200/85 bg-slate-50/50 p-4 hover:border-emerald-600 hover:bg-white transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">
                              {m.name}
                            </span>
                            {typeof m.score === 'number' ? (
                              <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                                {m.score.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {m.bestFor || m.notes || `${provider} language model`}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 font-mono text-[11px] text-slate-700">
                          <span>
                            {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                          </span>
                          <span>
                            {m.contextWindow || '—'} · {scorePerDollar ? `${scorePerDollar} pts/$` : `${m.tokPerSec ?? '—'} tok/s`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
