import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

const BASE_URL = 'https://promptbill.online';

export const metadata: Metadata = {
  title: 'All Tracked LLM Models — Pricing, Context & Speed',
  description:
    'Directory of LLM models tracked on PromptBill with official API token pricing per 1M tokens, context windows, and recorded speeds.',
  alternates: {
    canonical: `${BASE_URL}/models`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/models`,
    siteName: 'PromptBill',
    title: 'All Tracked LLM Models — Pricing, Context & Speed',
    description:
      'Directory of LLM models tracked on PromptBill with official API token pricing per 1M tokens, context windows, and recorded speeds.',
  },
  twitter: {
    card: 'summary',
    title: 'All Tracked LLM Models — Pricing, Context & Speed',
    description:
      'Directory of LLM models tracked on PromptBill with official API token pricing per 1M tokens, context windows, and recorded speeds.',
  },
};

function fmtPrice(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
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
            name: 'All Tracked Models',
            item: `${BASE_URL}/models`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Tracked LLM Models on PromptBill',
        numberOfItems: ALL_MODELS.length,
        itemListElement: ALL_MODELS.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider})`,
        })),
      },
    ],
  };

  return (
    <SiteShell
      title="All Tracked Models"
      subtitle="promptbill.online/models · Official API Pricing, Context Windows & Throughput"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_MODELS.map((m) => (
          <Link
            key={m.id}
            href={`/models/${m.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-500/70 transition-colors"
          >
            <div className="font-bold text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {m.provider} · Context: {m.contextWindow ?? 'N/A'} ·{' '}
              {m.pricingProvenance.status}
            </div>
            <div className="mt-2 font-mono text-xs text-slate-800">
              {m.inputPer1M !== null && m.outputPer1M !== null
                ? `${fmtPrice(m.inputPer1M)}/${fmtPrice(m.outputPer1M)} per 1M`
                : 'Price: N/A'}{' '}
              · {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'Speed: N/A'}
            </div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
