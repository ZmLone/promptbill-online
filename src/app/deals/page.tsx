import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'API Deals & Savings',
  alternates: { canonical: 'https://promptbill.online/deals' },
};

export default function Page() { return <SiteShell title="Deals" subtitle="promptbill.online/deals"><div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">PromptBill Pro Pass &amp; API cost-saving strategies.</div></SiteShell>; }
