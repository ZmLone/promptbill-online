import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'Privacy Policy & Advertising Cookies',
  alternates: { canonical: 'https://promptbill.online/privacy-policy' },
};

export default function Page() {
  return (
    <SiteShell title="Privacy Policy & Advertising Cookies" subtitle="promptbill.online/privacy-policy">
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p><strong>PromptBill</strong> (<code>https://promptbill.online</code>) respects visitor privacy. Core cost and token calculators run directly in your browser.</p>
        <h2 className="text-base font-bold text-slate-900">Google Advertising Cookies</h2>
        <p>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to <code>promptbill.online</code> or other websites. Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="underline text-emerald-700">Google Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="underline text-emerald-700">www.aboutads.info</a>.</p>
      </article>
    </SiteShell>
  );
}
