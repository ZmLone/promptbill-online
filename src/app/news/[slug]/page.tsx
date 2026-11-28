import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  computePctDelta,
  formatNewsDate,
  formatRateUsd,
  getAllNewsArticles,
  getNewsArticleBySlug,
  getRelatedNewsArticles,
} from '../../../lib/news';

const BASE_URL = 'https://promptbill.online';

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllNewsArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) {
    return {
      title: 'Update Not Found | PromptBill',
    };
  }

  const canonicalUrl = `${BASE_URL}/news/${article.slug}`;
  return {
    title: `${article.title} | PromptBill`,
    description: article.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${article.title} | PromptBill`,
      description: article.summary,
      url: canonicalUrl,
      siteName: 'PromptBill',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.authorName || 'Zeeshan Mushtaq Lone'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | PromptBill`,
      description: article.summary,
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const canonicalUrl = `${BASE_URL}/news/${article.slug}`;
  const authorName = article.authorName || 'Zeeshan Mushtaq Lone';
  const authorUrl = article.authorUrl || `${BASE_URL}/about`;
  const relatedModels = article.relatedModelSlugs
    .map((mSlug) => ALL_MODELS.find((m) => m.slug === mSlug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const moreNews = getRelatedNewsArticles(article.slug, article.category, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${canonicalUrl}#article`,
        headline: article.title,
        description: article.summary,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        url: canonicalUrl,
        inLanguage: 'en',
        articleSection: article.category,
        author: {
          '@type': 'Person',
          name: authorName,
          url: authorUrl,
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'PromptBill',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/icon.png`,
          },
        },
        isPartOf: {
          '@id': `${BASE_URL}/#website`,
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
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-7">
          <header className="space-y-3 border-b border-slate-200 pb-6">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-900">
                Home
              </Link>
              <span>/</span>
              <Link href="/news" className="hover:text-slate-900">
                News
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-800 line-clamp-1">{article.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-950">
                {article.category}
              </span>
              <time dateTime={article.publishedAt} className="font-mono">
                Published {formatNewsDate(article.publishedAt)}
              </time>
              {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                <time dateTime={article.updatedAt} className="font-mono text-slate-500">
                  · Updated {formatNewsDate(article.updatedAt)}
                </time>
              ) : null}
              <span>
                · By{' '}
                <Link href="/about" className="font-semibold text-slate-900 hover:underline">
                  {authorName}
                </Link>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">
              {article.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{article.summary}</p>
          </header>

          {/* Answer-First Key Takeaways Box for GEO & Scannability */}
          <section
            aria-label="Key Takeaways"
            className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:p-5 space-y-2.5"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Key Takeaways
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-800 leading-relaxed">
              {article.keyTakeaways.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </section>

          {/* Structured Rate Delta Table */}
          {article.priceDeltas && article.priceDeltas.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950">
                Rate Comparison (USD per 1M Tokens)
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-800 font-semibold">
                      <th className="py-2.5 px-3.5">Model</th>
                      <th className="py-2.5 px-3.5">Endpoint</th>
                      <th className="py-2.5 px-3.5">Previous In / Out</th>
                      <th className="py-2.5 px-3.5">Updated In / Out</th>
                      <th className="py-2.5 px-3.5">Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {article.priceDeltas.map((d, i) => {
                      const inShift = computePctDelta(d.oldInputPer1M, d.newInputPer1M);
                      const outShift = computePctDelta(d.oldOutputPer1M, d.newOutputPer1M);
                      return (
                        <tr key={`${d.modelSlug}-${i}`} className="bg-white">
                          <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-950">
                            <Link
                              href={`/models/${d.modelSlug}`}
                              className="hover:text-emerald-800 hover:underline"
                            >
                              {d.modelName}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3.5 font-sans text-slate-600">
                            {d.endpointHost || d.provider}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            {formatRateUsd(d.oldInputPer1M)} / {formatRateUsd(d.oldOutputPer1M)}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-950">
                            {formatRateUsd(d.newInputPer1M)} / {formatRateUsd(d.newOutputPer1M)}
                          </td>
                          <td className="py-2.5 px-3.5 text-xs text-slate-700">
                            {inShift || outShift
                              ? `In ${inShift || '0.0%'} · Out ${outShift || '0.0%'}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* Editorial Body Sections */}
          <div className="space-y-6">
            {article.sections.map((sec, idx) => (
              <section key={idx} className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-950">{sec.heading}</h2>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{sec.body}</p>
              </section>
            ))}
          </div>

          {/* Sources Footer */}
          {article.sourceUrls.length > 0 ? (
            <footer className="border-t border-slate-200 pt-5 text-xs text-slate-600 space-y-2">
              <div className="font-bold uppercase tracking-wider text-slate-800">
                Sources &amp; Reference Links
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {article.sourceUrls.map((src, idx) => (
                  <li key={idx}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-800 hover:underline"
                    >
                      {src.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>

        {/* Right Sticky Action & Related Updates Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-950">Model Calculators &amp; Comparisons</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check full endpoint pricing, cached reads, context windows, and monthly token spend:
            </p>
            <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
              {relatedModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/models/${m.slug}`}
                  className="rounded-xl border border-emerald-700 bg-emerald-50 px-3.5 py-2.5 text-emerald-950 hover:bg-emerald-100 transition-colors"
                >
                  {m.name} Details &amp; Calculator →
                </Link>
              ))}
              <Link
                href="/compare"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Compare Across Models →
              </Link>
              <Link
                href="/pricing/price-history"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 hover:bg-slate-100 transition-colors"
              >
                View Historical Rate Chart →
              </Link>
              <Link
                href="/news"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← All Pricing News
              </Link>
            </div>
          </div>

          {moreNews.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-950">More Updates on PromptBill</h2>
              <ul className="divide-y divide-slate-100 text-xs">
                {moreNews.map((item) => (
                  <li key={item.slug} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <Link
                      href={`/news/${item.slug}`}
                      className="font-semibold text-slate-900 hover:text-emerald-800 block leading-snug"
                    >
                      {item.title}
                    </Link>
                    <div className="font-mono text-[11px] text-slate-500">
                      {formatNewsDate(item.publishedAt)} · {item.category}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
