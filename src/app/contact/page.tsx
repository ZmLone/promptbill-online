import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Contact PromptBill',
  description: 'Get in touch with promptbill.online for feedback, model updates, or sponsorship inquiries.',
  alternates: { canonical: 'https://promptbill.online/contact' },
};

export default function ContactPage() {
  return (
    <SiteShell title="Contact PromptBill" subtitle="promptbill.online/contact">
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          Have a question about model pricing, benchmark data, or partnerships on <code>https://promptbill.online</code>?
        </p>
        <p>
          Visit our <Link href="/advertise" className="underline font-semibold text-emerald-700">Advertise &amp; Sponsorships</Link> page or review our <Link href="/methodology" className="underline font-semibold text-emerald-700">Methodology</Link>.
        </p>
      </article>
    </SiteShell>
  );
}
