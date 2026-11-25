import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'API Token Pricing Table — Input, Cached & Output Rates',
  description:
    'Token pricing entries per 1 million input, cached input, and output tokens with provenance status on PromptBill.',
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
      subtitle="promptbill.online/pricing · Rates per 1M Tokens & Provenance Status"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 leading-relaxed">
          <strong>Provenance Notice:</strong> Values marked <strong>Estimated</strong> lack a verified primary source URL or check timestamp in the current catalog snapshot and must not be treated as verified official provider quotes. Missing values show <strong>N/A</strong>. See{' '}
          <Link href="/methodology" className="font-semibold underline">
            Methodology
          </Link>
          .
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              API Token Pricing per 1 Million Input, Cached Input, and Output Tokens with provenance status
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
              {ALL_MODELS.map((m, idx) => {
                const statusLabel =
                  m.pricingProvenance.status === 'Verified'
                    ? 'Verified Pricing'
                    : m.pricingProvenance.status === 'Estimated'
                    ? 'Estimated (Unverified)'
                    : 'Pricing Unavailable';
                return (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <th scope="row" className="py-3 px-3.5 font-sans font-normal text-left">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <span className="block text-xs text-slate-600">
                        {m.provider} · {statusLabel}
                      </span>
                    </th>
                    <td className="py-3 px-3 text-slate-900">{fmtRate(m.inputPer1M)}</td>
                    <td className="py-3 px-3 text-emerald-800">{fmtRate(m.cachedInputPer1M)}</td>
                    <td className="py-3 px-3 text-slate-900">{fmtRate(m.outputPer1M)}</td>
                    <td className="py-3 px-3.5 text-right text-slate-800">
                      {m.contextWindow ?? 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SiteShell>
  );
}
