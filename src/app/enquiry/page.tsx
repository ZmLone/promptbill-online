import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { EnquiryForm } from '../../components/EnquiryForm';

export const metadata: Metadata = {
  title: 'Enquiry & Advertise on PromptBill',
  description:
    'Company and individual enquiries, sponsorship packages, and advertising opportunities on PromptBill (promptbill.online) for LLM API & developer audiences.',
};

function EnquirySketch() {
  return (
    <svg
      viewBox="0 0 360 220"
      className="w-full max-w-[340px] h-auto block select-none"
      role="presentation"
      aria-hidden="true"
    >
      {/* Minimalist ink line-art inspired by the split editorial layout */}
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

      <path
        d="M 88 184 C 88 148, 108 126, 144 122 L 166 122 C 180 122, 188 130, 188 142 L 188 184"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="152" cy="96" r="14" fill="none" stroke="#1e293b" strokeWidth="1.5" />
      <path
        d="M 139 92 C 141 80, 158 78, 165 88 C 160 88, 154 90, 150 96 C 145 96, 141 95, 139 92 Z"
        fill="#1e293b"
      />
      <path
        d="M 164 128 C 176 112, 186 92, 186 68 L 194 52"
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

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

export default function EnquiryPage() {
  return (
    <SiteShell
      title="Enquiry & Advertise"
      subtitle="promptbill.online · Companies, Individuals & Sponsorships"
    >
      <div className="space-y-5 sm:space-y-6">
        <BreadcrumbSchema items={[{ name: 'Enquiry & Advertise', href: '/enquiry' }]} />

        <div className="rounded-2xl sm:rounded-3xl bg-[#22d38a] p-2 sm:p-4 md:p-6 shadow-xs">
          <div className="rounded-xl sm:rounded-2xl bg-white px-4 py-6 sm:px-8 sm:py-9 md:px-10 md:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold tracking-tight text-slate-900 leading-[1.15]">
                    Partner, Enquire &amp; Advertise.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                    For companies, API providers, and individuals looking to advertise, sponsor placements, or collaborate around LLM token pricing and benchmarks.
                  </p>
                </div>

                <div className="pt-1">
                  <EnquirySketch />
                </div>
              </div>

              <div className="lg:col-span-7">
                <EnquiryForm />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">General support</p>
                <Link
                  href="/contact"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  Contact Form
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">Live token rates</p>
                <Link
                  href="/pricing"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  API Pricing Table
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400">About &amp; policies</p>
                <Link
                  href="/about"
                  className="inline-block text-xs sm:text-sm font-bold text-slate-900 hover:text-[#059669] transition-colors"
                >
                  About PromptBill
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
