import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { ContactForm } from '../../components/ContactForm';
import { Mail, MessageSquare, Shield, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact PromptBill',
  description:
    'Send feedback, report a broken link or outdated token rate, or ask a question about PromptBill (promptbill.online).',
};

export default function ContactPage() {
  return (
    <SiteShell
      title="Contact PromptBill"
      subtitle="promptbill.online · Feedback, Corrections & Inquiries"
    >
      <div className="space-y-6">
        <BreadcrumbSchema items={[{ name: 'Contact', href: '/contact' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct Message Form</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Send a message</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Spotted an outdated API rate, a 404 link, or a calculation bug? Send the details below and include a reply email if you want a response.
              </p>
            </div>

            <ContactForm />
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900">How Messages Reach You</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Submissions post to <code>/api/contact</code> on Vercel and can be forwarded straight to your email via Resend or to a webhook (Discord, Slack, or automation endpoint) using environment variables—while also appearing in your Vercel function logs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Related Pages</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <Link
                  href="/about"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <span>About PromptBill</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  href="/privacy-policy"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <span>Privacy Policy</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
