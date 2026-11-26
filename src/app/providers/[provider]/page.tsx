import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '../../../components/SiteShell';
import { ALL_MODELS } from '../../../lib/catalog';
import { getUniqueProviders, slugifyProvider } from '../../../lib/hubs';

export const dynamicParams = false;

export function generateStaticParams() {
  return getUniqueProviders(ALL_MODELS).map((p) => ({ provider: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider: providerSlug } = await params;
  const prov = getUniqueProviders(ALL_MODELS).find((p) => p.slug === providerSlug);
  if (!prov) {
    return { title: 'Provider Not Found | PromptBill' };
  }

  const title = `${prov.name} LLM API Pricing, Models & Benchmarks | PromptBill`;
  const description = `Compare all ${prov.count} tracked ${prov.name} models on PromptBill—input/output token rates per 1M tokens, context windows, benchmark scores, and throughput (tok/s).`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://promptbill.online/providers/${prov.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://promptbill.online/providers/${prov.slug}`,
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
}

function fmtPrice(val: unknown): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default async function ProviderHubPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider: providerSlug } = await params;
  const providers = getUniqueProviders(ALL_MODELS);
  const currentProv = providers.find((p) => p.slug === providerSlug);
  if (!currentProv) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchingModels = (ALL_MODELS as any[])
    .filter((m) => !m.archived && slugifyProvider(String(m.provider || '')) === providerSlug)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `https://promptbill.online/providers/${currentProv.slug}#webpage`,
        url: `https://promptbill.online/providers/${currentProv.slug}`,
        name: `${currentProv.name} LLM Models, API Pricing & Benchmarks`,
        description: `Catalog and benchmark comparison for ${currentProv.name} models tracked on PromptBill.`,
        isPartOf: {
          '@type': 'WebSite',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptbill.online' },
            { '@type': 'ListItem', position: 2, name: 'Models', item: 'https://promptbill.online/models' },
            {
              '@type': 'ListItem',
              position: 3,
              name: currentProv.name,
              item: `https://promptbill.online/providers/${currentProv.slug}`,
            },
          ],
        },
      },
      {
        '@type': 'ItemList',
        '@id': `https://promptbill.online/providers/${currentProv.slug}#itemlist`,
        name: `${currentProv.name} Models`,
        numberOfItems: matchingModels.length,
        itemListElement: matchingModels.map((m, idx) => ({
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
      title={`${currentProv.name} Models, Pricing & Benchmarks`}
      subtitle={`promptbill.online/providers/${currentProv.slug} · ${matchingModels.length} Tracked Models`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8 pb-14">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-slate-900">
              {currentProv.name} Overview
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/models"
                className="rounded-xl border border-slate-200 px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-50"
              >
                ← All Models
              </Link>
              <Link
                href="/compare"
                className="rounded-xl bg-emerald-800 px-3.5 py-2 font-semibold text-white hover:bg-emerald-900"
              >
                Compare Models
              </Link>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            Browse all <strong>{matchingModels.length}</strong> models listed under{' '}
            <strong>{currentProv.name}</strong> on PromptBill. Compare per-1M-token input and output rates, context window sizes, output throughput (tok/s), and benchmark scores.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {providers.map((p) => (
              <Link
                key={p.slug}
                href={`/providers/${p.slug}`}
                className={`rounded-full px-3.5 py-1.5 font-semibold ${
                  p.slug === currentProv.slug
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.name} ({p.count})
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matchingModels.map((m) => (
            <Link
              key={m.slug}
              href={`/models/${m.slug}`}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
                    {m.name}
                  </h3>
                  {typeof m.score === 'number' ? (
                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-900 ring-1 ring-emerald-200">
                      {m.score.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {m.bestFor || m.notes || `${currentProv.name} model`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 font-mono text-xs text-slate-700">
                <span>
                  {fmtPrice(m.inputPer1M)} / {fmtPrice(m.outputPer1M)}
                </span>
                <span className="text-teal-700 font-semibold">
                  {m.contextWindow || '—'} · {m.tokPerSec ? `${m.tokPerSec} t/s` : '—'}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
