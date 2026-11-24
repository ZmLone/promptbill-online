import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'API Token Pricing Table — Input, Cached & Output Rates',
  description:
    'Official API token pricing per 1 million input, cached input, and output tokens alongside context windows for models tracked on PromptBill.',
  alternates: {
    canonical: '/pricing',
  },
};

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function Page() {
  return (
    <SiteShell
      title="API Token Pricing Table"
      subtitle="promptbill.online/pricing · Official API Rates per 1M Tokens & Provenance"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-700">
          Rates reflect official API entries per 1M tokens where recorded; unverified or missing values display as{' '}
          <strong className="font-semibold">N/A</strong>. See{' '}
          <Link href="/methodology" className="font-semibold text-emerald-800 underline">
            Methodology
          </Link>{' '}
          for how official and third-party hosting prices are separated.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              API Token Pricing per 1 Million Input, Cached Input, and Output Tokens
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
                <th scope="col" className="py-3 px-3.5">Model</th>
                <th scope="col" className="py-3 px-3">Input / 1M</th>
                <th scope="col" className="py-3 px-3">Cached / 1M</th>
                <th scope="col" className="py-3 px-3">Output / 1M</th>
                <th scope="col" className="py-3 px-3.5 text-right">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono">
              {ALL_MODELS.map((m, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-3 px-3.5 font-sans font-normal text-left">
                    <Link
                      href={`/models/${m.slug}`}
                      className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <span className="block text-xs text-slate-600">
                      {m.provider} · {m.pricingProvenance.status}
                    </span>
                  </th>
                  <td className="py-3 px-3 text-slate-900">{fmtRate(m.inputPer1M)}</td>
                  <td className="py-3 px-3 text-emerald-800">{fmtRate(m.cachedInputPer1M)}</td>
                  <td className="py-3 px-3 text-slate-900">{fmtRate(m.outputPer1M)}</td>
                  <td className="py-3 px-3.5 text-right text-slate-800">
                    {m.contextWindow ?? 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SiteShell>
  );
}
