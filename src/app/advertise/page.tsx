import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Advertise on PromptBill',
  alternates: { canonical: 'https://promptbill.online/advertise' },
};

export default function Page() { return <SiteShell title="Advertise" subtitle="promptbill.online/advertise"><div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">Sponsorship &amp; partnership inquiries for promptbill.online.</div></SiteShell>; }
