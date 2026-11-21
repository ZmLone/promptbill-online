import React from 'react';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
export default function Page() {
  return (
    <SiteShell title="All Tracked Models" subtitle="promptbill.online/models">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ALL_MODELS.map((m) => <Link key={m.id} href={`/models/${m.slug}`} className="rounded-xl border border-slate-200 bg-white p-4"><div className="font-bold text-slate-900">{m.name}</div><div className="text-xs font-mono text-slate-600">${m.inputPer1M}/${m.outputPer1M} · {m.tokPerSec} tok/s</div></Link>)}
      </div>
    </SiteShell>
  );
}
