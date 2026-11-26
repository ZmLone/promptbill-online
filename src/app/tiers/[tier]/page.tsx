import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '../../../components/SiteShell';
import { ALL_MODELS } from '../../../lib/catalog';
import { TIER_HUBS } from '../../../lib/hubs';

export const dynamicParams = false;

export function generateStaticParams() {
  return TIER_HUBS.map((t) => ({ tier: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier: tierSlug } = await params;
  const hub = TIER_HUBS.find((t) => t.slug === tierSlug);
  if (!hub) {
    return { title: 'Tier Not Found | PromptBill' };
  }

  return {
    title: hub.title,
    description: hub.description,
    alternates: {
      canonical: `https://promptbill.online/tiers/${hub.slug}`,
    },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url: `https://promptbill.online/tiers/${hub.slug}`,
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

export default async function TierHubPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierSlug } = await params;
  const hub = TIER_HUBS.find((t) => t.slug === tierSlug);
  if (!hub) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchingModels = (ALL_MODELS as any[])
    .filter((m) => !m.archived && hub.predicate(m))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `https://promptbill.online/tiers/${hub.slug}#webpage`,
        url: `https://promptbill.online/tiers/${hub.slug}`,
        name: hub.headline,
        description: hub.description,
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
              name: hub.shortTitle,
              item: `https://promptbill.online/tiers/${hub.slug}`,
            },
          ],
        },
      },
      {
        '@type': 'ItemList',
        '@id': `https://promptbill.online/tiers/${hub.slug}#itemlist`,
        name: hub.headline,
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
      title={hub.headline}
      subtitle={`promptbill.online/tiers/${hub.slug} · ${matchingModels.length} Matching Models`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8 pb-14">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-slate-900">Tier Guide &amp; Filter</h2>
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/models"
                className="rounded-xl border border-slate-200 px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-50"
              >
                ← All Models
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-xl bg-slate-900 px-3.5 py-2 font-semibold text-white hover:bg-slate-800"
              >
                Full Leaderboard
              </Link>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{hub.summary}</p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {TIER_HUBS.map((t) => (
              <Link
                key={t.slug}
                href={`/tiers/${t.slug}`}
                className={`rounded-full px-3.5 py-1.5 font-semibold ${
                  t.slug === hub.slug
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.shortTitle}
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
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
                      {m.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">{m.provider}</p>
                  </div>
                  {typeof m.score === 'number' ? (
                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-900 ring-1 ring-emerald-200">
                      {m.score.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {m.bestFor || m.notes || `${m.provider} model`}
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
