import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Contact PromptBill',
  alternates: { canonical: 'https://promptbill.online/contact' },
};

export default function Page() {
  return (
    <SiteShell title="Contact PromptBill" subtitle="promptbill.online/contact">
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>Have a question about model pricing, benchmark data, or partnerships on <code>https://promptbill.online</code>? Reach out via our <a href="/advertise" className="underline font-semibold text-emerald-700">Advertise &amp; Sponsorships</a> page or review our <a href="/methodology" className="underline font-semibold text-emerald-700">Methodology</a>.</p>
      </article>
    </SiteShell>
  );
}
