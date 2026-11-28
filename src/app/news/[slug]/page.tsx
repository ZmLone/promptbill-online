import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatNewsDate,
  formatUsdPer1M,
  getAllNewsArticles,
  getNewsArticleBySlug,
} from '@/lib/news';

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllNewsArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) {
    return {
      title: 'Article Not Found | PromptBill',
    };
  }

  const canonical = `https://promptbill.online/news/${article.slug}`;
  return {
    title: `${article.title} | PromptBill News`,
    description: article.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: canonical,
      siteName: 'PromptBill',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const canonical = `https://promptbill.online/news/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Person',
      name: article.authorName || 'Zeeshan Mushtaq Lone',
      url: article.authorUrl || 'https://promptbill.online/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-xs text-slate-500 flex flex-wrap items-center gap-2"
      >
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/news" className="hover:text-slate-900">
          News
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900 truncate max-w-[240px]">{article.title}</span>
      </nav>

      <article className="space-y-8">
        <header className="space-y-4 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-800">
              {article.category}
            </span>
            <time dateTime={article.publishedAt} className="text-slate-500 font-medium">
              Published {formatNewsDate(article.publishedAt)}
            </time>
            {article.authorName ? (
              <span className="text-slate-500">
                · By{' '}
                {article.authorUrl ? (
                  <Link href={article.authorUrl} className="underline hover:text-slate-900">
                    {article.authorName}
                  </Link>
                ) : (
                  article.authorName
                )}
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">{article.summary}</p>
        </header>

        {article.keyTakeaways.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Key Takeaways
            </h2>
            <ul className="space-y-2 text-sm text-slate-800 list-disc pl-5">
              {article.keyTakeaways.map((point, idx) => (
                <li key={idx} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {article.priceDeltas.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-950">Verified Rate Comparison (USD / 1M)</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Old In</th>
                    <th className="px-4 py-3">New In</th>
                    <th className="px-4 py-3">Old Out</th>
                    <th className="px-4 py-3">New Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {article.priceDeltas.map((delta, idx) => (
                    <tr key={`${delta.modelSlug}-${idx}`}>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                        <Link href={`/models/${delta.modelSlug}`} className="hover:underline">
                          {delta.modelName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600">
                        {delta.endpointHost || delta.provider}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatUsdPer1M(delta.oldInputPer1M)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-950">
                        {formatUsdPer1M(delta.newInputPer1M)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatUsdPer1M(delta.oldOutputPer1M)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-950">
                        {formatUsdPer1M(delta.newOutputPer1M)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div className="space-y-6">
          {article.sections.map((sec, idx) => (
            <section key={idx} className="space-y-2.5">
              <h2 className="text-xl font-bold text-slate-950">{sec.heading}</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        {article.relatedModelSlugs.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Compare Models &amp; Estimate Token Costs
            </h2>
            <div className="flex flex-wrap gap-2">
              {article.relatedModelSlugs.map((mSlug) => (
                <Link
                  key={mSlug}
                  href={`/models/${mSlug}`}
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Open {mSlug} →
                </Link>
              ))}
              <Link
                href="/calculator"
                className="inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Open Token Cost Calculator
              </Link>
            </div>
          </section>
        ) : null}

        {article.sourceUrls.length > 0 ? (
          <footer className="border-t border-slate-200 pt-5 space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">Sources &amp; Verification</div>
            <ul className="space-y-1">
              {article.sourceUrls.map((src, idx) => (
                <li key={idx}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-950 break-all"
                  >
                    {src.label}: {src.url}
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}
      </article>
    </main>
  );
}
