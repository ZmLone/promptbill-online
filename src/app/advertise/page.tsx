import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { EnquiryForm } from '../../components/EnquiryForm';
import {
  Megaphone,
  Calculator,
  BarChart3,
  Scale,
  FileText,
  Sparkles,
  ShieldCheck,
  Layers,
  CheckCircle2,
  ArrowDownRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advertise & Sponsor on PromptBill',
  description:
    'Reach AI engineers, founders, and technical buyers comparing LLM API pricing, token costs, and benchmarks on PromptBill (promptbill.online). Explore placements, sponsorships, and submit an enquiry.',
  alternates: {
    canonical: 'https://promptbill.online/advertise',
  },
};

const advertiseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://promptbill.online/advertise#webpage',
  url: 'https://promptbill.online/advertise',
  name: 'Advertise & Sponsor on PromptBill',
  inLanguage: 'en',
  dateModified: '2026-11-25',
  description:
    'Advertising placements, sponsored spotlights, and partnership options for LLM API providers, AI gateways, and developer tools on PromptBill.',
  isPartOf: {
    '@id': 'https://promptbill.online/#website',
  },
  about: {
    '@id': 'https://promptbill.online/#organization',
  },
};

const PLACEMENT_OPTIONS = [
  {
    icon: Calculator,
    title: 'Token Cost Calculator Spotlight',
    location: 'Homepage & Calculator Views',
    badge: 'High Intent',
    description:
      'Place a clearly labeled sponsored card alongside the workload calculator where engineers estimate monthly token spend across input, output, cached, and batch rates.',
    idealFor: 'Inference providers, LLM routers, and cost-optimization gateways.',
  },
  {
    icon: BarChart3,
    title: 'Pricing Table & Leaderboard Feature',
    location: '/pricing & Benchmark Leaderboard',
    badge: 'High Visibility',
    description:
      'Highlight your API platform, gateway, or developer tool at the top of pricing and speed comparison views with a transparent "Sponsored" badge.',
    idealFor: 'Model hosts, serverless GPU platforms, and multi-model API aggregators.',
  },
  {
    icon: Scale,
    title: 'Head-to-Head Comparison Sponsorship',
    location: 'Model vs. Model Comparison Routes',
    badge: 'Contextual',
    description:
      'Sponsor specific comparison pages when teams evaluate latency, throughput (tok/s), context windows, and per-1M token economics between competing models.',
    idealFor: 'Alternative inference endpoints, fine-tuning platforms, and eval suites.',
  },
  {
    icon: FileText,
    title: 'Sponsored Technical Guide or Benchmark Note',
    location: 'Dedicated Editorial & Resource Slot',
    badge: 'Deep Dive',
    description:
      'Publish a clearly disclosed technical walkthrough, latency benchmark summary, or prompt-caching case study tailored to teams optimizing production LLM spend.',
    idealFor: 'Observability tools, caching layers, vector/RAG infrastructure, and AI SDKs.',
  },
];

const OTHER_WAYS = [
  {
    title: 'Launch & Credits Announcements',
    detail:
      'Promote new model releases, free inference tiers, or startup API credit grants to builders evaluating providers.',
  },
  {
    title: 'Custom Multi-Page Packages',
    detail:
      'Combine a calculator spotlight, leaderboard banner, and comparison page presence across a 30-day or quarterly campaign.',
  },
  {
    title: 'Individual Creator & Indie Tool Sponsorships',
    detail:
      'Flexible, lightweight placements for solo founders and indie dev-tool makers launching open-source or commercial AI utilities.',
  },
  {
    title: 'Direct Provider Data & Endpoint Verification',
    detail:
      'Work with us to keep your official token rates, context limits, and batch/caching tiers accurately reflected across PromptBill.',
  },
];

export default function AdvertisePage() {
  return (
    <SiteShell
      title="Advertise on PromptBill"
      subtitle="promptbill.online · Sponsorships, Placements & Partnerships"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(advertiseJsonLd) }}
      />

      <div className="space-y-6 sm:space-y-8">
        <BreadcrumbSchema items={[{ name: 'Advertise', href: '/advertise' }]} />

        {/* Hero Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
              <Megaphone className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>For Companies, API Providers &amp; Indie Builders</span>
            </div>
            <a
              href="#advertise-enquiry-form"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#22d38a] hover:bg-[#19be7a] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition-colors"
            >
              <span>Jump to Enquiry Form</span>
              <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Reach developers and AI teams actively comparing LLM API costs.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Visitors come to <strong>promptbill.online</strong> with a clear buying and architecture intent: calculating monthly token budgets, comparing per-1M token rates, testing prompt caching and batch discounts, and selecting faster inference endpoints.
            </p>
          </div>

          {/* 3-pillar value strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Decision-Stage Audience</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Engage founders, AI engineers, and technical leads right while they model API spend and choose providers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Clear Sponsored Labeling</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every placement is cleanly badged so developer trust in PromptBill&apos;s benchmark and rate tables stays intact.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Layers className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Flexible Campaigns</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Options for both enterprise API platforms and individual creators, with direct setup and fast turnaround.
              </p>
            </div>
          </div>
        </section>

        {/* Where & How You Can Advertise */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Where &amp; How You Can Advertise
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Choose a single high-intent placement or combine multiple touchpoints across PromptBill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {PLACEMENT_OPTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-emerald-800 mt-0.5">
                        Placement: {item.location}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <strong className="text-slate-800">Best for:</strong> {item.idealFor}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Other Ways to Advertise & Partner + How It Works */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Other Ways to Advertise &amp; Partner With Us
            </h2>
            <div className="space-y-3.5">
              {OTHER_WAYS.map((way) => (
                <div
                  key={way.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{way.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{way.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-emerald-400/15 border border-emerald-400/30 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                Simple 3-Step Process
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                How Advertising Works
              </h2>
              <ol className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-400">1.</span>
                  <span>
                    <strong className="text-white">Send your enquiry below:</strong> Pick Company or Individual, choose your preferred placement and budget tier, and share your campaign goal.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-400">2.</span>
                  <span>
                    <strong className="text-white">Confirm slot &amp; creative:</strong> We reply by email with available dates, placement details, and simple copy/link specs.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-400">3.</span>
                  <span>
                    <strong className="text-white">Go live on PromptBill:</strong> Your sponsored placement goes live cleanly across desktop and mobile without intrusive pop-ups.
                  </span>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
              Need general support or a rate correction instead? Visit{' '}
              <Link href="/contact" className="font-semibold text-emerald-400 hover:underline">
                /contact
              </Link>
              .
            </div>
          </div>
        </section>

        {/* Embedded Enquiry & Advertise Form */}
        <section
          id="advertise-enquiry-form"
          className="scroll-mt-6 rounded-2xl sm:rounded-3xl bg-[#22d38a] p-2 sm:p-4 md:p-6 shadow-xs"
        >
          <div className="rounded-xl sm:rounded-2xl bg-white px-4 py-6 sm:px-8 sm:py-9 md:px-10 md:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-5 space-y-3">
                <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
                  Enquiry &amp; Advertise Form
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                  Start a Sponsorship or Campaign Enquiry.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Fill out the form whether you represent an AI company, API gateway, or individual developer tool. Every submission goes straight to our inbox for review.
                </p>
                <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                  <p>• No phone number required — reply directly via email</p>
                  <p>• Supports both Company and Individual enquiries</p>
                  <p>• Custom multi-placement packages available</p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <EnquiryForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
