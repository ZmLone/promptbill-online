import React from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
export default function Page() {
  const list = ALL_MODELS.filter((m) => m.license === 'Open').sort((a, b) => b.score - a.score);
  return (
    <SiteShell title="Best Open-Weight LLMs" subtitle="promptbill.online">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs font-mono">
        {list.map((m) => <div key={m.id} className="flex justify-between py-1.5 border-b border-slate-100"><Link href={`/models/${m.slug}`} className="font-sans font-semibold text-slate-900 underline">{m.name}</Link><span>Score {m.score} · ${m.inputPer1M}/${m.outputPer1M} · {m.tokPerSec} tok/s</span></div>)}
      </div>
    </SiteShell>
  );
}
