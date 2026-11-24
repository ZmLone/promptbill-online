import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, type CatalogModel } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Best Open-Weight LLMs — Scores, Pricing & Speed',
  description:
    'Open-weight models tracked on PromptBill with benchmark scores, API pricing per 1M tokens, and throughput where recorded.',
  alternates: {
    canonical: '/best-open-weight-llms',
  },
};

function compareNullableDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

export default function Page() {
  const openModels: CatalogModel[] = ALL_MODELS
    .filter((m) => m.license === 'Open')
    .sort((a, b) => compareNullableDesc(a.score, b.score));

  return (
    <SiteShell
      title="Best Open-Weight LLMs"
      subtitle="promptbill.online/best-open-weight-llms · Verified Open-Weight License Filter"
    >
      {openModels.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900">
            No models currently have a verified Open license flag in the catalog snapshot.
          </p>
          <p className="text-xs text-slate-600">
            License metadata is set to <code className="font-mono">N/A</code> until verified rather than guessed. View all tracked models on{' '}
            <Link href="/models" className="font-semibold text-emerald-800 underline">
              /models
            </Link>{' '}
            or check{' '}
            <Link href="/leaderboard" className="font-semibold text-emerald-800 underline">
              /leaderboard
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              Open-weight LLMs ranked by benchmark score, coding score, API price per 1M tokens, and speed
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
              {openModels.map((m, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-3 px-3.5 font-normal text-left">
                    <Link
                      href={`/models/${m.slug}`}
                      className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <div className="text-xs text-slate-600">{m.provider}</div>
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
      )}
    </SiteShell>
  );
}
