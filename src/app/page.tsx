import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { SiteShell } from '../components/SiteShell';

export const metadata: Metadata = {
  title: {
    absolute: 'PromptBill — LLM API Pricing & Token Calculator',
  },
  description:
    'LLM API pricing comparison, token cost calculator, and model benchmark table with transparent provenance on PromptBill.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <SiteShell
      title="LLM API Pricing & Token Calculator"
      subtitle="promptbill.online · Catalog Models: {ALL_MODELS.length}"
    >
      <div className="space-y-4 text-sm text-slate-700">
        <p>
          Compare LLM API token rates, estimate monthly token costs, and inspect catalog provenance across {ALL_MODELS.length} models.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="underline font-semibold text-slate-900">
            Pricing Table
          </Link>
          <Link href="/leaderboard" className="underline font-semibold text-slate-900">
            Leaderboard
          </Link>
          <Link href="/compare" className="underline font-semibold text-slate-900">
            Compare Models
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
