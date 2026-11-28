import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Price History & Verification Log — Rate Snapshots | PromptBill';
const DESCRIPTION =
  'Inspect catalog verification timestamps, provenance status, and current per-1M input and output token rates across tracked models on PromptBill.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing/price-history` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing/price-history`,
    siteName: 'PromptBill',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function Page() {
  const sortedHistory = [...ALL_MODELS].sort((a, b) => {
    const dA = a.pricingProvenance?.lastVerified ?? '';
    const dB = b.pricingProvenance?.lastVerified ?? '';
    return dB.localeCompare(dA);
  });

  const verifiedCount = sortedHistory.filter(
    (m) => m.pricingProvenance?.status === 'Verified'
  ).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/price-history`,
        name: TITLE,
        description: DESCRIPTION,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'LLM Pricing', item: `${BASE_URL}/pricing` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Price History',
            item: `${BASE_URL}/pricing/price-history`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does PromptBill record pricing verification dates and historical changes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every model row displays its current per-1M input and output rates, provenance status (Verified or Estimated), and last verification date, showing N/A where prior historical deltas are not recorded.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <PricingSectionNav active="price-history" />

        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Verification &amp; Rate Snapshot Log
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            API Price History &amp; Verification Log
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Chronological catalog verification dates, provenance status, and current per-1M-token rates across all tracked models.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{sortedHistory.length} Catalog Records</span>
            <span>{verifiedCount} Verified</span>
            <span>Prior Delta: N/A Where Unrecorded</span>
          </div>
        </header>

        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Last Verified</th>
                <th scope="col" className="py-3 px-4">Provenance</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Prior Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {sortedHistory.map((m, idx) => {
                const dateStr = m.pricingProvenance?.lastVerified
                  ? m.pricingProvenance.lastVerified.slice(0, 10)
                  : 'N/A';
                const statusStr = m.pricingProvenance?.status ?? 'Estimated';
                return (
                  <tr
                    key={m.id}
                    className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <th scope="row" className="py-3 px-4 font-sans font-normal text-left">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-semibold text-slate-950 hover:underline underline-offset-2"
                      >
                        {m.name}
                      </Link>
                      <div className="text-xs text-slate-600">{m.provider}</div>
                    </th>
                    <td className="py-3 px-4 text-xs text-slate-800 tabular-nums">{dateStr}</td>
                    <td className="py-3 px-4 font-sans text-xs">
                      <span
                        className={
                          statusStr === 'Verified'
                            ? 'text-emerald-800 font-medium'
                            : 'text-amber-800 font-medium'
                        }
                      >
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.inputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                      {fmtRate(m.outputPer1M)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-600 tabular-nums">N/A</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Rate Provenance &amp; Audit Standards
          </h2>
          <p className="leading-relaxed">
            Estimated entries lack a primary source timestamp in the current catalog snapshot. Missing historical deltas show N/A.{' '}
            <Link href="/methodology" className="underline underline-offset-2 text-slate-900 font-medium">
              Methodology
            </Link>
            .
          </p>
        </footer>
      </div>
    </SiteShell>
  );
}
