import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  EDITORIAL_AUTHOR_NAME,
  EDITORIAL_AUTHOR_URL,
  formatNewsDate,
  formatUsdPer1M,
  getAllNewsArticles,
  getNewsArticleBySlug,
} from '@/lib/news';
import { ShareBar } from '@/components/news/ShareBar';

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
    title: `${article.title} | PromptBill Research`,
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
    twitter: {
      card: 'summary_large_image',
      title: article.title,
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

  const canonical = `https://promptbill.online/news/${article.slug}`;
  const authorName =
    !article.authorName || /zeeshan|mushtaq|lone/i.test(article.authorName)
      ? EDITORIAL_AUTHOR_NAME
      : article.authorName;
  const authorUrl =
    !article.authorUrl || /\/about\/?$/i.test(article.authorUrl)
      ? EDITORIAL_AUTHOR_URL
      : article.authorUrl;

  const primaryDelta = article.priceDeltas[0];
  const faqItems = [
    {
      question: `What is the latest update on ${article.title.split(':')[0]}?`,
      answer: article.summary,
    },
    ...(primaryDelta
      ? [
          {
            question: `How much does ${primaryDelta.modelName} cost per 1M tokens on ${
              primaryDelta.endpointHost || primaryDelta.provider
            }?`,
            answer: `${primaryDelta.modelName} is priced at ${formatUsdPer1M(
              primaryDelta.newInputPer1M
            )} per 1M input tokens and ${formatUsdPer1M(
              primaryDelta.newOutputPer1M
            )} per 1M output tokens${
              primaryDelta.oldInputPer1M != null || primaryDelta.oldOutputPer1M != null
                ? ` (previously ${formatUsdPer1M(primaryDelta.oldInputPer1M)} input / ${formatUsdPer1M(
                    primaryDelta.oldOutputPer1M
                  )} output)`
                : ''
            }.`,
          },
        ]
      : []),
    {
      question: 'Where can I estimate monthly API spend for this model?',
      answer:
        'Use the PromptBill Token Cost Calculator and model comparison pages to model your exact input/output token volume, prompt caching hit rate, and batch discount savings.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.summary,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        mainEntityOfPage: canonical,
        inLanguage: 'en-US',
        author: {
          '@type': 'Organization',
          name: authorName,
          url: authorUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: 'https://promptbill.online',
        },
      },
      {
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
            name: 'News',
            item: 'https://promptbill.online/news',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: canonical,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
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
            <span className="text-slate-500">
              ·{' '}
              <Link href={authorUrl} className="underline hover:text-slate-900">
                {authorName}
              </Link>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">{article.summary}</p>

          <div className="pt-1">
            <ShareBar
              url={canonical}
              title={article.title}
              summary={article.summary}
            />
          </div>
        </header>

        {article.keyTakeaways.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Key Takeaways &amp; Quick Facts
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

        <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-950">Frequently Asked Questions</h2>
          <dl className="space-y-3.5 text-sm">
            {faqItems.map((faq, idx) => (
              <div key={idx} className="space-y-1">
                <dt className="font-semibold text-slate-900">{faq.question}</dt>
                <dd className="text-slate-600 leading-relaxed">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Compare Models, Benchmarks &amp; Estimate Token Costs
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
              Token Cost Calculator
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Compare Models
            </Link>
            <Link
              href="/models"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              All Models Directory
            </Link>
          </div>
        </section>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-600">
            Found this pricing breakdown useful? Share it with your team:
          </span>
          <ShareBar
            url={canonical}
            title={article.title}
            summary={article.summary}
          />
        </div>

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
