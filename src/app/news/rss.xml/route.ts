import { NextResponse } from 'next/server';
import { getAllNewsArticles, formatUsdPer1M } from '@/lib/news';

export const dynamic = 'force-static';

const SITE_URL = 'https://promptbill.online';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = getAllNewsArticles();
  const lastBuildDate = articles[0]?.updatedAt || articles[0]?.publishedAt || new Date().toISOString();

  const itemsXml = articles
    .map((article) => {
      const link = `${SITE_URL}/news/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();

      const deltaLines = (article.priceDeltas || [])
        .map(
          (d) =>
            `${d.modelName} (${d.endpointHost || d.provider}): In ${formatUsdPer1M(
              d.oldInputPer1M
            )} -> ${formatUsdPer1M(d.newInputPer1M)} / 1M, Out ${formatUsdPer1M(
              d.oldOutputPer1M
            )} -> ${formatUsdPer1M(d.newOutputPer1M)} / 1M`
        )
        .join(' | ');

      const fullDesc = deltaLines ? `${article.summary} — ${deltaLines}` : article.summary;

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <category>${escapeXml(article.category)}</category>
      <description>${escapeXml(fullDesc)}</description>
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PromptBill — LLM API Pricing &amp; Endpoint News</title>
    <link>${SITE_URL}/news</link>
    <atom:link href="${SITE_URL}/news/rss.xml" rel="self" type="application/rss+xml" />
    <description>Verified per-1M token rate shifts, new model launches, and inference endpoint updates tracked by PromptBill.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
