import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { ContactForm } from '../../components/ContactForm';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact PromptBill',
  description:
    'Send feedback, report a broken link or outdated token rate, or ask a question about PromptBill (promptbill.online).',
};

export default function ContactPage() {
  return (
    <SiteShell
      title="Contact PromptBill"
      subtitle="promptbill.online · Feedback, Corrections & Direct Support"
    >
      <div className="space-y-5 sm:space-y-6">
        <BreadcrumbSchema items={[{ name: 'Contact', href: '/contact' }]} />

        <ContactForm />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600">
            Looking to advertise, sponsor a placement, or inquire as a company or individual?
          </p>
          <Link
            href="/enquiry"
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <span>Open Enquiry &amp; Advertise Form</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
