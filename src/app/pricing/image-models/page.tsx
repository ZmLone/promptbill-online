import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'Image & Vision Model API Pricing — Token & Per-Image Rates | PromptBill';
const DESCRIPTION =
  'Review vision-capable and multimodal catalog models with per-1M token rates and per-image pricing availability on PromptBill.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing/image-models` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing/image-models`,
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
  const visionModels = ALL_MODELS.filter((m) =>
    /vision|image|flux|gpt-4o|gpt-5|gpt-6|claude|gemini/i.test(`${m.name} ${m.slug}`)
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/image-models`,
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
            name: 'Image Models',
            item: `${BASE_URL}/pricing/image-models`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Vision & Image-Capable Models',
        numberOfItems: visionModels.length,
        itemListElement: visionModels.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — In ${fmtRate(m.inputPer1M)} / Out ${fmtRate(m.outputPer1M)} per 1M`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How are image and multimodal models priced on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Multimodal models that bill by token show verified or estimated per-1M input and output token rates, while dedicated per-image generation rates display N/A when not tracked in the current catalog snapshot.',
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

        <PricingSectionNav active="image-models" />

        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Vision &amp; Multimodal Catalog
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            Image &amp; Multimodal Model Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Multimodal and vision-capable models with normalized token rates and per-image rate status.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{visionModels.length} Multimodal Models</span>
            <span>Per-1M Token Rates</span>
            <span>Per-Image Rate: N/A Where Untracked</span>
          </div>
        </header>

        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Context</th>
                <th scope="col" className="py-3 px-4 text-right">Per-Image Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {visionModels.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <th scope="row" className="py-3 px-4 font-sans font-semibold text-left text-slate-950">
                    <Link href={`/models/${m.slug}`} className="hover:underline underline-offset-2">
                      {m.name}
                    </Link>
                  </th>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{m.provider}</td>
                  <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                    {fmtRate(m.inputPer1M)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                    {fmtRate(m.outputPer1M)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-800 tabular-nums">
                    {m.contextWindow ?? 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 tabular-nums">N/A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Multimodal Token vs. Per-Image Billing
          </h2>
          <p className="leading-relaxed">
            Vision-language models convert image inputs into tokens billed at standard per-1M rates. Dedicated per-image generation endpoints display N/A when not present in the catalog.{' '}
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
