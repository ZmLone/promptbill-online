import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Benchmark Methodology',
  alternates: { canonical: 'https://promptbill.online/methodology' },
};

export default function Page() { return <SiteShell title="Methodology" subtitle="promptbill.online/methodology"><div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">Benchmark rankings, Elo scores, Tok/s speed, and per-1M token pricing metrics.</div></SiteShell>; }
