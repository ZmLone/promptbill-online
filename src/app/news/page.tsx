import type { Metadata } from 'next';
import Link from 'next/link';
import {
  EDITORIAL_AUTHOR_NAME,
  formatNewsDate,
  formatUsdPer1M,
  getAllNewsArticles,
  type NewsCategory,
} from '@/lib/news';
import { ShareBar } from '@/components/news/ShareBar';

export const metadata: Metadata = {
  title: 'LLM API Pricing News, Price Drops & Model Launches | PromptBill',
  description:
    'Daily tracked LLM API token price drops, new model launches, benchmark shifts, and endpoint rate updates across OpenRouter, Together AI, DeepInfra, Fireworks, and Bedrock.',
  keywords: [
    'LLM API pricing news',
    'AI token price drop',
    'new LLM models API cost',
    'OpenRouter pricing updates',
    'inference endpoint pricing',
  ],
  alternates: {
    canonical: 'https://promptbill.online/news',
  },
  openGraph: {
    title: 'LLM API Pricing News, Price Drops & Model Launches | PromptBill',
    description:
      'Verified LLM API rate changes, new model releases, and inference endpoint updates tracked by PromptBill Research.',
    url: 'https://promptbill.online/news',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM API Pricing News & Model Updates | PromptBill',
    description:
      'Verified LLM API token price drops, model launches, and endpoint rate comparisons.',
  },
};

function categoryBadgeStyle(category: NewsCategory): string {
  switch (category) {
    case 'Price Drop':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'New Model':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'Benchmark Shift':
      return 'bg-violet-50 text-violet-800 border-violet-200';
    case 'Deprecation':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-900 border-amber-200';
  }
}

export default function NewsIndexPage() {
  const articles = getAllNewsArticles();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'LLM API Pricing News & Model Updates',
    description:
      'Verified LLM API price changes, model launches, and endpoint updates tracked by PromptBill Research.',
    url: 'https://promptbill.online/news',
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://promptbill.online/news/${article.slug}`,
        name: article.title,
      })),
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-500 flex items-center gap-2">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">News</span>
      </nav>

      <header className="max-w-3xl space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
          API Rate &amp; Release Wire · {EDITORIAL_AUTHOR_NAME}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          LLM API Pricing &amp; Endpoint News
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Verified per-1M token rate changes, new model rollouts, monthly cost benchmarks, and
          inference endpoint updates tracked by {EDITORIAL_AUTHOR_NAME}.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700">No news updates published yet.</p>
          <Link
            href="/models"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Browse Live Model Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => {
            const articleUrl = `https://promptbill.online/news/${article.slug}`;
            const authorLabel =
              !article.authorName || /zeeshan|mushtaq|lone/i.test(article.authorName)
                ? EDITORIAL_AUTHOR_NAME
                : article.authorName;

            return (
              <article
                key={article.slug}
                className="group rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2.5 text-xs mb-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold ${categoryBadgeStyle(
                      article.category
                    )}`}
                  >
                    {article.category}
                  </span>
                  {article.featured ? (
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Featured
                    </span>
                  ) : null}
                  <time dateTime={article.publishedAt} className="text-slate-500 font-medium">
                    {formatNewsDate(article.publishedAt)}
                  </time>
                  <span className="text-slate-400">· {authorLabel}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 group-hover:text-slate-700 transition-colors">
                  <Link href={`/news/${article.slug}`}>{article.title}</Link>
                </h2>

                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {article.summary}
                </p>

                {article.keyTakeaways.length > 0 ? (
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc pl-5">
                    {article.keyTakeaways.slice(0, 3).map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                ) : null}

                {article.priceDeltas.length > 0 ? (
                  <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-100/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-3.5 py-2.5">Model</th>
                          <th className="px-3.5 py-2.5">Endpoint</th>
                          <th className="px-3.5 py-2.5">Input / 1M</th>
                          <th className="px-3.5 py-2.5">Output / 1M</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 bg-white font-mono">
                        {article.priceDeltas.map((delta, i) => (
                          <tr key={`${delta.modelSlug}-${i}`}>
                            <td className="px-3.5 py-2.5 font-sans font-semibold text-slate-900">
                              <Link
                                href={`/models/${delta.modelSlug}`}
                                className="hover:underline"
                              >
                                {delta.modelName}
                              </Link>
                            </td>
                            <td className="px-3.5 py-2.5 font-sans text-slate-600">
                              {delta.endpointHost || delta.provider}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-900">
                              {delta.oldInputPer1M != null ? (
                                <span className="text-slate-400 line-through mr-1.5">
                                  {formatUsdPer1M(delta.oldInputPer1M)}
                                </span>
                              ) : null}
                              <span className="font-semibold">
                                {formatUsdPer1M(delta.newInputPer1M)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-900">
                              {delta.oldOutputPer1M != null ? (
                                <span className="text-slate-400 line-through mr-1.5">
                                  {formatUsdPer1M(delta.oldOutputPer1M)}
                                </span>
                              ) : null}
                              <span className="font-semibold">
                                {formatUsdPer1M(delta.newOutputPer1M)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <ShareBar
                    url={articleUrl}
                    title={article.title}
                    summary={article.summary}
                    compact
                  />

                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-600"
                  >
                    Read full analysis →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
