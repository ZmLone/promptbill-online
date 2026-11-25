import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { ContactForm } from '../../components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact PromptBill',
  description:
    'Send feedback, report a broken link or outdated token rate, or ask a question about PromptBill (promptbill.online).',
};

function LineArtSketch() {
  return (
    <svg
      viewBox="0 0 360 220"
      className="w-full max-w-[340px] h-auto block select-none"
      role="presentation"
      aria-hidden="true"
    >
      {/* Minimalist editorial ink line-art inspired by the reference layout */}
      {/* Desk & laptop */}
      <line x1="168" y1="176" x2="296" y2="176" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 206 176 L 222 132 L 284 132 L 268 176"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="224" y1="142" x2="274" y2="142" stroke="#1e293b" strokeWidth="1.1" strokeOpacity="0.6" />
      <line x1="220" y1="152" x2="270" y2="152" stroke="#1e293b" strokeWidth="1.1" strokeOpacity="0.6" />

      {/* Person torso, head & raised arm */}
      <path
        d="M 88 184 C 88 148, 108 126, 144 122 L 166 122 C 180 122, 188 130, 188 142 L 188 184"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Head & hair */}
      <circle cx="152" cy="96" r="14" fill="none" stroke="#1e293b" strokeWidth="1.5" />
      <path
        d="M 139 92 C 141 80, 158 78, 165 88 C 160 88, 154 90, 150 96 C 145 96, 141 95, 139 92 Z"
        fill="#1e293b"
      />
      {/* Raised arm reaching up */}
      <path
        d="M 164 128 C 176 112, 186 92, 186 68 L 194 52"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Paper airplane at top right */}
      <path
        d="M 196 48 L 286 26 L 254 64 L 228 54 Z"
        fill="#ffffff"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 286 26 L 228 54 L 236 66 L 254 64"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Subtle flight motion lines */}
      <path
        d="M 206 66 C 222 72, 244 74, 268 68"
        fill="none"
        stroke="#10b981"
        strokeWidth="1.3"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <SiteShell
      title="Contact PromptBill"
      subtitle="promptbill.online · Feedback, Corrections & Inquiries"
    >
      <div className="space-y-5 sm:space-y-6">
        <BreadcrumbSchema items={[{ name: 'Contact', href: '/contact' }]} />

        {/* Emerald-framed editorial container matching reference layout */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#22d38a] p-2 sm:p-4 md:p-6 shadow-xs">
          <div className="rounded-xl sm:rounded-2xl bg-white px-4 py-6 sm:px-8 sm:py-9 md:px-10 md:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left editorial column: headline, subcopy & minimalist line art */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold tracking-tight text-slate-900 leading-[1.15]">
                    Let&apos;s Make Token Costs Clear.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                    Tell us what you&apos;re building or testing—we&apos;ll help sort out pricing updates, model comparisons, or site feedback.
                  </p>
                </div>

                <div className="pt-1">
                  <LineArtSketch />
                </div>
              </div>

              {/* Right form column */}
              <div className="lg:col-span-7">
                <ContactForm />
              </div>
            </div>

            {/* Bottom 3-column quick links row matching reference */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">Pricing &amp; data</p>
                <Link
                  href="/pricing"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  API Pricing Table
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">About PromptBill</p>
                <Link
                  href="/about"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  Our Mission &amp; Scope
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">Data &amp; privacy</p>
                <Link
                  href="/privacy-policy"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
