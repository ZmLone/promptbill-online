import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { FileLock2, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for PromptBill (promptbill.online), covering analytics, advertising disclosures, contact submissions, and data handling.',
};

const EFFECTIVE_DATE = 'November 25, 2026';

export default function PrivacyPolicyPage() {
  return (
    <SiteShell
      title="Privacy Policy"
      subtitle="promptbill.online · Data & Privacy Disclosures"
    >
      <div className="space-y-6">
        <BreadcrumbSchema items={[{ name: 'Privacy Policy', href: '/privacy-policy' }]} />

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
          <div className="border-b border-slate-100 pb-4 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
              <FileLock2 className="w-3.5 h-3.5" />
              <span>Effective Date: {EFFECTIVE_DATE}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Privacy Policy for PromptBill
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Applies to <strong>https://promptbill.online</strong> and related pages operated under PromptBill.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">1. Information We Collect</h3>
            <p>
              You can browse PromptBill&apos;s pricing tables, calculators, leaderboards, and comparison pages without creating an account. Depending on how you interact with the site, information may include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Contact form messages:</strong> When you submit the contact form on <code>/contact</code>, we collect your name, email address, topic, and message content so we can reply or address your inquiry.
              </li>
              <li>
                <strong>Usage &amp; diagnostic telemetry:</strong> Standard server logs, performance metrics, and product analytics help measure page speed, route reliability, and feature usage.
              </li>
              <li>
                <strong>Calculator &amp; session inputs:</strong> Token counts, model selections, or routing assumptions entered into interactive calculators are used to compute estimates in your session.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">2. Analytics, Cookies &amp; Advertising</h3>
            <p>
              PromptBill uses analytics tools (such as Vercel Analytics / Speed Insights and PostHog) to understand aggregate site performance and traffic patterns, and may display advertising via Google AdSense where configured.
            </p>
            <p className="text-slate-600">
              Third-party analytics and advertising providers may set or read cookies, local storage items, or browser signals in accordance with their own privacy policies. You can manage cookies and site data directly through your browser settings or use browser privacy controls.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">3. How We Use Information</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Respond to messages, bug reports, broken link reports, and pricing feedback sent through the contact form.</li>
              <li>Maintain site security, prevent abuse or spam, and diagnose rendering or routing issues.</li>
              <li>Improve pricing tables, calculators, and documentation across <code>promptbill.online</code>.</li>
            </ul>
            <p className="text-slate-600">
              We do not sell personal contact form submissions to third-party data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">4. Data Retention &amp; Security</h3>
            <p className="text-slate-600">
              We take reasonable technical measures—such as HTTPS transport, security headers, and access controls—to protect transmitted data. Contact inquiries are retained only as long as reasonably needed to handle your request, resolve follow-ups, or maintain operational records. No internet transmission or storage system can be guaranteed 100% immune to risk.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">5. Your Choices &amp; Contact</h3>
            <p className="text-slate-600">
              To ask a question about this policy, request removal of a contact message you submitted, or report a privacy or security concern, reach out via the{' '}
              <Link href="/contact" className="font-semibold text-emerald-800 underline hover:text-emerald-950">
                Contact page
              </Link>
              .
            </p>
          </section>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Last updated: {EFFECTIVE_DATE}</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
            >
              <span>Go to Contact Form</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
