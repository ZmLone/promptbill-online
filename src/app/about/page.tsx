import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'About PromptBill',
  alternates: { canonical: 'https://promptbill.online/about' },
};

export default function Page() {
  return (
    <SiteShell title="About PromptBill" subtitle="promptbill.online/about">
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p><strong>PromptBill</strong> (<code>https://promptbill.online</code>) helps developers and AI teams compare large language model capabilities, throughput, and API token costs before shipping to production.</p>
      </article>
    </SiteShell>
  );
}
