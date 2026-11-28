import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NEWS_CATEGORIES,
  formatNewsDate,
  formatRateUsd,
  getNewsByCategory,
} from '../../lib/news';

const BASE_URL = 'https://promptbill.online';

export const metadata: Metadata = {
  title: 'LLM API Pricing News & Model Updates | PromptBill',
  description:
    'Track LLM API price updates, new model releases, endpoint changes, and benchmark shifts across providers on PromptBill.',
  alternates: {
    canonical: `${BASE_URL}/news`,
  },
  openGraph: {
    title: 'LLM API Pricing News & Model Updates | PromptBill',
    description:
      'Track LLM API price updates, new model releases, endpoint changes, and benchmark shifts across providers on PromptBill.',
    url: `${BASE_URL}/news`,
    siteName: 'PromptBill',
    type: 'website',
  },
};

interface NewsIndexPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function NewsPage({ searchParams }: NewsIndexPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams?.category || 'All';
  const articles = getNewsByCategory(activeCategory);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${BASE_URL}/news#webpage`,
        url: `${BASE_URL}/news`,
        name: 'LLM API Pricing News & Model Updates',
        description:
          'Tracked LLM API rate changes, new models, endpoint updates, and benchmark notes on PromptBill.',
        isPartOf: {
          '@id': `${BASE_URL}/#website`,
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: articles.map((item, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_URL}/news/${item.slug}`,
            name: item.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'News',
            item: `${BASE_URL}/news`,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <header className="space-y-2 border-b border-slate-200 pb-5">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>{' '}
          / <span className="text-slate-800 font-medium">News</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          LLM API Pricing News &amp; Updates
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Focused updates on token rate shifts, endpoint changes, new model releases, and benchmark
          movements linked directly to model pages and cost tools.
        </p>

        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <Link
            href="/news"
            className={`rounded-full px-3 py-1.5 font-semibold border ${
              activeCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </Link>
          {NEWS_CATEGORIES.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <Link
                key={cat}
                href={`/news?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-3 py-1.5 font-semibold border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No updates found in this category yet.{' '}
          <Link href="/news" className="font-semibold text-emerald-800 underline">
            View all news
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-950">
                    {article.category}
                  </span>
                  <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time>
                </div>
                {article.relatedModelSlugs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {article.relatedModelSlugs.map((slug) => (
                      <Link
                        key={slug}
                        href={`/models/${slug}`}
                        className="font-semibold text-emerald-800 hover:underline"
                      >
                        /models/{slug} →
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                <Link href={`/news/${article.slug}`} className="hover:text-emerald-800">
                  {article.title}
                </Link>
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">{article.summary}</p>

              {article.priceDeltas && article.priceDeltas.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono">
                  {article.priceDeltas.map((delta, i) => (
                    <span
                      key={`${delta.modelSlug}-${i}`}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-800"
                    >
                      {delta.modelName}
                      {delta.endpointHost ? ` (${delta.endpointHost})` : ''}:{' '}
                      {formatRateUsd(delta.oldInputPer1M)}/{formatRateUsd(delta.oldOutputPer1M)} →{' '}
                      <strong className="text-slate-950">
                        {formatRateUsd(delta.newInputPer1M)}/{formatRateUsd(delta.newOutputPer1M)}
                      </strong>{' '}
                      per 1M
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="pt-1">
                <Link
                  href={`/news/${article.slug}`}
                  className="inline-flex items-center text-xs font-bold text-emerald-800 hover:underline"
                >
                  Read full breakdown &amp; workload impact →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
