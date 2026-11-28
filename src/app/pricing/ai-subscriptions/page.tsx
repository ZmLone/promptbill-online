import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'AI Subscriptions Pricing — ChatGPT Plus, Claude Pro, Google AI Pro & Perplexity Pro | PromptBill';
const DESCRIPTION =
  'Compare flat monthly AI subscription plans against pay-as-you-go LLM token APIs on PromptBill.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing/ai-subscriptions` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing/ai-subscriptions`,
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

const PLANS = [
  {
    id: 'chatgpt-plus',
    plan: 'ChatGPT Plus',
    provider: 'OpenAI',
    billing: 'Monthly',
    price: '$20.00',
    workloadFit: 'Interactive frontier chat, reasoning, image tools & web sessions',
    apiBreakEven: '~2M–4M blended API tokens/mo',
  },
  {
    id: 'claude-pro',
    plan: 'Claude Pro',
    provider: 'Anthropic',
    billing: 'Monthly',
    price: '$20.00',
    workloadFit: 'Long-document analysis, coding workspaces & interactive drafting',
    apiBreakEven: '~1.5M–3.5M blended API tokens/mo',
  },
  {
    id: 'google-ai-pro',
    plan: 'Google AI Pro',
    provider: 'Google',
    billing: 'Monthly',
    price: '$19.99',
    workloadFit: 'Gemini web workflows, large-context uploads & Workspace tools',
    apiBreakEven: '~2M–5M blended API tokens/mo',
  },
  {
    id: 'perplexity-pro',
    plan: 'Perplexity Pro',
    provider: 'Perplexity',
    billing: 'Monthly',
    price: '$20.00',
    workloadFit: 'Cited live web search, multi-model routing & research queries',
    apiBreakEven: 'Search-augmented query workloads',
  },
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/ai-subscriptions`,
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
            name: 'AI Subscriptions',
            item: `${BASE_URL}/pricing/ai-subscriptions`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Should I pay for a monthly AI subscription or use pay-as-you-go API tokens?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Choose a flat monthly subscription for daily interactive browser chat and personal research; choose pay-as-you-go APIs when building automated pipelines, apps, or batch jobs.',
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

        <PricingSectionNav active="ai-subscriptions" />

        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Flat Monthly Plans vs. Token APIs
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            AI Subscriptions Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Compare flat monthly consumer and pro AI plans against equivalent pay-as-you-go API token volume.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{PLANS.length} Major Plans</span>
            <span>$19.99–$20.00 / mo</span>
            <span>Flat Monthly Billing</span>
          </div>
        </header>

        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Plan</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4">Primary Use Case</th>
                <th scope="col" className="py-3 px-4">API Token Reference</th>
                <th scope="col" className="py-3 px-4 text-right">Monthly Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {PLANS.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <th scope="row" className="py-3 px-4 font-sans font-semibold text-left text-slate-950">
                    {row.plan}
                  </th>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.provider}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.workloadFit}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.apiBreakEven}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-950 tabular-nums">
                    {row.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Calculating Your Exact API Break-Even
          </h2>
          <p className="leading-relaxed">
            Use the{' '}
            <Link href="/#estimator" className="underline underline-offset-2 text-slate-900 font-medium">
              30-Day API Spend Calculator
            </Link>{' '}
            to test whether your daily token volume costs less on pay-as-you-go endpoints than a $20/month seat.
          </p>
        </footer>
      </div>
    </SiteShell>
  );
}
