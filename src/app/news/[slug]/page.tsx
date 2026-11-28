import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  formatNewsDate,
  formatRateUsd,
  getAllNewsArticles,
  getNewsArticleBySlug,
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
  const relatedModels = article.relatedModelSlugs
    .map((mSlug) => ALL_MODELS.find((m) => m.slug === mSlug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

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
        mainEntityOfPage: canonicalUrl,
        author: {
          '@type': 'Person',
          name: 'Zeeshan Mushtaq Lone',
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'PromptBill',
          url: BASE_URL,
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
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <header className="space-y-3 border-b border-slate-200 pb-5">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/news" className="hover:underline">
            News
          </Link>{' '}
          / <span className="text-slate-800 font-medium">{article.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-950">
            {article.category}
          </span>
          <span>Published {formatNewsDate(article.publishedAt)}</span>
          {article.updatedAt && article.updatedAt !== article.publishedAt ? (
            <span>· Updated {formatNewsDate(article.updatedAt)}</span>
          ) : null}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {article.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{article.summary}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
          Key Takeaways
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
          {article.keyTakeaways.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </section>

      {article.priceDeltas && article.priceDeltas.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Rate Comparison (USD per 1M Tokens)</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-semibold">
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3">Previous In / Out</th>
                  <th className="py-2.5 px-3">Updated In / Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {article.priceDeltas.map((d, i) => (
                  <tr key={`${d.modelSlug}-${i}`}>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      <Link href={`/models/${d.modelSlug}`} className="hover:underline">
                        {d.modelName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">
                      {d.endpointHost || d.provider}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatRateUsd(d.oldInputPer1M)} / {formatRateUsd(d.oldOutputPer1M)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-950">
                      {formatRateUsd(d.newInputPer1M)} / {formatRateUsd(d.newOutputPer1M)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="space-y-5">
        {article.sections.map((sec, idx) => (
          <section key={idx} className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">{sec.heading}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{sec.body}</p>
          </section>
        ))}
      </div>

      {relatedModels.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            Related Models &amp; Cost Tools
          </h2>
          <div className="flex flex-wrap gap-2.5 text-xs sm:text-sm">
            {relatedModels.map((m) => (
              <Link
                key={m.slug}
                href={`/models/${m.slug}`}
                className="rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 font-semibold text-emerald-950 hover:bg-emerald-100"
              >
                Open {m.name} Calculator &amp; Endpoints →
              </Link>
            ))}
            <Link
              href="/compare"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Compare Models
            </Link>
            <Link
              href="/tools/token-counter"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Token Counter
            </Link>
          </div>
        </section>
      ) : null}

      {article.sourceUrls.length > 0 ? (
        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Sources &amp; Reference</div>
          <ul className="list-disc pl-5 space-y-1">
            {article.sourceUrls.map((src, idx) => (
              <li key={idx}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-800 underline"
                >
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </main>
  );
}
