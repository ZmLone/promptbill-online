import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { PricingTableClient } from '../../components/PricingTableClient';

const BASE_URL = 'https://promptbill.online';

export const metadata: Metadata = {
  title: 'API Token Pricing Table — Input, Cached & Output Rates',
  description:
    'Token pricing entries per 1 million input, cached input, and output tokens with provenance status on PromptBill.',
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing`,
    siteName: 'PromptBill',
    title: 'API Token Pricing Table — Input, Cached & Output Rates',
    description:
      'Token pricing entries per 1 million input, cached input, and output tokens with provenance status on PromptBill.',
  },
  twitter: {
    card: 'summary',
    title: 'API Token Pricing Table — Input, Cached & Output Rates',
    description:
      'Token pricing entries per 1 million input, cached input, and output tokens with provenance status on PromptBill.',
  },
};

function fmtRate(val: number | null): string {
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
            name: 'API Token Pricing',
            item: `${BASE_URL}/pricing`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'LLM API Token Pricing Directory',
        numberOfItems: ALL_MODELS.length,
        itemListElement: ALL_MODELS.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — In ${fmtRate(m.inputPer1M)} / Out ${fmtRate(m.outputPer1M)} per 1M`,
        })),
      },
    ],
  };

  return (
    <SiteShell
      title="API Token Pricing Table"
      subtitle="promptbill.online/pricing · Rates per 1M Tokens & Provenance Status"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 leading-relaxed">
          <strong>Provenance Notice:</strong> Values marked <strong>Estimated</strong> lack a verified primary source URL or check timestamp in the current catalog snapshot and must not be treated as verified official provider quotes. Missing values show <strong>N/A</strong>. See{' '}
          <Link href="/methodology" className="font-bold underline">
            Methodology
          </Link>
          .
        </div>

        <PricingTableClient models={ALL_MODELS} />
      </div>
    </SiteShell>
  );
}
