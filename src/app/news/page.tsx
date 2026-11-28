import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NEWS_CATEGORIES,
  computePctDelta,
  formatNewsDate,
  formatRateCompact,
  getAllNewsArticles,
  getNewsByCategory,
} from '../../lib/news';

const BASE_URL = 'https://promptbill.online';

export const metadata: Metadata = {
  title: 'LLM API Pricing News, Rate Shifts & Model Releases | PromptBill',
  description:
    'Daily tracked LLM API price drops, rate updates, new model releases, endpoint changes, and benchmark shifts across providers on PromptBill.',
  alternates: {
    canonical: `${BASE_URL}/news`,
  },
  openGraph: {
    title: 'LLM API Pricing News, Rate Shifts & Model Releases | PromptBill',
    description:
      'Daily tracked LLM API price drops, rate updates, new model releases, endpoint changes, and benchmark shifts across providers on PromptBill.',
    url: `${BASE_URL}/news`,
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM API Pricing News, Rate Shifts & Model Releases | PromptBill',
    description:
      'Daily tracked LLM API price drops, rate updates, new model releases, endpoint changes, and benchmark shifts across providers on PromptBill.',
  },
};

interface NewsIndexPageProps {
  searchParams?: Promise<{ category?: string; q?: string }>;
}

export default async function NewsPage({ searchParams }: NewsIndexPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams?.category || 'All';
  const rawQuery = (resolvedParams?.q || '').trim();
  const qLower = rawQuery.toLowerCase();

  const allArticles = getAllNewsArticles();
  const filteredArticles = getNewsByCategory(activeCategory).filter((article) => {
    if (!qLower) return true;
    const hay = [
      article.title,
      article.summary,
      article.category,
      article.relatedModelSlugs.join(' '),
      article.keyTakeaways.join(' '),
      ...(article.priceDeltas || []).map((d) => `${d.modelName} ${d.provider} ${d.endpointHost || ''}`),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(qLower);
  });

  const featuredArticle =
    filteredArticles.find((a) => a.featured) || filteredArticles[0] || null;
  const feedArticles = featuredArticle
    ? filteredArticles.filter((a) => a.slug !== featuredArticle.slug)
    : filteredArticles;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${BASE_URL}/news#webpage`,
        url: `${BASE_URL}/news`,
        name: 'LLM API Pricing News, Rate Shifts & Model Releases',
        description:
          'Tracked LLM API rate changes, new models, endpoint updates, and benchmark notes on PromptBill.',
        isPartOf: {
          '@id': `${BASE_URL}/#website`,
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: filteredArticles.map((item, idx) => ({
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Top Editorial & Search Header */}
      <header className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">News &amp; Rate Updates</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-medium text-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {allArticles.length} Tracked Updates · Synced with Catalog
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
              LLM API Pricing News &amp; Releases
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Clear, data-backed dispatches on per-1M token price drops, rate revisions, new model
              launches, and provider endpoint shifts—linked directly to live cost calculators.
            </p>
          </div>

          <form
            action="/news"
            method="get"
            className="lg:col-span-5 flex items-center gap-2"
            aria-label="Filter news updates"
          >
            {activeCategory !== 'All' ? (
              <input type="hidden" name="category" value={activeCategory} />
            ) : null}
            <input
              type="search"
              name="q"
              defaultValue={rawQuery}
              placeholder="Search model, provider, or rate update..."
              className="min-h-[42px] flex-1 rounded-xl border border-slate-300 bg-slate-50/60 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[42px] rounded-xl bg-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <Link
            href={rawQuery ? `/news?q=${encodeURIComponent(rawQuery)}` : '/news'}
            className={`min-h-[34px] inline-flex items-center rounded-full px-3.5 py-1 font-semibold transition-colors ${
              activeCategory === 'All'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Updates
          </Link>
          {NEWS_CATEGORIES.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            const href = rawQuery
              ? `/news?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(rawQuery)}`
              : `/news?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`min-h-[34px] inline-flex items-center rounded-full px-3.5 py-1 font-semibold transition-colors ${
                  isSelected
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </Link>
            );
          })}
          {rawQuery || activeCategory !== 'All' ? (
            <Link
              href="/news"
              className="ml-auto text-xs font-semibold text-emerald-800 hover:underline"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </header>

      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            No news dispatches match your current filter.
          </p>
          <p className="text-xs text-slate-500">
            Try clearing your search term or switching back to All Updates.
          </p>
          <Link
            href="/news"
            className="inline-flex min-h-[38px] items-center rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            View All News
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Editorial Column */}
          <div className="lg:col-span-8 space-y-6">
            {featuredArticle ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-950">
                      Featured · {featuredArticle.category}
                    </span>
                    <time
                      dateTime={featuredArticle.publishedAt}
                      className="font-mono text-slate-500"
                    >
                      {formatNewsDate(featuredArticle.publishedAt)}
                    </time>
                  </div>
                  <span className="text-slate-500">
                    By {featuredArticle.authorName || 'Zeeshan Mushtaq Lone'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 leading-snug">
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="hover:text-emerald-800 transition-colors"
                  >
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {featuredArticle.summary}
                </p>

                {featuredArticle.priceDeltas && featuredArticle.priceDeltas.length > 0 ? (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tracked Rate Shift (USD per 1M Tokens)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                      {featuredArticle.priceDeltas.map((delta, i) => {
                        const outDeltaPct = computePctDelta(
                          delta.oldOutputPer1M,
                          delta.newOutputPer1M
                        );
                        return (
                          <div
                            key={`${delta.modelSlug}-${i}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex flex-col gap-0.5"
                          >
                            <div className="font-sans font-bold text-slate-900 flex items-center justify-between gap-2">
                              <span>{delta.modelName}</span>
                              {delta.endpointHost ? (
                                <span className="text-[11px] font-normal text-slate-500">
                                  {delta.endpointHost}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-slate-600">
                              In: {formatRateCompact(delta.oldInputPer1M)} →{' '}
                              <strong className="text-slate-950">
                                {formatRateCompact(delta.newInputPer1M)}
                              </strong>{' '}
                              · Out: {formatRateCompact(delta.oldOutputPer1M)} →{' '}
                              <strong className="text-slate-950">
                                {formatRateCompact(delta.newOutputPer1M)}
                              </strong>
                              {outDeltaPct ? (
                                <span className="ml-1 text-amber-800 font-semibold">
                                  ({outDeltaPct} out)
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {featuredArticle.relatedModelSlugs.map((slug) => (
                      <Link
                        key={slug}
                        href={`/models/${slug}`}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                      >
                        /models/{slug} →
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="inline-flex min-h-[36px] items-center rounded-xl bg-slate-950 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Read Full Analysis →
                  </Link>
                </div>
              </article>
            ) : null}

            {/* Remaining Dispatches */}
            <div className="space-y-4">
              {feedArticles.map((article) => (
                <article
                  key={article.slug}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-800">
                        {article.category}
                      </span>
                      <time dateTime={article.publishedAt} className="font-mono">
                        {formatNewsDate(article.publishedAt)}
                      </time>
                    </div>
                    {article.relatedModelSlugs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {article.relatedModelSlugs.map((slug) => (
                          <Link
                            key={slug}
                            href={`/models/${slug}`}
                            className="font-semibold text-emerald-800 hover:underline"
                          >
                            {slug} →
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-950">
                    <Link
                      href={`/news/${article.slug}`}
                      className="hover:text-emerald-800 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed">{article.summary}</p>

                  {article.priceDeltas && article.priceDeltas.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono">
                      {article.priceDeltas.map((delta, i) => (
                        <span
                          key={`${delta.modelSlug}-${i}`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-800"
                        >
                          {delta.modelName}: {formatRateCompact(delta.oldInputPer1M)}/
                          {formatRateCompact(delta.oldOutputPer1M)} →{' '}
                          <strong className="text-slate-950">
                            {formatRateCompact(delta.newInputPer1M)}/
                            {formatRateCompact(delta.newOutputPer1M)}
                          </strong>{' '}
                          / 1M
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="pt-1">
                    <Link
                      href={`/news/${article.slug}`}
                      className="inline-flex items-center text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Read full breakdown →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Utility & Discovery Sidebar */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-950">
                Turn Rate Shifts Into Cost Numbers
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every price update affects real spend differently based on prompt length, output
                verbosity, and caching hit rate. Use PromptBill tools to model your exact traffic:
              </p>
              <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
                <Link
                  href="/pricing"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  API Pricing Matrix →
                </Link>
                <Link
                  href="/pricing/price-history"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Historical Rate Chart →
                </Link>
                <Link
                  href="/compare"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Head-to-Head Model Compare →
                </Link>
                <Link
                  href="/tools/routing-simulator"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Routing Cost Simulator →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-2.5 text-xs">
              <h2 className="text-sm font-bold text-slate-950">Editorial &amp; Verification Standard</h2>
              <p className="text-slate-600 leading-relaxed">
                Updates focus strictly on token pricing, model availability, endpoints, and
                benchmarks. Rates are normalized to USD per 1M tokens with source links and
                transparent provenance.
              </p>
              <div className="pt-1 flex flex-wrap gap-3 font-semibold text-emerald-800">
                <Link href="/methodology" className="hover:underline">
                  Methodology
                </Link>
                <Link href="/about" className="hover:underline">
                  About &amp; Author
                </Link>
                <Link href="/llms.txt" className="hover:underline">
                  llms.txt
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
