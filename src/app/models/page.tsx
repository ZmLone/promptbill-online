import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'All Tracked LLM Models — Pricing, Context & Speed',
  description:
    'Directory of LLM models tracked on PromptBill with official API token pricing per 1M tokens, context windows, and recorded speeds.',
  alternates: {
    canonical: '/models',
  },
};

export default function Page() {
  return (
    <SiteShell
      title="All Tracked Models"
      subtitle="promptbill.online/models · Official API Pricing, Context Windows & Throughput"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_MODELS.map((m) => (
          <Link
            key={m.id}
            href={`/models/${m.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-500/70 transition-colors"
          >
            <div className="font-bold text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {m.provider} · Context: {m.contextWindow ?? 'N/A'}
            </div>
            <div className="mt-2 font-mono text-xs text-slate-800">
              {m.inputPer1M !== null && m.outputPer1M !== null
                ? `$${m.inputPer1M.toFixed(2)}/$${m.outputPer1M.toFixed(2)}`
                : 'Price: N/A'}{' '}
              · {m.tokPerSec !== null ? `${m.tokPerSec} tok/s` : 'Speed: N/A'}
            </div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
