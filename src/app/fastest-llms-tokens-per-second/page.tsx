import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, type CatalogModel } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Fastest LLMs by Tokens Per Second (Tok/s)',
  description:
    'Compare models ordered by recorded tokens per second (tok/s) alongside benchmark scores and official API pricing per 1M tokens.',
  alternates: {
    canonical: '/fastest-llms-tokens-per-second',
  },
};

function compareNullableDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

export default function Page() {
  const list: CatalogModel[] = [...ALL_MODELS].sort((a, b) =>
    compareNullableDesc(a.tokPerSec, b.tokPerSec)
  );

  return (
    <SiteShell
      title="Fastest LLMs by Tokens Per Second"
      subtitle="promptbill.online/fastest-llms-tokens-per-second · Throughput & Provenance Notes"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-700">
          Ordered by recorded tokens per second (tok/s), with unmeasured models showing{' '}
          <strong className="font-semibold">N/A</strong> at the bottom. Speed varies by prompt length, concurrency, and endpoint hardware.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              LLMs ordered by output tokens per second with benchmark score, coding score, and official API price
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
                <th scope="col" className="py-3 px-3.5">Model</th>
                <th scope="col" className="py-3 px-3">Score</th>
                <th scope="col" className="py-3 px-3">Coding (CO)</th>
                <th scope="col" className="py-3 px-3">Official Price (In / Out)</th>
                <th scope="col" className="py-3 px-3.5 text-right">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {list.map((m, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-3 px-3.5 font-normal text-left">
                    <Link
                      href={`/models/${m.slug}`}
                      className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <div className="text-xs text-slate-600">
                      {m.provider} · Speed: {m.speedProvenance.status}
                    </div>
                  </th>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {m.score !== null ? m.score.toFixed(1) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {m.co !== null ? m.co : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {m.inputPer1M !== null && m.outputPer1M !== null
                      ? `$${m.inputPer1M.toFixed(2)} / $${m.outputPer1M.toFixed(2)}`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-800">
                    {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'N/A'}
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
