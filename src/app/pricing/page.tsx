import React from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
export default function Page() {
  return (
    <SiteShell title="API Token Pricing" subtitle="promptbill.online/pricing">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs font-mono">
        {ALL_MODELS.map((m) => <div key={m.id} className="flex justify-between py-1.5 border-b border-slate-100"><Link href={`/models/${m.slug}`} className="font-sans font-semibold text-slate-900 underline">{m.name}</Link><span>In ${m.inputPer1M} / Cache ${m.cachedInputPer1M} / Out ${m.outputPer1M}</span></div>)}
      </div>
    </SiteShell>
  );
}
