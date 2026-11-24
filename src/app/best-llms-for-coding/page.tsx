import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, type CatalogModel } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Best LLMs for Coding — Benchmark Scores & API Pricing',
  description:
    'Compare models tracked on PromptBill by coding score (CO), overall benchmark score, official API token pricing per 1M tokens, and throughput.',
  alternates: {
    canonical: '/best-llms-for-coding',
  },
};

function compareNullable(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

export default function Page() {
  const list: CatalogModel[] = [...ALL_MODELS].sort((a, b) => {
    const byCo = compareNullable(a.co, b.co);
    if (byCo !== 0) return byCo;
    return compareNullable(a.score, b.score);
  });

  return (
    <SiteShell
      title="Best LLMs for Coding"
      subtitle="promptbill.online/best-llms-for-coding · Coding Scores, Official API Rates & Speed"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-700">
          Models are ordered by coding score (CO) where available, with missing or unverified metrics displayed as{' '}
          <strong className="font-semibold">N/A</strong> rather than guessed. See{' '}
          <Link href="/methodology" className="font-semibold text-emerald-800 underline">
            Methodology
          </Link>{' '}
          for evidence and provenance rules.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              LLMs ordered for coding workflows with score, coding score, official API price per 1M tokens, and speed
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
                      {m.provider} · Score: {m.benchmarkProvenance.status}
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
